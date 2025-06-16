import { Dialog as MuiDialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

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
            position: 'relative',
          }}
        >
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent>{children}</DialogContent>
    </MuiDialog>
  );
};

export default Dialog;
