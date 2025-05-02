import { Badge as MuiBadge } from '@mui/material';

const Badge = (props) => {
  return (
    <MuiBadge
      {...props}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: '#E53935',
          color: 'white',
          minWidth: '20px',
          height: '20px',
          padding: '0 6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          ...props.sx?.['& .MuiBadge-badge'],
        },
        ...props.sx,
      }}
    />
  );
};

export default Badge;
