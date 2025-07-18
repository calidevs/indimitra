import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TablePagination,
  InputAdornment,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  ShoppingBag,
  LocalShipping,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useStore';
import { useStore } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { generateClient } from 'aws-amplify/api';
import {
  GET_USER_PROFILE,
  GET_ORDERS_BY_STORE,
  GET_STORE_DRIVERS,
  UPDATE_ORDER_STATUS,
  CANCEL_ORDER,
} from '@/queries/operations';
import Layout from '@/components/StoreManager/Layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchUserAttributes } from 'aws-amplify/auth';
import graphqlService from '@/config/graphql/graphqlService';
import { jsPDF } from 'jspdf';
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

const client = generateClient();

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'ORDER_PLACED', label: 'Order Placed', color: 'info' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'primary' },
  { value: 'READY_FOR_DELIVERY', label: 'Ready for Delivery', color: 'success' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'info' },
  { value: 'PICKED_UP', label: 'Picked Up', color: 'info' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
];

const calculateOrderTotal = (order) => {
  console.log('Calculating total for order:', order);

  if (!order) {
    console.log('No order data provided');
    return 0;
  }

  // Log all the relevant amounts
  console.log('Order amounts:', {
    orderTotalAmount: order.orderTotalAmount,
    totalAmount: order.totalAmount,
    deliveryFee: order.deliveryFee,
    tipAmount: order.tipAmount,
    taxAmount: order.taxAmount,
  });

  // First try to use totalAmount if it exists
  if (order.totalAmount) {
    console.log('Using totalAmount:', order.totalAmount);
    return order.totalAmount;
  }

  // If totalAmount is not available, calculate from order items
  if (order.orderItems?.edges?.length > 0) {
    const itemsTotal = order.orderItems.edges.reduce((sum, { node }) => {
      const amount = node.orderAmount || 0;
      console.log('Adding item amount:', amount);
      return sum + amount;
    }, 0);

    console.log('Calculated total from items:', itemsTotal);
    return itemsTotal;
  }

  console.log('No valid total found, returning 0');
  return 0;
};

// Update the mutation with the correct OrderItemUpdateInput structure
const UPDATE_ORDER_ITEMS = `
  mutation UpdateOrderItems($orderId: Int!, $orderItemUpdates: [OrderItemUpdateInput!]!, $totalAmount: Float!, $orderTotalAmount: Float!, $taxAmount: Float!) {
    updateOrderItems(
      orderId: $orderId,
      orderItemUpdates: $orderItemUpdates,
      totalAmount: $totalAmount,
      orderTotalAmount: $orderTotalAmount,
      taxAmount: $taxAmount
    ) {
      id
      orderItems {
        edges {
          node {
            id
            quantity
            orderAmount
            productId
            updatedOrderitemsId
          }
        }
      }
      totalAmount
      orderTotalAmount
      taxAmount
    }
  }
`;

const StoreOrders = () => {
  const { userProfile } = useAuthStore();
  const [cognitoId, setCognitoId] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelMessage, setCancelMessage] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [driverId, setDriverId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedOrderForDownload, setSelectedOrderForDownload] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Set isInitialLoad to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Fetch Cognito ID on component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userAttributes = await fetchUserAttributes();
        setCognitoId(userAttributes.sub);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Fetch user profile using Cognito ID
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['getUserProfile', cognitoId],
    queryFn: async () => {
      return await graphqlService(GET_USER_PROFILE, { userId: cognitoId });
    },
    enabled: !!cognitoId,
  });

  const storeId = profileData?.getUserProfile?.stores?.edges?.[0]?.node?.id;
  const userId = profileData?.getUserProfile?.id;

  // Fetch drivers for the store
  const {
    data: driversData,
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ['storeDrivers', storeId],
    queryFn: async () => {
      return await graphqlService(GET_STORE_DRIVERS, { storeId });
    },
    enabled: !!storeId,
  });

  // Fetch orders using store ID
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['storeOrders', storeId],
    queryFn: async () => {
      const result = await graphqlService(GET_ORDERS_BY_STORE, { storeId });
      return result.getOrdersByStore || [];
    },
    enabled: !!storeId,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async (variables) => {
      return await graphqlService(UPDATE_ORDER_STATUS, {
        input: {
          orderId: variables.orderId,
          status: variables.status,
          deliveryInstructions: variables.deliveryInstructions || '',
          driverId: variables.driverId || null,
          scheduleTime: variables.scheduleTime || null,
        },
      });
    },
    onSuccess: () => {
      refetchOrders();
      setEditDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus('');
      setDeliveryInstructions('');
      setDriverId('');
      setScheduleTime('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // Update the mutation function to include taxAmount
  const updateOrderItemMutation = useMutation({
    mutationFn: async (variables) => {
      const { orderId, itemId, quantity, price } = variables;

      // Get the current order to access existing fees
      const currentOrder = ordersData.find((order) => order.id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Get store's tax percentage from user profile
      const storeTaxPercentage =
        profileData?.getUserProfile?.stores?.edges?.[0]?.node?.taxPercentage || 0;

      // Get the latest active items for each product
      const latestItems = new Map();
      currentOrder.orderItems.edges.forEach(({ node }) => {
        const productId = node.productId;
        if (!latestItems.has(productId) || node.id > latestItems.get(productId).id) {
          latestItems.set(productId, node);
        }
      });

      // Check if there are any active items after this update
      const hasActiveItems = Array.from(latestItems.values()).some((node) =>
        node.id === parseInt(itemId) ? quantity > 0 : node.quantity > 0
      );

      // If no active items, set all amounts to 0
      if (!hasActiveItems) {
        return await graphqlService(UPDATE_ORDER_ITEMS, {
          orderId: parseInt(orderId),
          orderItemUpdates: [
            {
              orderItemId: parseInt(itemId),
              quantityChange: quantity - selectedItem.quantity,
            },
          ],
          totalAmount: 0,
          orderTotalAmount: 0,
          taxAmount: 0,
        });
      }

      // Calculate total amount from latest active items
      let totalAmount = 0;
      latestItems.forEach((node) => {
        // If this is the item being updated, use the new quantity
        if (node.id === parseInt(itemId)) {
          totalAmount += quantity * price;
        } else {
          // For other items, use their current quantity and price
          const itemPrice = node.product?.inventoryItems?.edges[0]?.node?.price || 0;
          totalAmount += node.quantity * itemPrice;
        }
      });

      // Calculate tax based on the total amount
      const taxAmount = (totalAmount * storeTaxPercentage) / 100;

      // Calculate the final total including all fees
      const finalTotal =
        totalAmount + taxAmount + (currentOrder.deliveryFee || 0) + (currentOrder.tipAmount || 0);

      // Calculate the quantity change for the updated item
      const quantityChange = quantity - selectedItem.quantity;

      return await graphqlService(UPDATE_ORDER_ITEMS, {
        orderId: parseInt(orderId),
        orderItemUpdates: [
          {
            orderItemId: parseInt(itemId),
            quantityChange: quantityChange,
          },
        ],
        totalAmount: totalAmount,
        orderTotalAmount: finalTotal,
        taxAmount: taxAmount,
      });
    },
    onSuccess: () => {
      refetchOrders();
      setEditItemDialogOpen(false);
      setSelectedItem(null);
      setNewQuantity(1);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDeliveryInstructions(order.deliveryInstructions || '');
    setEditDialogOpen(true);
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    try {
      const input = {
        orderId: selectedOrder.id,
        status: newStatus,
        deliveryInstructions: deliveryInstructions,
      };

      // Add driver and schedule time for READY or READY_FOR_DELIVERY status
      if (newStatus === 'READY' || newStatus === 'READY_FOR_DELIVERY') {
        if (!driverId) {
          setError('Driver ID is required for this status');
          return;
        }
        if (!scheduleTime) {
          setError('Schedule time is required for this status');
          return;
        }
        input.driverId = parseInt(driverId);
        input.scheduleTime = scheduleTime;
      }

      await updateOrderStatusMutation.mutateAsync(input);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async () => {
    try {
      if (!userId) {
        setError('User profile not found. Please try again.');
        return;
      }

      await graphqlService(CANCEL_ORDER, {
        orderId: selectedOrder.id,
        cancelMessage: cancelMessage,
        cancelledByUserId: userId,
      });
      setCancelDialogOpen(false);
      setCancelMessage('');
      refetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (order) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Accept any file type
    input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;

        // Get upload URL for PUT operation
        const baseUrl = window.location.href?.includes('http://localhost')
          ? 'http://127.0.0.1:8000'
          : 'https://indimitra.com';

        // Log the original filename for debugging
        console.log('Original filename:', file.name);

        const res = await fetch(
          `${baseUrl}/s3/generate-upload-url?file_name=${encodeURIComponent(file.name)}&order_id=${order.id}`
        );
        if (!res.ok) {
          throw new Error('Failed to get upload URL');
        }
        const { upload_url, content_type, file_name, key } = await res.json();

        // Log the generated filename for debugging
        console.log('Generated filename:', file_name);

        // Upload file to S3 using PUT with exact same Content-Type
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': content_type,
          },
          body: file,
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          console.error('Upload failed:', errorText);
          throw new Error('Failed to upload file');
        }

        // Store the bill URL in the order
        const billUrlRes = await fetch(
          `${baseUrl}/orders/${order.id}/set-bill-url?file_name=${encodeURIComponent(file_name)}`,
          {
            method: 'POST',
          }
        );

        if (!billUrlRes.ok) {
          throw new Error('Failed to update bill URL');
        }

        // After successful upload and bill URL update, try to get the view URL
        const viewRes = await fetch(
          `${baseUrl}/s3/generate-view-url?bill_key=${encodeURIComponent(key)}`
        );

        if (viewRes.ok) {
          setSnackbar({
            open: true,
            message: 'File uploaded and verified successfully!',
            severity: 'success',
          });
        } else {
          setSnackbar({
            open: true,
            message: 'File uploaded but verification failed. Please try viewing the file.',
            severity: 'warning',
          });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setSnackbar({
          open: true,
          message: 'Failed to upload file. Please try again.',
          severity: 'error',
        });
      }
    };
    input.click();
  };

  const handleView = async (order) => {
    try {
      // Get view URL for GET operation
      const baseUrl = window.location.href?.includes('http://localhost')
        ? 'http://127.0.0.1:8000'
        : 'https://indimitra.com';

      let viewUrl = null;
      let fileName = null;

      // If order has a bill_url, use it directly
      if (order.bill_url) {
        console.log('Using stored bill URL:', order.bill_url);
        const res = await fetch(
          `${baseUrl}/s3/generate-view-url?bill_key=${encodeURIComponent(order.bill_url)}`
        );
        if (res.ok) {
          const data = await res.json();
          viewUrl = data.view_url;
          fileName = data.file_name;
        }
      }

      // If no bill_url or file not found, try the old method
      if (!viewUrl) {
        console.log('No stored bill URL found, trying common extensions');
        const commonExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
        for (const ext of commonExtensions) {
          const res = await fetch(
            `${baseUrl}/s3/generate-view-url?order_id=${order.id}&file_name=receipt${ext}`
          );
          if (res.ok) {
            const data = await res.json();
            viewUrl = data.view_url;
            fileName = data.file_name;
            break;
          }
        }
      }

      if (!viewUrl) {
        setSnackbar({
          open: true,
          message: 'No file found for this order.',
          severity: 'warning',
        });
        return;
      }

      // Create a temporary link element to handle the download with the correct filename
      const link = document.createElement('a');
      link.href = viewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to view file. Please try again.',
        severity: 'error',
      });
    }
  };

  const getStatusColor = (status) => {
    return ORDER_STATUSES.find((s) => s.value === status)?.color || 'default';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (!ordersData) return [];

    let filtered = [...ordersData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          (order.deliveryInstructions || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'totalAmount') {
        comparison = a[sortField] - b[sortField];
      } else {
        comparison = String(a[sortField] || '').localeCompare(String(b[sortField] || ''));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [ordersData, searchTerm, statusFilter, sortField, sortOrder]);

  const paginatedOrders = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  // Update the getLatestOrderItem function to handle the current data structure
  const getLatestOrderItem = (orderItems) => {
    console.log('getLatestOrderItem input:', orderItems);

    if (!orderItems?.edges?.length) {
      console.log('No order items found');
      return null;
    }

    // Group items by product ID and get the latest quantity for each product
    const productMap = new Map();

    orderItems.edges.forEach(({ node }) => {
      const productId = node.productId;
      if (!productMap.has(productId) || node.id > productMap.get(productId).id) {
        productMap.set(productId, node);
      }
    });

    const latestItems = Array.from(productMap.values());
    console.log('Latest items found:', latestItems);
    return latestItems;
  };

  // Update the buildItemHistory function to show quantity changes
  const buildItemHistory = (currentItem, allItems) => {
    console.log('Building history for item:', currentItem);
    console.log('All available items:', allItems);

    if (!currentItem || !allItems) {
      console.log('Missing required data for history building');
      return [currentItem];
    }

    // Get all items for the same product, sorted by ID (which represents chronological order)
    const productHistory = allItems
      .map(({ node }) => node)
      .filter((item) => item.productId === currentItem.productId)
      .sort((a, b) => a.id - b.id);

    console.log('Product history:', productHistory);
    return productHistory;
  };

  // Add a helper function to check if order is editable
  const isOrderEditable = (status) => {
    return ['PENDING', 'ORDER_PLACED', 'ACCEPTED'].includes(status);
  };

  // Update the handler functions to include order ID
  const handleEditItem = (item, orderId) => {
    setSelectedItem({ ...item, orderId });
    setNewQuantity(item.quantity);
    setEditItemDialogOpen(true);
  };

  const handleDeleteItem = (item, orderId) => {
    setSelectedItem({ ...item, orderId });
    setNewQuantity(0);
    setEditItemDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    try {
      await updateOrderItemMutation.mutateAsync({
        orderId: selectedItem.orderId,
        itemId: selectedItem.id,
        quantity: newQuantity,
        price: selectedItem.product?.inventoryItems?.edges[0]?.node?.price || 0,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const generatePDF = (orders) => {
    const doc = new jsPDF();
    let yOffset = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;

    // Add title
    doc.setFontSize(16);
    doc.text('Orders Report', margin, yOffset);
    yOffset += lineHeight * 2;

    // Add filters info
    doc.setFontSize(10);
    if (searchTerm) {
      doc.text(`Search Term: ${searchTerm}`, margin, yOffset);
      yOffset += lineHeight;
    }
    if (statusFilter !== 'ALL') {
      doc.text(`Status Filter: ${statusFilter}`, margin, yOffset);
      yOffset += lineHeight;
    }
    yOffset += lineHeight;

    // Add orders
    orders.forEach((order, index) => {
      // Check if we need a new page
      if (yOffset > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yOffset = 20;
      }

      // Order header
      doc.setFontSize(12);
      doc.text(`Order #${order.id}`, margin, yOffset);
      yOffset += lineHeight;
      doc.text(`Order Code: ${order.displayCode || 'N/A'}`, margin, yOffset);
      yOffset += lineHeight * 1.5;

      // Order details
      doc.setFontSize(10);
      const details = [
        `Type: ${order.type === 'PICKUP' ? 'Pickup' : 'Delivery'}`,
        `Status: ${ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status}`,
        `Total: $${order.orderTotalAmount}`,
        `Customer: ${order.creator?.email || 'N/A'}`,
        `Phone: ${order.creator?.mobile || 'N/A'}`,
        `Address: ${order.type === 'PICKUP' ? order.pickupAddress?.address : order.address?.address || 'N/A'}`,
      ];

      details.forEach((detail) => {
        doc.text(detail, margin + 5, yOffset);
        yOffset += lineHeight;
      });

      // Custom Order Details
      if (order.customOrder) {
        yOffset += lineHeight;
        doc.setFontSize(11);
        doc.text('Custom Order Details:', margin + 5, yOffset);
        yOffset += lineHeight;

        // Split by double newlines to separate Q&A pairs
        const qaPairs = order.customOrder.split('\n\n');
        qaPairs.forEach((pair) => {
          const [question, ...answerLines] = pair.split('\n');
          if (question && answerLines.length > 0) {
            doc.setFontSize(10);
            doc.text(`Q: ${question}`, margin + 10, yOffset);
            yOffset += lineHeight;

            // Add each answer line with indentation
            answerLines.forEach((line) => {
              doc.text(`A: ${line}`, margin + 15, yOffset);
              yOffset += lineHeight;
            });
            yOffset += lineHeight * 0.5; // Add some space after each Q&A group
          }
        });
      }

      // Order items
      if (order.orderItems?.edges?.length > 0) {
        yOffset += lineHeight;
        doc.setFontSize(11);
        doc.text('Items:', margin + 5, yOffset);
        yOffset += lineHeight;

        order.orderItems.edges.forEach(({ node }) => {
          const price = node.product?.inventoryItems?.edges[0]?.node?.price || 0;
          const itemText = `${node.product?.name || 'N/A'} - Qty: ${node.quantity} - Price: $${price} - Total: $${node.quantity * price}`;
          doc.text(itemText, margin + 10, yOffset);
          yOffset += lineHeight;
        });
      }

      yOffset += lineHeight * 2;
    });

    return doc;
  };

  const generateDOCX = (orders) => {
    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Orders Report',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: searchTerm ? `Search Term: ${searchTerm}` : '',
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: statusFilter !== 'ALL' ? `Status Filter: ${statusFilter}` : '',
                  size: 24,
                }),
              ],
            }),
            ...orders
              .map((order) => [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Order #${order.id}`,
                      bold: true,
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Order Code: ${order.displayCode || 'N/A'}`,
                      size: 24,
                    }),
                  ],
                }),
                new DocxTable({
                  width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                  },
                  rows: [
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Type')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [
                            new Paragraph(order.type === 'PICKUP' ? 'Pickup' : 'Delivery'),
                          ],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Status')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [
                            new Paragraph(
                              ORDER_STATUSES.find((s) => s.value === order.status)?.label ||
                                order.status
                            ),
                          ],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Total')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(`$${order.orderTotalAmount}`)],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Customer')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(order.creator?.email || 'N/A')],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Phone')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [new Paragraph(order.creator?.mobile || 'N/A')],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                    new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph('Address')],
                          width: { size: 20, type: WidthType.PERCENTAGE },
                        }),
                        new DocxTableCell({
                          children: [
                            new Paragraph(
                              order.type === 'PICKUP'
                                ? order.pickupAddress?.address
                                : order.address?.address || 'N/A'
                            ),
                          ],
                          width: { size: 80, type: WidthType.PERCENTAGE },
                        }),
                      ],
                    }),
                  ],
                }),
                // Custom Order Details
                ...(order.customOrder
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Custom Order Details',
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                      new DocxTable({
                        width: {
                          size: 100,
                          type: WidthType.PERCENTAGE,
                        },
                        rows: (() => {
                          const qaPairs = order.customOrder.split('\n\n');
                          return qaPairs
                            .map((pair) => {
                              const [question, ...answerLines] = pair.split('\n');
                              if (question && answerLines.length > 0) {
                                return new DocxTableRow({
                                  children: [
                                    new DocxTableCell({
                                      children: [new Paragraph(question)],
                                      width: { size: 30, type: WidthType.PERCENTAGE },
                                    }),
                                    new DocxTableCell({
                                      children: [
                                        new Paragraph({
                                          children: answerLines
                                            .map((line, index) => [
                                              new TextRun(line),
                                              ...(index < answerLines.length - 1
                                                ? [new TextRun({ break: 1 })]
                                                : []),
                                            ])
                                            .flat(),
                                        }),
                                      ],
                                      width: { size: 70, type: WidthType.PERCENTAGE },
                                    }),
                                  ],
                                });
                              }
                              return null;
                            })
                            .filter(Boolean);
                        })(),
                      }),
                    ]
                  : []),
                // Order Items
                ...(order.orderItems?.edges?.length > 0
                  ? [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'Items',
                            bold: true,
                            size: 24,
                          }),
                        ],
                      }),
                      new DocxTable({
                        width: {
                          size: 100,
                          type: WidthType.PERCENTAGE,
                        },
                        rows: [
                          new DocxTableRow({
                            children: [
                              new DocxTableCell({
                                children: [new Paragraph('Product')],
                                width: { size: 40, type: WidthType.PERCENTAGE },
                              }),
                              new DocxTableCell({
                                children: [new Paragraph('Quantity')],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                              }),
                              new DocxTableCell({
                                children: [new Paragraph('Price')],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                              }),
                              new DocxTableCell({
                                children: [new Paragraph('Total')],
                                width: { size: 20, type: WidthType.PERCENTAGE },
                              }),
                            ],
                          }),
                          ...order.orderItems.edges.map(({ node }) => {
                            const price = node.product?.inventoryItems?.edges[0]?.node?.price || 0;
                            return new DocxTableRow({
                              children: [
                                new DocxTableCell({
                                  children: [new Paragraph(node.product?.name || 'N/A')],
                                  width: { size: 40, type: WidthType.PERCENTAGE },
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph(node.quantity.toString())],
                                  width: { size: 20, type: WidthType.PERCENTAGE },
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph(`$${price}`)],
                                  width: { size: 20, type: WidthType.PERCENTAGE },
                                }),
                                new DocxTableCell({
                                  children: [new Paragraph(`$${node.quantity * price}`)],
                                  width: { size: 20, type: WidthType.PERCENTAGE },
                                }),
                              ],
                            });
                          }),
                        ],
                      }),
                    ]
                  : []),
                new Paragraph({}), // Add spacing between orders
              ])
              .flat(),
          ],
        },
      ],
    });

    return doc;
  };

  const handleDownload = async (orders, format) => {
    try {
      if (format === 'pdf') {
        const doc = generatePDF(orders);
        doc.save(
          `orders_${new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').replace('Z', '')}.pdf`
        );
      } else {
        const doc = generateDOCX(orders);
        const blob = await Packer.toBlob(doc);
        saveAs(
          blob,
          `orders_${new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').replace('Z', '')}.docx`
        );
      }

      setSnackbar({
        open: true,
        message: `Orders downloaded successfully in ${format.toUpperCase()} format!`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to download orders. Please try again.',
        severity: 'error',
      });
    }
    setDownloadDialogOpen(false);
  };

  if (profileLoading || ordersLoading || driversLoading || isInitialLoad) {
    return (
      <Layout>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
        >
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if ((ordersError || driversError) && !isInitialLoad) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {ordersError?.message || driversError?.message || 'An error occurred'}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Store Orders
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FilterIcon />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="ALL">All Statuses</MenuItem>
                  {ORDER_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Total Orders: {filteredOrders.length}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => setDownloadDialogOpen(true)}
                  disabled={filteredOrders.length === 0}
                >
                  Download Orders
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {filteredOrders.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No orders found.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleSort('id')}
                    >
                      Order ID
                      <SortIcon
                        sx={{
                          ml: 1,
                          transform:
                            sortField === 'id' && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => handleSort('totalAmount')}
                    >
                      Total
                      <SortIcon
                        sx={{
                          ml: 1,
                          transform:
                            sortField === 'totalAmount' && sortOrder === 'desc'
                              ? 'rotate(180deg)'
                              : 'none',
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <TableRow>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>${order.orderTotalAmount}</TableCell>
                      <TableCell>
                        <Chip
                          label={
                            ORDER_STATUSES.find((s) => s.value === order.status)?.label ||
                            order.status
                          }
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Order">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(order)}
                            disabled={!isOrderEditable(order.status)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel Order">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelClick(order)}
                            disabled={!isOrderEditable(order.status)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Upload File">
                          <IconButton
                            size="small"
                            onClick={() => handleUpload(order)}
                            disabled={!isOrderEditable(order.status)}
                          >
                            <UploadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View File">
                          <IconButton size="small" onClick={() => handleView(order)}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                        >
                          {expandedOrder === order.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {expandedOrder === order.id && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              {/* Order Information */}
                              <Grid item xs={12}>
                                <Typography
                                  variant="subtitle1"
                                  gutterBottom
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  Order Information
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={4}>
                                    <Typography>
                                      <strong>Order Code:</strong> {order.displayCode || 'N/A'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography>
                                      <strong>Type:</strong>{' '}
                                      {order.type === 'PICKUP' ? (
                                        <Box
                                          component="span"
                                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                        >
                                          <ShoppingBag fontSize="small" />
                                          Pickup Order
                                        </Box>
                                      ) : (
                                        <Box
                                          component="span"
                                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                        >
                                          <LocalShipping fontSize="small" />
                                          Delivery Order
                                        </Box>
                                      )}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Typography>
                                      <strong>Address:</strong>{' '}
                                      {order.type === 'PICKUP'
                                        ? order.pickupAddress?.address || 'No pickup address'
                                        : order.address?.address || 'No delivery address'}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>

                              {/* Customer Information */}
                              <Grid item xs={12}>
                                <Typography
                                  variant="subtitle1"
                                  gutterBottom
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  Customer Information
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography>Email: {order?.creator?.email || 'N/A'}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography>
                                      Phone: {order?.creator?.mobile || 'N/A'}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Grid>

                              {/* Order Items */}
                              <Grid item xs={12}>
                                <Typography
                                  variant="subtitle1"
                                  gutterBottom
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  Order Items
                                </Typography>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Product</TableCell>
                                      <TableCell>Quantity</TableCell>
                                      <TableCell>Price</TableCell>
                                      <TableCell>Total</TableCell>
                                      <TableCell>Actions</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {order.orderItems?.edges?.length > 0 ? (
                                      getLatestOrderItem(order.orderItems)?.map((node) => {
                                        console.log('Processing order item:', node);
                                        const itemHistory = buildItemHistory(
                                          node,
                                          order.orderItems.edges
                                        );
                                        const price =
                                          node.product?.inventoryItems?.edges[0]?.node?.price || 0;

                                        return (
                                          <React.Fragment key={node.id}>
                                            <TableRow>
                                              <TableCell>{node.product?.name || 'N/A'}</TableCell>
                                              <TableCell>{node.quantity}</TableCell>
                                              <TableCell>{formatCurrency(price)}</TableCell>
                                              <TableCell>
                                                {formatCurrency(node.quantity * price)}
                                              </TableCell>
                                              <TableCell>
                                                {isOrderEditable(order.status) && (
                                                  <>
                                                    <IconButton
                                                      size="small"
                                                      onClick={() => handleEditItem(node, order.id)}
                                                      sx={{ mr: 1 }}
                                                    >
                                                      <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                      size="small"
                                                      onClick={() =>
                                                        handleDeleteItem(node, order.id)
                                                      }
                                                      color="error"
                                                    >
                                                      <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                  </>
                                                )}
                                              </TableCell>
                                            </TableRow>
                                            {itemHistory.length > 1 && (
                                              <TableRow>
                                                <TableCell colSpan={5}>
                                                  <Box sx={{ pl: 2, py: 1 }}>
                                                    <Typography
                                                      variant="caption"
                                                      color="text.secondary"
                                                      sx={{ display: 'block', mb: 1 }}
                                                    >
                                                      Order Change History ({itemHistory.length - 1}{' '}
                                                      changes)
                                                    </Typography>
                                                    {itemHistory.slice(0, -1).map((item, index) => (
                                                      <Box
                                                        key={item.id}
                                                        sx={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 2,
                                                          color: 'text.secondary',
                                                          bgcolor: 'grey.50',
                                                          p: 1,
                                                          borderRadius: 1,
                                                          mb: 1,
                                                        }}
                                                      >
                                                        <Typography
                                                          variant="caption"
                                                          sx={{
                                                            textDecoration: 'line-through',
                                                            color: 'text.secondary',
                                                            minWidth: '100px',
                                                          }}
                                                        >
                                                          Change {index + 1}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 3 }}>
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              textDecoration: 'line-through',
                                                              color: 'text.secondary',
                                                            }}
                                                          >
                                                            Quantity: {item.quantity}
                                                          </Typography>
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              textDecoration: 'line-through',
                                                              color: 'text.secondary',
                                                            }}
                                                          >
                                                            Amount:{' '}
                                                            {formatCurrency(item.orderAmount)}
                                                          </Typography>
                                                        </Box>
                                                      </Box>
                                                    ))}
                                                  </Box>
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </React.Fragment>
                                        );
                                      })
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={5} align="center">
                                          No items found for this order
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </Grid>

                              {/* Custom Order Details */}
                              {order.customOrder && (
                                <Grid item xs={12}>
                                  <Typography
                                    variant="subtitle1"
                                    gutterBottom
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    Custom Order Details
                                  </Typography>
                                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                    {order.customOrder.split('\n\n').map((pair, index) => {
                                      const [question, ...answerLines] = pair.split('\n');
                                      if (question && answerLines.length > 0) {
                                        return (
                                          <Box key={index} sx={{ mb: 2 }}>
                                            <Typography
                                              variant="subtitle2"
                                              sx={{ color: 'text.secondary', mb: 0.5 }}
                                            >
                                              {question}
                                            </Typography>
                                            <Box sx={{ pl: 2 }}>
                                              {answerLines.map((line, lineIndex) => (
                                                <Typography
                                                  key={lineIndex}
                                                  variant="body2"
                                                  sx={{ mb: 0.5 }}
                                                >
                                                  {line}
                                                </Typography>
                                              ))}
                                            </Box>
                                          </Box>
                                        );
                                      }
                                      return null;
                                    })}
                                  </Box>
                                </Grid>
                              )}

                              {/* Order Summary */}
                              <Grid item xs={12}>
                                <Typography
                                  variant="subtitle1"
                                  gutterBottom
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  Order Summary
                                </Typography>
                                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography>Subtotal:</Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography>{formatCurrency(order.totalAmount)}</Typography>
                                    </Grid>

                                    <Grid item xs={6}>
                                      <Typography>Delivery Fee:</Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography>{formatCurrency(order.deliveryFee)}</Typography>
                                    </Grid>

                                    <Grid item xs={6}>
                                      <Typography>Tax:</Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography>{formatCurrency(order.taxAmount)}</Typography>
                                    </Grid>

                                    <Grid item xs={6}>
                                      <Typography>Tip:</Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography>{formatCurrency(order.tipAmount)}</Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                      <Divider sx={{ my: 1 }} />
                                    </Grid>

                                    <Grid item xs={6}>
                                      <Typography sx={{ fontWeight: 'bold' }}>
                                        Total Amount:
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                                      <Typography sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(order.orderTotalAmount)}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Grid>

                              {/* Delivery Instructions */}
                              {order.deliveryInstructions && (
                                <Grid item xs={12}>
                                  <Typography
                                    variant="subtitle1"
                                    gutterBottom
                                    sx={{ fontWeight: 'bold' }}
                                  >
                                    Delivery Instructions
                                  </Typography>
                                  <Typography>{order.deliveryInstructions}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredOrders.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        )}

        {/* Edit Status Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Delivery Instructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              {newStatus === 'READY_FOR_DELIVERY' && (
                <>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Delivery Agent</InputLabel>
                      <Select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        label="Delivery Agent"
                      >
                        {driversData?.getStoreDrivers?.map((storeDriver) => (
                          <MenuItem key={storeDriver.userId} value={storeDriver.userId}>
                            {storeDriver.driver.email} ({storeDriver.driver.mobile})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Schedule Time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      type="datetime-local"
                      required
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleStatusUpdate}
              variant="contained"
              color="primary"
              disabled={updateOrderStatusMutation.isLoading}
            >
              {updateOrderStatusMutation.isLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
          <DialogTitle>Cancel Order</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this order? This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Cancellation Reason"
              value={cancelMessage}
              onChange={(e) => setCancelMessage(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 2 }}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>No</Button>
            <Button
              onClick={handleCancelOrder}
              variant="contained"
              color="error"
              disabled={!cancelMessage.trim()}
            >
              Yes, Cancel Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog
          open={editItemDialogOpen}
          onClose={() => setEditItemDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{newQuantity === 0 ? 'Delete Order Item' : 'Edit Order Item'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">
                  Product: {selectedItem?.product?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItemDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateItem}
              variant="contained"
              color={newQuantity === 0 ? 'error' : 'primary'}
              disabled={updateOrderItemMutation.isLoading}
            >
              {updateOrderItemMutation.isLoading
                ? 'Updating...'
                : newQuantity === 0
                  ? 'Delete'
                  : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Download Format Dialog */}
        <Dialog
          open={downloadDialogOpen}
          onClose={() => setDownloadDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Download Orders</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Download {filteredOrders.length} filtered orders
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {searchTerm && `Search term: ${searchTerm}`}
              {statusFilter !== 'ALL' && `\nStatus: ${statusFilter}`}
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleDownload(filteredOrders, 'pdf')}
                  startIcon={<DownloadIcon />}
                >
                  PDF
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleDownload(filteredOrders, 'docx')}
                  startIcon={<DownloadIcon />}
                >
                  DOCX
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default StoreOrders;
