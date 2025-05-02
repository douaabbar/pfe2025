import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Star, LogOut, Mail, FileText, Shield } from 'lucide-react';

const ChatHeader = ({ onFeedbackClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  
  // Handle clicks outside the profile dropdown
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };
  
  // Add event listener for outside clicks
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100/90 dark:bg-gray-900/90 backdrop-blur-sm">
      {/* Logo or Brand */}
      <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
      </Link>
      
      {/* Right section with nav links and profile */}
      <div className="flex items-center gap-8">
        {/* Navigation Links */}
        <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
          {t('nav.home')}
        </Link>
        
        <Link to="/articles" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
          {t('nav.articles')}
        </Link>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={toggleMenu}
            className="flex items-center text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-primary">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <span className="ml-2">{user?.full_name || 'User'}</span>
          </button>
          
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50"
            >
              <Link
                to="/profile"
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                {t('nav.profile')}
              </Link>
              <button
                onClick={() => {
                  onFeedbackClick();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Star className="h-4 w-4 mr-2" />
                {t('feedback.title')}
              </button>
              <Link
                to="/privacy"
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('nav.privacy') || 'Privacy'}
              </Link>
              <Link
                to="/terms"
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {t('nav.terms') || 'Terms of Service'}
              </Link>
              <Link
                to="/contact"
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                onClick={() => setMenuOpen(false)}
              >
                <Mail className="h-4 w-4 mr-2" />
                {t('nav.contact') || 'Contact Us'}
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader; 