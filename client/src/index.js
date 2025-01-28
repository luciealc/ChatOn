import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { NicknameProvider } from './context/NicknameContext' // Assurez-vous que le chemin est correct

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <NicknameProvider>
        <App />
      </NicknameProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
