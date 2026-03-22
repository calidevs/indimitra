// In js/src/pages/Products.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  TablePagination,
} from '@mui/material';
import fetchGraphQL from '@/config/graphql/graphqlService';
import { GET_STORE_PRODUCTS } from '@/queries/operations';
import useStore from '@/store/useStore';
import { ProductGrid, CategoryFilterScroll } from '@components';
import ProductToolbar from '@/components/products/ProductToolbar';
import banginapalli from '@/assets/images/products/banginapalli.jpg';
import himayat from '@/assets/images/products/himayat.jpg';
import kesar from '@/assets/images/products/kesar.jpg';
import chinnaRasalu from '@/assets/images/products/chinna-rasalu.png';
import alphonso from '@/assets/images/products/alphonso.png';
import malgova from '@/assets/images/products/malgova.jpg';

const STORE_PRODUCT_IMAGES = {
  1: {
    2: banginapalli,
    3: himayat,
    4: kesar,
    5: chinnaRasalu,
    6: alphonso,
    7: malgova,
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

const Products = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [sortBy, setSortBy] = useState('default');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 0]);

  const { selectedStore } = useStore();

  const debouncedSearch = useDebounce(search, 300);

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: ['storeInventory', selectedStore?.id],
    queryFn: async () => {
      const response = await fetchGraphQL(GET_STORE_PRODUCTS, {
        storeId: selectedStore.id,
        isListed: true,
      });
      return response;
    },
    enabled: !!selectedStore?.id,
  });

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

  const categoryOptions = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.categoryId != null && p.categoryName) {
        map.set(p.categoryId, p.categoryName);
      }
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: 'base' })
    );
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return [0, 0];
    const prices = products.map((p) => p.price);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  // Sync price range when products (and therefore bounds) change
  useEffect(() => {
    setPriceRange(priceBounds);
  }, [priceBounds]);

  useEffect(() => {
    setSelectedCategoryId(null);
    setSortBy('default');
    setInStockOnly(false);
    setPage(0);
  }, [selectedStore?.id]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedCategoryId, sortBy, inStockOnly, priceRange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (inStockOnly) count += 1;
    if (priceBounds[1] > priceBounds[0] && (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1])) count += 1;
    if (sortBy !== 'default') count += 1;
    return count;
  }, [inStockOnly, priceRange, priceBounds, sortBy]);

  const clearFilters = useCallback(() => {
    setSortBy('default');
    setInStockOnly(false);
    setPriceRange(priceBounds);
  }, [priceBounds]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return products
      .filter((product) => {
        if (selectedCategoryId !== null && product.categoryId !== selectedCategoryId) return false;
        if (inStockOnly && !product.isAvailable) return false;
        if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
        if (!q) return true;
        return product.name.toLowerCase().includes(q) || product.categoryName?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'name_asc':
            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
          case 'name_desc':
            return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
          default:
            if (a.isAvailable === b.isAvailable) return 0;
            return a.isAvailable ? -1 : 1;
        }
      });
  }, [products, debouncedSearch, selectedCategoryId, sortBy, inStockOnly, priceRange]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = useMemo(() => {
    return filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  if (inventoryError)
    return <Typography>Error fetching products: {inventoryError.message}</Typography>;

  return (
    <Container>
      <ProductToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        inStockOnly={inStockOnly}
        onInStockOnlyChange={setInStockOnly}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        priceBounds={priceBounds}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      {!inventoryLoading && products.length > 0 && (
        <CategoryFilterScroll
          categories={categoryOptions}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {inventoryLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No products available in this store.
        </Typography>
      ) : filteredProducts.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
          No products match your filters. Try adjusting your search or filters.
        </Typography>
      ) : (
        <ProductGrid products={visibleRows} />
      )}

      {filteredProducts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
      )}
    </Container>
  );
};

export default Products;
