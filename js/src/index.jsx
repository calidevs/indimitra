import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './styles/index.css';
import amplifyConfig from './amplifyConfig.js';
import { Amplify } from 'aws-amplify';

Amplify.configure(amplifyConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Reduce retries to avoid silent failures
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0, // Ensure mutation state updates correctly
    },
  },
});

// Counter component with increment, decrement, clear, and reset functionalities
// Includes styling for buttons and count paragraph
const Counter = () => {
  const [count, setCount] = useState(0);

  // Styling for the count paragraph
  const countStyle = {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '20px',
  };

  // Styling for the buttons
  const buttonStyle = {
    fontSize: '1.5rem',
    padding: '10px 20px',
    margin: '0 10px',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  // Styling for the increment button
  const incrementButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50', // Green
    color: 'white',
  };

  // Styling for the decrement button
  const decrementButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336', // Red
    color: 'white',
  };

  // Styling for the clear button
  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2196F3', // Blue
    color: 'white',
  };

  // Styling for the reset button
  const resetButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#FF9800', // Orange
    color: 'white',
  };

  return (
    <div>
      <p style={countStyle}>Count: {count}</p>
      <button style={incrementButtonStyle} onClick={() => setCount(count + 1)}>Increment</button>
      <button style={decrementButtonStyle} onClick={() => setCount(count - 1)}>Decrement</button>
      <button style={clearButtonStyle} onClick={() => setCount(0)}>Clear</button>
      <button style={resetButtonStyle} onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <Counter />
    </BrowserRouter>
);