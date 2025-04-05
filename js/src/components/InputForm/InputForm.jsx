import { Alert, Button, TextField, LoadingSpinner } from '../index';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import { InputAdornment } from '@mui/material';

const InputForm = ({ fields, onSubmit, buttonLabel, loading, error, success }) => {
  const getIconForField = (type) => {
    switch (type) {
      case 'email':
        return <AccountCircleIcon sx={{ color: '#FF6B6B' }} />;
      case 'password':
        return <LockIcon sx={{ color: '#FF6B6B' }} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {fields.map((field, index) => (
        <TextField
          key={index}
          label={field.label}
          type={field.type}
          fullWidth
          margin="normal"
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          required
          InputProps={{
            startAdornment: field.type && (
              <InputAdornment position="start">
                {getIconForField(field.type)}
              </InputAdornment>
            ),
          }}
        />
      ))}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <LoadingSpinner size={24} sx={{ color: '#fff' }} /> : buttonLabel}
      </Button>
    </form>
  );
};

export default InputForm;
