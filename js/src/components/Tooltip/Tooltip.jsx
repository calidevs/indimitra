import { Tooltip as MuiTooltip } from '@mui/material';

const Tooltip = (props) => {
  return (
    <MuiTooltip
      {...props}
      sx={{
        '& .MuiTooltip-tooltip': {
          backgroundColor: 'rgba(42, 47, 79, 0.9)',
          fontSize: '0.875rem',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        ...props.sx,
      }}
    />
  );
};

export default Tooltip;
