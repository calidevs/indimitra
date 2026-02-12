import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, StorefrontOutlined } from '@mui/icons-material';

const AUTOPLAY_INTERVAL = 4000;

const StoreImageSlider = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef(null);

  if (!images || images.length === 0) {
    return (
      <Paper
        elevation={2}
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 120, sm: 150, md: 180 },
          mb: { xs: 2, sm: 3 },
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <StorefrontOutlined sx={{ fontSize: 40, color: 'rgba(0,0,0,0.2)', mb: 0.5 }} />
        <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.35)' }}>
          Offers & promotions coming soon
        </Typography>
      </Paper>
    );
  }

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setSlideDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setIsTransitioning(false);
      }, 300);
    }, AUTOPLAY_INTERVAL);
  }, [images.length]);

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

  const handlePrevious = () => {
    setSlideDirection('prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      setIsTransitioning(false);
    }, 300);
    // Reset autoplay timer on manual navigation
    if (!isHovered) startAutoplay();
  };

  const handleNext = () => {
    setSlideDirection('next');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
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

  return (
    <Paper
      elevation={2}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 120, sm: 150, md: 180 },
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        '&:hover .slider-arrow': {
          opacity: 1,
        },
      }}
    >
      {/* Main Image with transition */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <img
          src={images[currentIndex]}
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

        {/* Bottom gradient overlay for dot visibility */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Navigation Arrows - translucent, visible on hover */}
        {images.length > 1 && (
          <>
            <IconButton
              className="slider-arrow"
              onClick={handlePrevious}
              size="small"
              sx={{
                position: 'absolute',
                left: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
                zIndex: 2,
                p: 0.5,
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
            <IconButton
              className="slider-arrow"
              onClick={handleNext}
              size="small"
              sx={{
                position: 'absolute',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                opacity: 0,
                transition: 'opacity 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                },
                zIndex: 2,
                p: 0.5,
              }}
            >
              <ChevronRight fontSize="small" />
            </IconButton>
          </>
        )}

        {/* Dots Indicator - smaller and subtle */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 0.75,
              zIndex: 2,
            }}
          >
            {images.map((_, index) => (
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
