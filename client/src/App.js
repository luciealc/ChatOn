import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GuestLogin from './components/GuestLogin';
import ChatPage from './components/ChatPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestLogin />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
