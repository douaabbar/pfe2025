import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Brain, Menu, X, User, Star, LogOut, Mail, FileText, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import QuickChat from './QuickChat';
import FeedbackModal from './FeedbackModal';


// Remove flag imports that might not exist
// import flagUS from '../assets/flags/us.svg';
// import flagFR from '../assets/flags/fr.svg';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const handleChatClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setQuickChatOpen(true);
    }
  };

  const handleFeedback = () => {
    setProfileMenuOpen(false);
    setShowFeedback(true);
  };

  return (
    <>
      <header className="fixed w-full top-0 z-40 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">MedAI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t('nav.home')}
              </Link>
              <Link
                to={isAuthenticated ? "/chat" : "#"} 
                onClick={handleChatClick}
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t('nav.chat')}
              </Link>
              <Link
                to="/articles"
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t('nav.articles')}
              </Link>

            {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {user.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user.full_name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                    <span>{user.full_name}</span>
                  </button>
                  
                {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {t('nav.profile')}
                      </Link>
                      {user.is_professional && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {t('nav.admin') || 'Admin Dashboard'}
                        </Link>
                      )}
                      <button
                        onClick={handleFeedback}
                        className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {t('feedback.title')}
                      </button>
                      <Link
                        to="/privacy"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {t('nav.privacy') || 'Privacy'}
                      </Link>
                      <Link
                        to="/terms"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('nav.terms') || 'Terms of Service'}
                      </Link>
                      <Link
                        to="/contact"
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        {t('nav.contact') || 'Contact Us'}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('auth.logout')}
                      </button>
                    </motion.div>
                )}
              </div>
            ) : (
                <>
                <Link
                  to="/login"
                    className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition duration-300"
                >
                  {t('auth.register')}
                </Link>
                </>
            )}
          </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
      </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden pt-4 pb-6"
            >
              <div className="flex flex-col space-y-4">
          <Link
            to="/"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400" 
                  onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.home')}
          </Link>
          <Link
                  to={isAuthenticated ? "/chat" : "#"} 
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    if (!isAuthenticated) {
                      e.preventDefault();
                      setQuickChatOpen(true);
                    }
                  }}
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
          >
            {t('nav.chat')}
          </Link>
          <Link
            to="/articles"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400" 
                  onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.articles')}
          </Link>

        {isAuthenticated ? (
                  <>
              <Link
                to="/profile"
                      className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center" 
                      onClick={() => setIsMenuOpen(false)}
              >
                      <User className="h-4 w-4 mr-2" />
                {t('nav.profile')}
              </Link>
              {user.is_professional && (
                <Link
                  to="/admin"
                  className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('nav.admin') || 'Admin Dashboard'}
                </Link>
              )}
                    <button 
                      className="text-left text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowFeedback(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      {t('feedback.title')}
                    </button>
              <button
                onClick={handleLogout}
                      className="text-left text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
              >
                      <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </button>
                  </>
        ) : (
                  <>
              <Link
                to="/login"
                      className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400" 
                      onClick={() => setIsMenuOpen(false)}
              >
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition duration-300 inline-block" 
                      onClick={() => setIsMenuOpen(false)}
              >
                {t('auth.register')}
              </Link>
                  </>
        )}
        
        {/* Common links for both authenticated and non-authenticated users */}
        <Link
          to="/privacy"
          className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center mt-4" 
          onClick={() => setIsMenuOpen(false)}
        >
          <Shield className="h-4 w-4 mr-2" />
          {t('nav.privacy')}
        </Link>
        <Link
          to="/terms"
          className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center" 
          onClick={() => setIsMenuOpen(false)}
        >
          <FileText className="h-4 w-4 mr-2" />
          {t('nav.terms')}
        </Link>
        <Link
          to="/contact"
          className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center" 
          onClick={() => setIsMenuOpen(false)}
        >
          <Mail className="h-4 w-4 mr-2" />
          {t('nav.contact')}
        </Link>
      </div>
            </motion.div>
          )}
    </nav>
      </header>

      {/* Quick Chat Popup */}
      <QuickChat isOpen={quickChatOpen} onClose={() => setQuickChatOpen(false)} />
      
      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={(data) => console.log('Feedback submitted:', data)}
      />
    </>
  );
};

export default Navbar;