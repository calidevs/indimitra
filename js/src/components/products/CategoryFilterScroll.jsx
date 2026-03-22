import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CategoryIcon from '@mui/icons-material/Category';
import { getFixedGroceryImage } from '@/assets/images/groceryImages';

const SCROLL_STEP = 0.75;

const CategoryFilterScroll = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    const t = 4;
    setCanScrollLeft(scrollLeft > t);
    setCanScrollRight(max > t && scrollLeft < max - t);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [categories, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * SCROLL_STEP * dir, behavior: 'smooth' });
  };

  const items = [
    { id: null, name: 'All', isAll: true },
    ...categories.map(([id, name]) => ({ id, name, isAll: false })),
  ];

  const arrowButtonBase = {
    width: 36,
    height: 36,
    bgcolor: '#fff',
    color: '#FF6B6B',
    border: '2px solid #FF6B6B',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 2,
    transition: 'all 0.2s ease',
    '&:hover': {
      bgcolor: '#FF6B6B',
      color: '#fff',
      transform: 'scale(1.15)',
      boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
    },
    '&.Mui-disabled': {
      bgcolor: '#f5f5f5',
      color: '#bbb',
      border: '2px solid #ddd',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  };

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      {/* Section label */}
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
          fontWeight: 600,
          color: 'text.secondary',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Browse by Category
      </Typography>

      {/* Wrapper with relative positioning for overlay arrows */}
      <Box sx={{ position: 'relative' }}>
        {/* LEFT ARROW — overlaid on the left edge */}
        <IconButton
          onClick={() => scroll(-1)}
          disabled={!canScrollLeft}
          aria-label="Scroll categories left"
          sx={{
            ...arrowButtonBase,
            position: 'absolute',
            left: -4,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Scroll track */}
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            gap: { xs: 1.5, md: 2 },
            overflowX: 'auto',
            overflowY: 'hidden',
            py: 1,
            px: 5,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
          role="tablist"
          aria-label="Filter products by category"
        >
          {items.map(({ id, name, isAll }) => {
            const selected =
              isAll ? selectedCategoryId === null : selectedCategoryId === id;
            const thumbUrl = isAll ? null : getFixedGroceryImage(name, 0);

            return (
              <Box
                key={isAll ? 'all' : id}
                component="button"
                type="button"
                onClick={() => onSelectCategory(id)}
                role="tab"
                aria-selected={selected}
                aria-label={isAll ? 'Show all categories' : `Category: ${name}`}
                sx={{
                  flex: '0 0 auto',
                  scrollSnapAlign: 'start',
                  width: { xs: 100, md: 120, lg: 130 },
                  height: { xs: 110, md: 130, lg: 140 },
                  borderRadius: '16px',
                  border: '2px solid',
                  borderColor: selected ? '#FF6B6B' : 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  background: isAll
                    ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                    : 'none',
                  boxShadow: selected
                    ? '0 4px 16px rgba(255,107,107,0.3)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: selected
                      ? '0 8px 24px rgba(255,107,107,0.35)'
                      : '0 6px 20px rgba(0,0,0,0.12)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid #FF6B6B',
                    outlineOffset: 2,
                  },
                }}
              >
                {!isAll && thumbUrl && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${thumbUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: selected ? 'brightness(0.75)' : 'brightness(0.85)',
                      transition: 'filter 0.25s ease',
                    }}
                  />
                )}

                {!isAll && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 60%)',
                    }}
                  />
                )}

                {isAll && (
                  <CategoryIcon
                    sx={{
                      color: '#fff',
                      fontSize: { xs: '1.6rem', md: '2rem' },
                      mb: 0.5,
                      zIndex: 1,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                    }}
                  />
                )}

                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    color: '#fff',
                    fontWeight: selected ? 700 : 600,
                    fontSize: { xs: '0.7rem', md: '0.78rem' },
                    lineHeight: 1.25,
                    textAlign: 'center',
                    px: 1,
                    pb: { xs: 1, md: 1.25 },
                    width: '100%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {isAll ? 'All' : name}
                </Typography>

                {selected && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: '15%',
                      right: '15%',
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                      background: 'linear-gradient(90deg, #FF6B6B, #FFA07A)',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {/* RIGHT ARROW — overlaid on the right edge */}
        <IconButton
          onClick={() => scroll(1)}
          disabled={!canScrollRight}
          aria-label="Scroll categories right"
          sx={{
            ...arrowButtonBase,
            position: 'absolute',
            right: -4,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CategoryFilterScroll;
