import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  IconButton,
  Collapse,
  Chip,
  Slider,
  Typography,
  FormControlLabel,
  Switch,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import CloseIcon from '@mui/icons-material/Close';

export const SORT_OPTIONS = [
  { value: 'default', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
  { value: 'name_desc', label: 'Name: Z → A' },
];

const ProductToolbar = ({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  inStockOnly,
  onInStockOnlyChange,
  priceRange,
  onPriceRangeChange,
  priceBounds,
  activeFilterCount,
  onClearFilters,
}) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 600px)');

  const priceMin = priceBounds[0];
  const priceMax = priceBounds[1];
  const hasPriceRange = priceMax > priceMin;

  return (
    <Box sx={{ mb: 2 }}>
      {/* ─── Main row: Search | Sort | Filter toggle ─── */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search products…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#fafafa',
              fontSize: '0.9rem',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF6B6B',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#FF6B6B',
                borderWidth: 2,
              },
            },
          }}
        />

        {/* Sort select */}
        <Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          size="small"
          displayEmpty
          renderValue={(val) => {
            if (isMobile) {
              return <SortIcon sx={{ fontSize: 20, color: 'text.secondary', mt: 0.3 }} />;
            }
            const opt = SORT_OPTIONS.find((o) => o.value === val);
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SortIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  {opt?.label || 'Sort'}
                </Typography>
              </Box>
            );
          }}
          sx={{
            minWidth: isMobile ? 48 : 180,
            borderRadius: '12px',
            backgroundColor: '#fafafa',
            fontSize: '0.85rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: sortBy !== 'default' ? '#FF6B6B' : undefined,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF6B6B',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#FF6B6B',
              borderWidth: 2,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: { borderRadius: '12px', mt: 0.5 },
            },
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.9rem' }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        {/* Filter toggle */}
        <Tooltip title={filtersOpen ? 'Hide filters' : 'Show filters'}>
          <IconButton
            onClick={() => setFiltersOpen((o) => !o)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: filtersOpen || activeFilterCount > 0 ? '#FF6B6B' : 'divider',
              backgroundColor: filtersOpen ? 'rgba(255,107,107,0.08)' : '#fafafa',
              position: 'relative',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,107,107,0.12)',
                borderColor: '#FF6B6B',
              },
            }}
          >
            <TuneIcon
              sx={{ fontSize: 20, color: filtersOpen || activeFilterCount > 0 ? '#FF6B6B' : 'text.secondary' }}
            />
            {activeFilterCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#FF6B6B',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeFilterCount}
              </Box>
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── Collapsible filter panel ─── */}
      <Collapse in={filtersOpen} timeout={250}>
        <Box
          sx={{
            mt: 1.5,
            p: { xs: 1.5, sm: 2 },
            borderRadius: '14px',
            backgroundColor: '#fafafa',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 3 },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            {/* In-stock toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={inStockOnly}
                  onChange={(e) => onInStockOnlyChange(e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF6B6B' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FF6B6B' },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  In stock only
                </Typography>
              }
              sx={{ m: 0 }}
            />

            {/* Price range slider */}
            {hasPriceRange && (
              <Box sx={{ flex: 1, minWidth: 160 }}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.8rem', fontWeight: 500, color: 'text.secondary', mb: 0.5 }}
                >
                  Price: ${priceRange[0].toFixed(0)} – ${priceRange[1].toFixed(0)}
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, v) => onPriceRangeChange(v)}
                  min={priceMin}
                  max={priceMax}
                  step={0.5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `$${v.toFixed(0)}`}
                  size="small"
                  sx={{
                    color: '#FF6B6B',
                    '& .MuiSlider-thumb': {
                      width: 16,
                      height: 16,
                      '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(255,107,107,0.16)' },
                    },
                    '& .MuiSlider-valueLabel': {
                      backgroundColor: '#FF6B6B',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                    },
                  }}
                />
              </Box>
            )}

            {/* Clear all */}
            {activeFilterCount > 0 && (
              <Chip
                label="Clear filters"
                size="small"
                onDelete={onClearFilters}
                deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                onClick={onClearFilters}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  color: '#FF6B6B',
                  borderColor: '#FF6B6B',
                  '& .MuiChip-deleteIcon': { color: '#FF6B6B' },
                }}
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Collapse>

      {/* ─── Active filter chips (shown when panel is collapsed) ─── */}
      {!filtersOpen && activeFilterCount > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {inStockOnly && (
            <Chip
              label="In stock"
              size="small"
              onDelete={() => onInStockOnlyChange(false)}
              sx={{
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(255,107,107,0.1)',
                color: '#FF6B6B',
                '& .MuiChip-deleteIcon': { color: '#FF6B6B', fontSize: 16 },
              }}
            />
          )}
          {hasPriceRange && (priceRange[0] > priceMin || priceRange[1] < priceMax) && (
            <Chip
              label={`$${priceRange[0].toFixed(0)} – $${priceRange[1].toFixed(0)}`}
              size="small"
              onDelete={() => onPriceRangeChange([priceMin, priceMax])}
              sx={{
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(255,107,107,0.1)',
                color: '#FF6B6B',
                '& .MuiChip-deleteIcon': { color: '#FF6B6B', fontSize: 16 },
              }}
            />
          )}
          {sortBy !== 'default' && (
            <Chip
              label={SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              size="small"
              onDelete={() => onSortChange('default')}
              sx={{
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'rgba(255,107,107,0.1)',
                color: '#FF6B6B',
                '& .MuiChip-deleteIcon': { color: '#FF6B6B', fontSize: 16 },
              }}
            />
          )}
          <Chip
            label="Clear all"
            size="small"
            onClick={onClearFilters}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'text.secondary',
              borderColor: 'divider',
              cursor: 'pointer',
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ProductToolbar;
