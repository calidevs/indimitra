import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Dialog = ({ open, onClose, children, title, footer, hideClose = false, maxWidth = 'sm', ...props }) => {
  return (
    <MuiDialog
      open={open}
      maxWidth={maxWidth}
      fullWidth
      onClose={hideClose ? undefined : onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 'min(85vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
      {...props}
    >
      {title && (
        <DialogTitle
          component="div"
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, color: 'text.primary' }}>{title}</Box>
          {!hideClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 3,
          pt: 3,
          pb: 3,
          '&::-webkit-scrollbar': { width: 6 },
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
