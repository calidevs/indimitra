import React from 'react';
import { Paper, ListItem, ListItemButton, Box, Avatar, Typography, Chip } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import LocationOn from '@mui/icons-material/LocationOn';
import MyLocation from '@mui/icons-material/MyLocation';

const StoreItem = ({ store, isSelected, onSelect }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        border: '1px solid',
        borderColor: isSelected ? 'primary.main' : 'rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => onSelect(store)}
          selected={isSelected}
          sx={{
            p: 0,
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: isSelected ? 'primary.main' : 'grey.300',
                    mr: 2,
                  }}
                >
                  <StoreIcon />
                </Avatar>
                <Box>
                  <Typography fontWeight={600} fontSize="1.1rem">
                    {store.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
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

              {store.radius && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    icon={<MyLocation fontSize="small" />}
                    label={`${store.radius} km radius`}
                    size="small"
                    variant="outlined"
                    color={isSelected ? 'primary' : 'default'}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </ListItemButton>
      </ListItem>
    </Paper>
  );
};

export default StoreItem;
