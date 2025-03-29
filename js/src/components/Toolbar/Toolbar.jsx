import { Toolbar as MuiToolbar } from '@mui/material';

const Toolbar = (props) => {
  return (
    <MuiToolbar
      {...props}
      sx={{
        minHeight: { xs: '64px', sm: '70px' },
        px: { xs: 2, sm: 4 },
        ...props.sx,
      }}
    />
  );
};

export default Toolbar;
