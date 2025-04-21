import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleDarkMode}
      className="fixed bottom-8 right-8 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
      title={darkMode ? "Dark Mode" : "Light Mode"} // Tooltip natif ici
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}//Sert aux technologies d'assistance pour les utilisateurs malvoyants
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
      {darkMode ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-blue-600" />
      )}
      </motion.div>
    </motion.button>
  );
};

export default DarkModeToggle; 