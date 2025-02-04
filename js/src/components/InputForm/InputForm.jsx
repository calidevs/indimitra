import { Alert, Button, TextField, LoadingSpinner } from '../index';

const InputForm = ({ fields, onSubmit, buttonLabel, loading, error, success }) => {
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
