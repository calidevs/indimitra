import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { CheckCircle, Close } from '@mui/icons-material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: '120px', // Minimum 5 lines
  },
}));

const ListInput = ({ sectionHeaders, answers = {}, onChangeAnswers, onSubmit }) => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Handler for input change
  const handleInputChange = (index, value) => {
    const newAnswers = { ...answers, [index]: value };
    onChangeAnswers(newAnswers);
  };

  // Format the string for customOrder in a pretty, display-ready way
  const formatCustomOrder = () => {
    if (!sectionHeaders || sectionHeaders.length === 0) return '';
    const formattedLines = [];
    sectionHeaders.forEach((header, idx) => {
      const value = answers[idx] ? answers[idx].trim() : '';
      if (value) {
        // Add category header
        formattedLines.push(header);
        // Add each item as a bullet point
        value.split('\n').forEach((item) => {
          const trimmed = item.trim();
          if (trimmed) formattedLines.push(`  • ${trimmed}`);
        });
        formattedLines.push(''); // Blank line after each category
      }
    });
    return formattedLines.join('\n').trim();
  };

  // Check if at least one section has content
  const hasContent = () => {
    return Object.values(answers).some((value) => value && value.trim() !== '');
  };

  // Clear all input fields
  const clearAllInputs = () => {
    const clearedAnswers = {};
    sectionHeaders.forEach((_, index) => {
      clearedAnswers[index] = '';
    });
    onChangeAnswers(clearedAnswers);
  };

  const handleSubmit = () => {
    // Don't submit if no content
    if (!hasContent()) {
      return;
    }
    const formattedOrder = formatCustomOrder();
    onSubmit(formattedOrder);
    setIsEdit(Object.values(answers).some((value) => value.trim() !== ''));
    setShowSuccessModal(true);

    // Clear all input fields after successful submission
    clearAllInputs();

    // Auto close after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {sectionHeaders.map((header, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                boxShadow: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 600, color: 'primary.main', letterSpacing: 0.2 }}
              >
                {header}
              </Typography>
              <StyledTextField
                fullWidth
                multiline
                minRows={5}
                placeholder={`Enter items for ${header.toLowerCase()}`}
                variant="outlined"
                value={answers[index] || ''}
                onChange={(e) => handleInputChange(index, e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                  },
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={!hasContent()}
          sx={{ 
            px: 5, 
            py: 1.5, 
            fontWeight: 600, 
            borderRadius: 2, 
            boxShadow: 1,
            opacity: hasContent() ? 1 : 0.6,
          }}
          onClick={handleSubmit}
        >
          Submit List
        </Button>
      </Box>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: '300px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {isEdit ? 'Items Edited' : 'Items Added'}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setShowSuccessModal(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            {isEdit
              ? 'Your custom order has been updated in the cart.'
              : 'Your custom order has been added to the cart.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setShowSuccessModal(false)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
            }}
          >
            Okay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListInput;
