// In js/src/pages/Products.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Box,
  Button,
  TablePagination,
  Popper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  Paper,
  FormControl,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import StoreIcon from '@mui/icons-material/Storefront';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORE_PRODUCTS } from '@/queries/operations';
import useStore from '@/store/useStore';
import { ProductGrid } from '@components';
import banginapalli from '@/assets/images/products/banginapalli.jpg';
import himayat from '@/assets/images/products/himayat.jpg';
import kesar from '@/assets/images/products/kesar.jpg';
import chinnaRasalu from '@/assets/images/products/chinna-rasalu.png';
import alphonso from '@/assets/images/products/alphonso.png';
import malgova from '@/assets/images/products/malgova.jpg';

// Store-specific product images mapping
const STORE_PRODUCT_IMAGES = {
  1: {
    // Store ID 1
    2: banginapalli, // Banginapalli
    3: himayat, // Himayat / Imam Pasand
    4: kesar, // Kesar
    5: chinnaRasalu, // Chinna Rasalu
    6: alphonso, // Alphonso
    7: malgova, // Malgova
  },
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Products = ({ setStoreModalOpen }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12); // Default rows per page
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef(null);

  const { selectedStore, availableStores, setDeliveryInstructions } = useStore();

  const debouncedSearch = useDebounce(search, 300);

  // Fetch store products when a store is selected
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['storeInventory', selectedStore?.id],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_STORE_PRODUCTS, {
        storeId: selectedStore.id,
        isListed: true, // Only show listed products
      });
      return response;
    },
    enabled: !!selectedStore?.id,
  });

  // Process inventory data to create a products array for the ProductGrid
  const products = useMemo(() => {
    return (
      inventoryData?.getInventoryByStore?.map((item) => {
        const storeId = selectedStore?.id;
        const productId = item.productId;
        const storeImages = STORE_PRODUCT_IMAGES[storeId] || {};

        return {
          id: item.productId,
          name: item.product.name,
          image: item.product.image || storeImages[productId] || 'https://picsum.photos/200',
          price: item.price,
          description: item.product.description,
          categoryId: item.product.category.id,
          categoryName: item.product.category.name,
          inventoryId: item.id,
          quantity: item.quantity,
          measurement: item.measurement,
          unit: item.unit,
          isAvailable: item.isAvailable,
          isListed: item.isListed,
        };
      }) || []
    );
  }, [inventoryData, selectedStore?.id]);

  // Memoize the filtered products with debounced search (no min character check)
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [products, debouncedSearch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(() => {
    return filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  console.log({ visibleRows });

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setDropdownOpen(true);
  };

  const handleClickAway = () => {
    setDropdownOpen(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (search) {
        const currentInstructions = useStore.getState().deliveryInstructions;
        const parts = currentInstructions.split('DELIVERY INSTRUCTIONS');
        const firstPart = parts[0] || '';
        const secondPart = parts[1] || '';

        // Add new text to the first part, preserving existing content
        const newFirstPart = firstPart
          ? `${firstPart} ${search}` // Add a space between existing content and new content
          : search;

        // Only add separator if there's content in the second part
        const newInstructions = secondPart
          ? `${newFirstPart}DELIVERY INSTRUCTIONS\n${secondPart}`
          : newFirstPart;

        setDeliveryInstructions(newInstructions);
        setSearch('');
        setDropdownOpen(false);
      }
    }
  };

  if (inventoryError)
    return <Typography>Error fetching products: {inventoryError.message}</Typography>;

  return (
    <>
      {/* Store Selection */}
      {selectedStore && (
        <Container>
          <Box
            sx={{
              alignItems: 'center',
              mb: 3,
              mt: 2,
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Box>
                <Typography variant="h6">{selectedStore.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedStore.address}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<StoreIcon />}
                onClick={() => setStoreModalOpen(true)}
              >
                Change Store
              </Button>
            </Box>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {selectedStore.description}
              </Typography>
              {/* commenting for mnow if not occuping more spaces */}
              {/* <Typography variant="body2" color="text.secondary">
                Pincodes Served:{selectedStore?.pincodes?.map((pincode) => pincode).join(', ')}
              </Typography> */}
              <Typography variant="body2" color="text.secondary">
                {selectedStore.tnc}
              </Typography>
            </Box>
          </Box>
        </Container>
      )}

      {/* Landing Page Section */}
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)', // Adjust based on navbar and store details height
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
          px: 2,
          pt: '25vh', // Position at 25% of viewport height
          pb: 4,
        }}
      >
        <Container>
          <FormControl fullWidth>
            <TextField
              ref={anchorRef}
              label="Search Products"
              placeholder="Type or paste your grocery list..."
              value={search}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setDropdownOpen(true)}
              onClick={() => setDropdownOpen(true)}
              fullWidth
              multiline
              minRows={3}
              maxRows={13}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '1px',
                    },
                  },
                  '&.Mui-focused': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: '1px',
                    },
                  },
                  '& > fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    transition: 'all 0.2s ease-in-out',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary',
                  '&.Mui-focused': {
                    color: 'primary.main',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  padding: '16px',
                  height: '100%',
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.7,
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: inventoryLoading ? (
                  <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                ) : null,
              }}
            />
            <Popper
              open={dropdownOpen && filteredProducts.length > 0}
              anchorEl={anchorRef.current}
              placement="bottom-start"
              style={{ width: anchorRef.current?.offsetWidth, zIndex: 1300 }}
            >
              <ClickAwayListener onClickAway={handleClickAway}>
                <Paper
                  elevation={3}
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <MenuList sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {filteredProducts.map((product) => (
                      <MenuItem
                        key={product.id}
                        onClick={() => {
                          setSearch(product.name);
                          setDropdownOpen(false);
                        }}
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {product.image && (
                            <Box
                              component="img"
                              src={product.image}
                              alt={product.name}
                              sx={{
                                width: 40,
                                height: 40,
                                mr: 2,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.categoryName || 'No category'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              </ClickAwayListener>
            </Popper>
          </FormControl>
        </Container>
      </Box>

      {/* Products Section */}
      <Container>
        {/* Product Grid */}
        {inventoryLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ mt: 4 }}>
            No products available in this store.
          </Typography>
        ) : (
          <ProductGrid products={visibleRows} />
        )}
        {/* Add pagination controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 4 }}>
          <TablePagination
            rowsPerPageOptions={[8, 12, 24]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Container>
    </>
  );
};

export default Products;
