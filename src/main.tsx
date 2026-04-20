import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { trackEvent } from './lib/tracking';
import './index.css';

trackEvent('visit');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
