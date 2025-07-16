import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';

const AddressAutocomplete = ({ value, onChange, onValidAddress }) => {
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.google && window.google.maps && inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
        autocompleteRef.current = autocomplete;
  
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.formatted_address) {
            onChange(place.formatted_address);
            setIsValid(true);
            onValidAddress(true);
          } else {
            setIsValid(false);
            onValidAddress(false);
          }
        });
      }
    }, 300); // delay to ensure inputRef is available
  
    return () => clearTimeout(timer);
  }, [onChange, onValidAddress]); // no need to depend on value  

  useEffect(() => {
    if (value === '') {
      setIsValid(false);
      onValidAddress(false);
    }
  }, [value, onValidAddress]);

  return (
    <TextField
      inputRef={inputRef}
      label="Address"
      fullWidth
      multiline
      rows={3}
      value={value}
      error={!isValid}
      helperText={!isValid ? 'Please select a valid address from the suggestions.' : ''}
      onChange={(e) => {
        onChange(e.target.value);
        setIsValid(false);
        onValidAddress(false);
      }}
    />
  );
};

export default AddressAutocomplete;
