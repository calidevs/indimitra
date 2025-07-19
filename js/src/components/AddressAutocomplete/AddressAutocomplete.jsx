import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';

const AddressAutocomplete = ({ value, onChange, onValidAddress }) => {
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  const [isValid, setIsValid] = useState(false);
  const [googleMapsAvailable, setGoogleMapsAvailable] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Check if Google Maps API is available
        if (
          typeof window !== 'undefined' &&
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          inputRef.current
        ) {
          console.log('Google Maps API is available');
          setGoogleMapsAvailable(true);

          const inputElement = inputRef.current;
          if (!inputElement) {
            console.error('Input element not found');
            setGoogleMapsAvailable(false);
            return;
          }

          const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
            types: ['address'], // Only show addresses, not businesses
            componentRestrictions: { country: 'us' }, // Restrict to US addresses
          });
          autocompleteRef.current = autocomplete;

          // Force dropdown to attach to <body> and set high z-index
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            document.body.appendChild(pacContainer);
            pacContainer.style.zIndex = '99999';
          }

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.formatted_address) {
              setSelectedPlace(place);
              onChange(place.formatted_address);
              setIsValid(true);
              onValidAddress(true);
            } else {
              setSelectedPlace(null);
              setIsValid(false);
              onValidAddress(false);
            }
          });
        } else {
          // Fallback: treat as simple text input
          console.log('Google Maps API not available, using fallback mode');
          setGoogleMapsAvailable(false);
          // Consider any non-empty address as valid for fallback
          if (value && value.trim().length > 10) {
            setIsValid(true);
            onValidAddress(true);
          } else {
            setIsValid(false);
            onValidAddress(false);
          }
        }
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error);
        setGoogleMapsAvailable(false);
        // Fallback to simple text input
        if (value && value.trim().length > 10) {
          setIsValid(true);
          onValidAddress(true);
        } else {
          setIsValid(false);
          onValidAddress(false);
        }
      }
    }, 300); // small delay for dialog/step render

    return () => clearTimeout(timer);
  }, [onChange, onValidAddress, value]);

  useEffect(() => {
    if (value === '') {
      setIsValid(false);
      onValidAddress(false);
      setSelectedPlace(null);
    } else if (!googleMapsAvailable && value.trim().length > 10) {
      // For fallback mode, consider addresses longer than 10 chars as valid
      setIsValid(true);
      onValidAddress(true);
    }
  }, [value, onValidAddress, googleMapsAvailable]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    // If user manually types and it's not from a selected place, mark as invalid
    if (googleMapsAvailable && selectedPlace && newValue !== selectedPlace.formatted_address) {
      setIsValid(false);
      onValidAddress(false);
      setSelectedPlace(null);
    } else if (!googleMapsAvailable) {
      // For fallback mode, validate on change
      if (newValue.trim().length > 10) {
        setIsValid(true);
        onValidAddress(true);
      } else {
        setIsValid(false);
        onValidAddress(false);
      }
    }
  };

  return (
    <TextField
      inputRef={inputRef}
      label="Address"
      fullWidth
      multiline
      rows={3}
      value={value}
      error={!isValid && value !== ''}
      helperText={
        !googleMapsAvailable
          ? 'Enter your complete address (street, city, state, zip code)'
          : !isValid && value !== ''
            ? 'Please select a valid address from the suggestions above.'
            : googleMapsAvailable && !selectedPlace
              ? 'Start typing to see address suggestions...'
              : ''
      }
      onChange={handleInputChange}
      placeholder={
        googleMapsAvailable
          ? 'Start typing to see address suggestions...'
          : 'Enter your complete address (e.g., 123 Main St, City, State 12345)'
      }
    />
  );
};

export default AddressAutocomplete;
