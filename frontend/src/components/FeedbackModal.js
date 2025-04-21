import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const StarRating = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <svg
            className={`h-8 w-8 ${
              star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
            } transition-colors duration-150`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Include additional user info for testimonial display
      const feedbackData = {
        rating,
        comment,
        // The backend will associate feedback with the user via JWT
        // These fields are just for reference but won't be needed on backend
        user_info: {
          full_name: user?.full_name,
          profile_image: user?.profile_image,
          is_professional: user?.is_professional,
          profession: user?.profession
        }
      };
      
      const response = await api.post('/api/feedback/', feedbackData);
      
      if (response.status === 201) {
        // Call the onSubmit prop with the feedback data
        onSubmit && onSubmit({ rating, comment });
      setSubmitted(true);
      
        // Close modal after showing thank you message
      setTimeout(() => {
        onClose();
          setRating(0);
          setComment('');
          setSubmitted(false);
      }, 2000);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(t('error.server'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate user initials if no profile image is available
  const getUserInitials = () => {
    if (!user?.full_name) return '?';
    return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Determine user type based on profile settings
  const getUserType = () => {
    if (!user) return 'User';
    if (user.is_professional) {
      return user.profession || 'Healthcare Professional';
    }
    return 'Patient';
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {submitted ? t('feedback.thanks') : t('feedback.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {submitted ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            <p className="text-gray-900 dark:text-white text-lg">
                        {t('feedback.thanks')}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
            {isAuthenticated && (
              <div className="mb-4 flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.full_name}
                    className="h-10 w-10 rounded-full mr-3 object-cover" 
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium mr-3">
                    {getUserInitials()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getUserType()}</p>
                </div>
                        </div>
                      )}
                      
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                          {t('feedback.rateExperience')}
                        </label>
              <StarRating rating={rating} setRating={setRating} />
                      </div>
                      
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                          {t('feedback.comment')}
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder={t('placeholder.commentExperience')}
                        ></textarea>
                      </div>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}
          
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t('app.loading') : t('feedback.submit')}
              </button>
            
            <button
              type="button"
              onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
                {t('feedback.doLater')}
            </button>
          </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FeedbackModal;