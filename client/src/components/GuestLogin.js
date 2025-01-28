import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from "socket.io-client";
import { NicknameContext } from '../context/NicknameContext';

const socket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:3003");

function GuestLogin() {
  const [nicknameInput, setNicknameInput] = useState('');
  const { setNickname } = useContext(NicknameContext);
  const navigate = useNavigate();

  const handleGuestLogin = (e) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      socket.emit('setNickname', nicknameInput);
      socket.on('nicknameSet', (nick) => {
        setNickname(nick); // Met à jour le contexte avec le pseudonyme
        navigate('/chat'); // Redirige vers la page de chat après la connexion
      });
    } else {
      alert('Please enter a nickname');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900" 
    style={{
      backgroundImage: "url('./vecteezy_green-background-black-cats-seamless-pattern_47550627.jpg')",
      backgroundSize: 'cover',
      backgroundBlendMode: 'overlay',
      animation: 'slideBackground 20s linear infinite',
      fontFamily: 'Poppins, sans-serif'
    }}
    role="main"
    aria-label="Guest Login page">
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        @keyframes slideBackground {
          from { background-position: 0 0; }
          to { background-position: 50% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}
    </style>
      <form onSubmit={handleGuestLogin} className="bg-white/90 backdrop-blur-md p-10 rounded-xl shadow-2xl w-96 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome to ChatOn</h2>
        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium text-gray-700">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            placeholder="Enter your nickname"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Join Chat
        </button>
        <p className="text-sm text-gray-600 text-center mt-4">
          Start chatting instantly with other users
        </p>
      </form>
    </div>
  );}

export default GuestLogin;