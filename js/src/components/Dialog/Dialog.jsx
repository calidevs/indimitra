import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const Dialog = ({ open, onClose, children, title, footer, ...props }) => {
  const theme = useTheme();
  return (
    <MuiDialog
      open={open}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          height: '60vh',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
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
            py: 2,
            position: 'relative',
            flexShrink: 0,
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

      <DialogContent
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: 3,
          },
        }}
      >
        {children}
      </DialogContent>

      {footer && (
        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          {footer}
        </DialogActions>
      )}
    </MuiDialog>
  );
};

export default Dialog;
