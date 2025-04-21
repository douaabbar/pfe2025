import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    
    // Check if user prefers dark mode in their OS settings
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};