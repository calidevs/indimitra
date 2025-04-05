import { Chip } from '@mui/material';

const ProductCategoryChip = ({ categoryName }) => {
  if (!categoryName) return null;

  return (
    <Chip
      label={categoryName}
      size="small"
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        fontWeight: 600,
        fontSize: '0.7rem',
        borderRadius: '12px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      }}
    />
  );
};

export default ProductCategoryChip; 