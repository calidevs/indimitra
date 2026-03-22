import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Paper, Typography, Button } from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  StorefrontOutlined,
  LocationOn,
} from '@mui/icons-material';

const AUTOPLAY_INTERVAL = 4000;

const DEV_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80', // Indian grocery store aisle
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',   // Fresh produce display
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80', // Spice market
  'https://images.unsplash.com/photo-1556767576-5ec41e3239ea?auto=format&fit=crop&w=1200&q=80',   // Grocery delivery
];

const IS_DEV = import.meta.env?.DEV ?? process.env.NODE_ENV !== 'production';

const StoreImageSlider = ({
  images = [],
  storeAddress,
  storeDescription,
  deliveryLabel,
  deliverySubtext,
  onChangeAddress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  // In dev, fall back to placeholder images when none are provided
  const effectiveImages = (images && images.length > 0) ? images : (IS_DEV ? DEV_PLACEHOLDER_IMAGES : []);
  const hasImages = effectiveImages.length > 0;

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!hasImages || effectiveImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSlideDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === effectiveImages.length - 1 ? 0 : prev + 1));
        setIsTransitioning(false);
      }, 300);
    }, AUTOPLAY_INTERVAL);
  }, [hasImages, effectiveImages.length]);

  useEffect(() => {
    if (!isHovered) {
      startAutoplay();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, startAutoplay]);

  const navigate = (direction) => {
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        direction === 'next'
          ? prev === effectiveImages.length - 1 ? 0 : prev + 1
          : prev === 0 ? effectiveImages.length - 1 : prev - 1
      );
      setIsTransitioning(false);
    }, 300);
    if (!isHovered) startAutoplay();
  };

  const handleDotClick = (index) => {
    if (index === currentIndex) return;
    setSlideDirection(index > currentIndex ? 'next' : 'prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
    if (!isHovered) startAutoplay();
  };

  const overlayContent = (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)',
        px: { xs: 2, sm: 3 },
        pb: { xs: 1.5, sm: 2 },
        pt: { xs: 4, sm: 5 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-end' },
        gap: { xs: 1, sm: 2 },
      }}
    >
      {/* Store info (left side) */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {storeAddress && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <LocationOn sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {storeAddress}
            </Typography>
          </Box>
        )}
        {storeDescription && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              mt: 0.25,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: { xs: 'normal', sm: 'nowrap' },
              maxWidth: '100%',
            }}
          >
            {storeDescription}
          </Typography>
        )}
      </Box>

      {/* Delivery/pickup button (right side) */}
      {deliveryLabel && onChangeAddress && (
        <Button
          variant="contained"
          size="small"
          onClick={onChangeAddress}
          sx={{
            flexShrink: 0,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.78rem', sm: '0.85rem' },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.5, sm: 0.75 },
            minWidth: 0,
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          <span>{deliveryLabel}</span>
          {deliverySubtext && (
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 400,
                mt: 0.25,
                maxWidth: { xs: 200, sm: 240 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                textAlign: 'inherit',
              }}
            >
              {deliverySubtext}
            </Typography>
          )}
        </Button>
      )}
    </Box>
  );

  // --- Empty state (no images) ---
  if (!hasImages) {
    return (
      <Paper
        elevation={2}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 160, sm: 200, md: 220 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        {/* Centered placeholder when no overlay info */}
        {!storeAddress && !storeDescription && !(deliveryLabel && onChangeAddress) ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StorefrontOutlined sx={{ fontSize: 40, color: 'rgba(0,0,0,0.2)', mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.35)' }}>
              Offers & promotions coming soon
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 3,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)',
              px: { xs: 2, sm: 3 },
              pb: { xs: 1.5, sm: 2 },
              pt: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'flex-end' },
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {storeAddress && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <LocationOn sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '0.8rem', sm: '0.88rem' } }}
                  >
                    {storeAddress}
                  </Typography>
                </Box>
              )}
              {storeDescription && (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', sm: '0.82rem' }, mt: 0.25 }}
                >
                  {storeDescription}
                </Typography>
              )}
            </Box>
            {deliveryLabel && onChangeAddress && (
              <Button
                variant="contained"
                size="small"
                onClick={onChangeAddress}
                sx={{
                  flexShrink: 0,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.78rem', sm: '0.85rem' },
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'flex-start', sm: 'flex-end' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              >
                <span>{deliveryLabel}</span>
                {deliverySubtext && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 400,
                      mt: 0.25,
                    }}
                  >
                    {deliverySubtext}
                  </Typography>
                )}
              </Button>
            )}
          </Box>
        )}
      </Paper>
    );
  }

  // --- Has images ---
  return (
    <Paper
      elevation={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 180, sm: 220, md: 260 },
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        '&:hover .slider-arrow': {
          opacity: 1,
        },
      }}
    >
      {/* Slide image */}
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        <img
          src={effectiveImages[currentIndex]}
          alt={`Store offer ${currentIndex + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? `translateX(${slideDirection === 'next' ? '30px' : '-30px'})`
              : 'translateX(0)',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />

        {/* Store info overlay (stays while images scroll) */}
        {overlayContent}

        {/* Navigation arrows */}
        {effectiveImages.length > 1 && (
          <>
            <IconButton
              className="slider-arrow"
              onClick={() => navigate('prev')}
              size="small"
              sx={{
                position: 'absolute',
                left: 4,
                top: '40%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                zIndex: 4,
                p: 0.5,
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton
              className="slider-arrow"
              onClick={() => navigate('next')}
              size="small"
              sx={{
                position: 'absolute',
                right: 4,
                top: '40%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                zIndex: 4,
                p: 0.5,
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Dot indicators */}
        {effectiveImages.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 40, sm: 48 },
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.75,
              zIndex: 4,
            }}
          >
            {effectiveImages.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: currentIndex === index ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: currentIndex === index ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: currentIndex === index ? '#fff' : 'rgba(255, 255, 255, 0.75)',
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StoreImageSlider;
