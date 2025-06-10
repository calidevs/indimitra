import React from 'react';
import { Box, Typography, TextField, Grid, Paper, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    minHeight: '120px', // Minimum 5 lines
  },
}));

const ListInput = ({ sectionHeaders, answers = {}, onChangeAnswers, onSubmit }) => {
  // Handler for input change
  const handleInputChange = (index, value) => {
    const newAnswers = { ...answers, [index]: value };
    onChangeAnswers(newAnswers);
  };

  // Format the string for customOrder
  const formatCustomOrder = () => {
    return sectionHeaders
      .map((header, idx) => `${header}\n${answers[idx] ? answers[idx].trim() : ''}`)
      .join('\n\n');
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
          sx={{ px: 5, py: 1.5, fontWeight: 600, borderRadius: 2, boxShadow: 1 }}
          onClick={() => onSubmit(formatCustomOrder())}
        >
          Submit List
        </Button>
      </Box>
    </Box>
  );
};

export default ListInput;
