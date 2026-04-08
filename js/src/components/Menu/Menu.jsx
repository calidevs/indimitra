import { Menu as MuiMenu } from '@mui/material';

const Menu = (props) => {
  return (
    <MuiMenu
      {...props}
      sx={{
        '& .MuiPaper-root': {
          mt: 2,
          minWidth: '200px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          border: (theme) => `1px solid ${theme.palette.custom.menuHover}`,
          overflow: 'hidden',
        },
        '& .MuiList-root': {
          padding: '8px 0',
        },
        '& .MuiMenuItem-root': {
          padding: '12px 24px',
          '&:hover': {
            backgroundColor: (theme) => theme.palette.custom.menuHover,
          },
        },
        ...props.sx,
      }}
    />
  );
};

export default Menu;
