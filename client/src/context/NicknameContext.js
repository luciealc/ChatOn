import React, { createContext, useState } from 'react';

export const NicknameContext = createContext();

export const NicknameProvider = ({ children }) => {
  const [nickname, setNickname] = useState("");

  console.log("NicknameContext:", nickname);

  return (
    <NicknameContext.Provider value={{ nickname, setNickname }}>
      {children}
    </NicknameContext.Provider>
  );
};

export default NicknameContext;
