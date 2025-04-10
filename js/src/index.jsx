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

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
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
