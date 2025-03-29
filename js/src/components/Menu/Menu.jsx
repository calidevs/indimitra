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
          border: '1px solid rgba(145, 127, 179, 0.1)',
          overflow: 'hidden',
        },
        '& .MuiList-root': {
          padding: '8px 0',
        },
        '& .MuiMenuItem-root': {
          padding: '12px 24px',
          '&:hover': {
            backgroundColor: 'rgba(145, 127, 179, 0.1)',
          },
        },
        ...props.sx,
      }}
    />
  );
};

export default Menu;
