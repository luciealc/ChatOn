// NicknameContext.js
import React, { createContext, useState } from 'react';

export const NicknameContext = createContext();

export const NicknameProvider = ({ children }) => {
  const [nickname, setNickname] = useState("");

  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
};
