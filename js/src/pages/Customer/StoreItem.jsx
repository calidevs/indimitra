import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import LocationOn from '@mui/icons-material/LocationOn';
import AccessTime from '@mui/icons-material/AccessTime';
import MyLocation from '@mui/icons-material/MyLocation';
import CheckCircle from '@mui/icons-material/CheckCircle';
import DoNotDisturbOn from '@mui/icons-material/DoNotDisturbOn';

const StoreItem = ({ store, isSelected, onSelect }) => {
  const isActive = store.isActive;

  return (
    <Box
      role="button"
      tabIndex={isActive ? 0 : -1}
      onClick={() => isActive && onSelect(store)}
      onKeyDown={(e) => {
        if (isActive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(store);
        }
      }}
      aria-disabled={!isActive}
      aria-pressed={isSelected}
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        px: 2.25,
        py: 2.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        backgroundColor: isSelected ? 'primary.lighter' : 'background.paper',
        cursor: isActive ? 'pointer' : 'not-allowed',
        opacity: isActive ? 1 : 0.6,
        transition: 'border-color 120ms ease, background-color 120ms ease',
        '&:hover': isActive
          ? {
              borderColor: isSelected ? 'primary.main' : 'text.primary',
              backgroundColor: isSelected ? 'primary.lighter' : 'action.hover',
            }
          : {},
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {/* Icon tile */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.25,
          backgroundColor: isSelected ? 'primary.lighter' : 'grey.100',
          color: isSelected ? 'primary.main' : 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        {isActive ? <StoreIcon sx={{ fontSize: 19 }} /> : <DoNotDisturbOn sx={{ fontSize: 19 }} />}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: 'text.primary' }}>
            {store.name}
          </Typography>
          {!isActive && (
            <Chip
              label="Closed"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'error.main',
                backgroundColor: 'error.lighter',
                border: '1px solid',
                borderColor: 'error.light',
              }}
            />
          )}
        </Box>

        {store.description && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.82rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {store.description}
            </Typography>
          </Box>
        )}

        {store.address && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '0.82rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {store.address}
            </Typography>
          </Box>
        )}

        {store.radius && (
          <Box sx={{ mt: 1.5 }}>
            <Chip
              icon={<MyLocation sx={{ fontSize: 12 }} />}
              label={`${store.radius} mi radius`}
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 500,
                borderColor: 'grey.300',
                color: 'text.secondary',
                '& .MuiChip-icon': {
                  color: 'text.secondary',
                  ml: '6px',
                },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Selection indicator */}
      {isSelected && (
        <CheckCircle sx={{ color: 'primary.main', fontSize: 20, flexShrink: 0, mt: 0.625 }} />
      )}
    </Box>
  );
};

export default StoreItem;
