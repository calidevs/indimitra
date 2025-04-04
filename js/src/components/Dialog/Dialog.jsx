import { Dialog as MuiDialog, DialogTitle, DialogContent } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Dialog = ({ open, onClose, children, title, ...props }) => {
  const theme = useTheme();
  console.log(title);
  return (
    <MuiDialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
      {...props}
    >
      {title && (
        <DialogTitle
          sx={{
            textAlign: 'center',
            background: theme.palette.custom.gradientPrimary,
            color: 'white',
            py: 2.5,
            mb: 2,
          }}
        >
          {title}
        </DialogTitle>
      )}

      <DialogContent>{children}</DialogContent>
    </MuiDialog>
  );
};

export default Dialog;
