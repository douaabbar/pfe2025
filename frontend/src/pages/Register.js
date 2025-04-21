import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_professional: false,
    profession: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = t('auth.fullName') + ' ' + t('auth.passwordRequired');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = t('auth.invalidEmail');
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired');
    } else {
      const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*]/.test(formData.password)
      };
      
      if (!Object.values(passwordChecks).every(Boolean)) {
        newErrors.password = t('validation.passwordRequirements');
        newErrors.passwordChecks = passwordChecks;
      }
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsMustMatch');
    }
    
    // Validate profession if professional
    if (formData.is_professional && !formData.profession.trim()) {
      newErrors.profession = t('profile.profession') + ' ' + t('auth.passwordRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      // Redirect to login page after successful registration
      navigate('/login', { state: { message: 'Registration successful! You can now log in.' }});
    } catch (err) {
      if (err.message) {
        // Try to translate common error messages
        const translatedError = t(`error.${err.message.toLowerCase().replace(/\s+/g, '_')}`) || err.message;
        setErrors({ server: translatedError });
      } else {
        setErrors({ server: t('error.server') });
      }
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('auth.register')}</h1>
        
        {errors.server && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 text-red-600 dark:text-red-400">
            {errors.server}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.fullName')}
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors.full_name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={t('placeholder.enterFullName')}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.full_name}
              </p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={t('placeholder.enterEmail')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={t('placeholder.createPassword')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('validation.passwordRequirements')}
            </p>
          </div>
          
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full rounded-lg border ${
                errors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder={t('placeholder.confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          
          {/* Professional checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="is_professional"
                name="is_professional"
                type="checkbox"
                checked={formData.is_professional}
                onChange={handleChange}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-700 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="is_professional" className="font-medium text-gray-700 dark:text-gray-300">
                {t('profile.isProfessional')}
              </label>
            </div>
          </div>
          
          {/* Profession field (only shown if professional) */}
          {formData.is_professional && (
            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('profile.profession')}
              </label>
              <input
                id="profession"
                name="profession"
                type="text"
                value={formData.profession}
                onChange={handleChange}
                className={`w-full rounded-lg border ${
                  errors.profession ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Enter your profession"
              />
              {errors.profession && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.profession}
                </p>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex justify-center items-center mt-6"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {t('auth.register')}
          </button>
        </form>
        
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;