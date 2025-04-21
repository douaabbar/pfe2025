import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Default redirect to chat page unless there's a specific redirect path
  const from = location.state?.from?.pathname || '/chat';
  const successMessage = location.state?.message || '';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4 pt-24"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('auth.login')}</h1>
        
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md p-4 text-green-600 dark:text-green-400">
            {successMessage}
        </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 text-red-600 dark:text-red-400">
            {t(`error.${error.toLowerCase().replace(/\s+/g, '_')}`) || error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email')}
              </label>
              <input
              type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('placeholder.enterEmail')}
              required
              />
            </div>
          
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <input
              type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('placeholder.createPassword')}
              required
              />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {t('auth.rememberMe')}
              </label>
            </div>
            
            <div className="text-sm">
              <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </div>
          
            <button
              type="submit"
              disabled={loading}
            className="w-full btn-primary py-3 flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {t('auth.login')}
            </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;