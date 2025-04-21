import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { US, FR } from 'country-flag-icons/react/3x2';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Main toggle button with flags */}
      <motion.button
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMenu}
        className="fixed bottom-28 right-8 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center"
        aria-label="Change language"
      >
        {language === 'fr' ? (
          <FR className="w-6 h-4" title="Français" />
        ) : (
          <US className="w-6 h-4" title="English" />
        )}
      </motion.button>

      {/* Language dropdown menu with animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed right-8 bottom-[calc(7rem_+_60px)] w-40 bg-white dark:bg-gray-800 shadow-lg rounded-md z-40 border border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={() => handleLanguageChange('en')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-white"
            >
              <US className="w-5 h-3.5" /> 
              <span>English</span>
            </button>
            <button
              onClick={() => handleLanguageChange('fr')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-white"
            >
              <FR className="w-5 h-3.5" />
              <span>Français</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageToggle;
