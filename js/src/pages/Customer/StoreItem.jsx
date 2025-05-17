import React from 'react';
import {
  Paper,
  ListItem,
  ListItemButton,
  Box,
  Avatar,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import LocationOn from '@mui/icons-material/LocationOn';
import MyLocation from '@mui/icons-material/MyLocation';
import AccessTime from '@mui/icons-material/AccessTime';
import DoNotDisturbOn from '@mui/icons-material/DoNotDisturbOn';

const StoreItem = ({ store, isSelected, onSelect }) => {
  const isStoreActive = store.isActive;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: isSelected
          ? 'primary.main'
          : isStoreActive
            ? 'rgba(0, 0, 0, 0.08)'
            : 'rgba(211, 47, 47, 0.3)',
        backgroundColor: isStoreActive ? 'transparent' : 'rgba(0, 0, 0, 0.01)',
        '&:hover': {
          transform: isStoreActive ? 'translateY(-2px)' : 'none',
          boxShadow: isStoreActive ? 2 : 0,
        },
      }}
    >
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => isStoreActive && onSelect(store)}
          selected={isSelected}
          disabled={!isStoreActive}
          sx={{
            p: 0,
            cursor: isStoreActive ? 'pointer' : 'not-allowed',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: isStoreActive
                      ? isSelected
                        ? 'primary.main'
                        : 'grey.300'
                      : 'rgba(211, 47, 47, 0.1)',
                    mr: 2,
                    color: isStoreActive ? 'inherit' : 'error.main',
                  }}
                >
                  {isStoreActive ? <StoreIcon /> : <DoNotDisturbOn />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography fontWeight={600} fontSize="1.1rem" color="text.primary">
                      {store.name}
                    </Typography>
                    {!isStoreActive && (
                      <Chip
                        label="Offline"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          color: 'error.main',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </Box>

                  {/* Store Description/Timings - Always visible for inactive stores */}
                  {(!isStoreActive || store.description) && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 1,
                        backgroundColor: !isStoreActive ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                        p: !isStoreActive ? 1 : 0,
                        borderRadius: 1,
                      }}
                    >
                      <AccessTime
                        sx={{
                          fontSize: '0.9rem',
                          color: !isStoreActive ? 'error.main' : 'text.secondary',
                          mr: 0.5,
                          mt: 0.2,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontStyle: !isStoreActive ? 'italic' : 'normal',
                          fontWeight: !isStoreActive ? 500 : 400,
                        }}
                      >
                        {store.description || 'Store timings not available'}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn
                      sx={{
                        fontSize: '0.9rem',
                        color: 'text.secondary',
                        mr: 0.5,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {store.address}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                {store.radius && (
                  <Chip
                    icon={<MyLocation fontSize="small" />}
                    label={`${store.radius} mi radius`}
                    size="small"
                    variant="outlined"
                    color={isSelected ? 'primary' : 'default'}
                    sx={{
                      opacity: isStoreActive ? 1 : 0.7,
                    }}
                  />
                )}
                {!isStoreActive && (
                  <Typography
                    variant="caption"
                    sx={{
                      ml: 'auto',
                      color: 'error.main',
                      fontStyle: 'italic',
                    }}
                  >
                    Store is currently offline
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </ListItemButton>
      </ListItem>
    </Paper>
  );
};

export default StoreItem;
