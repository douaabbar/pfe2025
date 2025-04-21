import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Initialize from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });

  // Apply language change throughout the app
  useEffect(() => {
    // Set html lang attribute
    document.documentElement.lang = language;
    
    // Save to localStorage
    localStorage.setItem('preferredLanguage', language);
    
    console.log(`Language set to: ${language}`);
  }, [language]);

  const t = (key) => {
    if (!translations || !translations[language]) {
      console.warn('Missing translations for language:', language);
      return key;
    }
    return translations[language][key] || key;
  };

  const changeLanguage = (lang) => {
    console.log(`Changing language to: ${lang}`);
    if (lang && (lang === 'en' || lang === 'fr')) {
      setLanguage(lang);
      // You could also save the language preference to localStorage here
      localStorage.setItem('preferredLanguage', lang);
    } else {
      console.warn(`Invalid language: ${lang}`);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
