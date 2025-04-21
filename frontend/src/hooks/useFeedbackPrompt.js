import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * A custom hook that manages showing feedback prompts to users
 * @param {Object} options
 * @param {boolean} options.showOnLogin - Whether to show feedback on login
 * @param {number} options.delay - Delay in ms before showing feedback
 * @param {number} options.probability - Probability (0-1) of showing feedback
 * @returns {Object} - The feedback state and control functions
 */
const useFeedbackPrompt = (options = {}) => {
  const {
    showOnLogin = true,
    delay = 2000,
    probability = 1
  } = options;
  
  const { isAuthenticated, user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Show feedback based on conditions
  useEffect(() => {
    if (showOnLogin && isAuthenticated) {
      const shouldShow = Math.random() <= probability;
      
      if (shouldShow) {
        const timer = setTimeout(() => {
          setShowFeedback(true);
        }, delay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, showOnLogin, delay, probability, user?.id]);
  
  // Function to show feedback manually
  const promptForFeedback = () => {
    setShowFeedback(true);
  };
  
  // Function to close feedback
  const closeFeedback = () => {
    setShowFeedback(false);
  };
  
  return {
    showFeedback,
    promptForFeedback,
    closeFeedback
  };
};

export default useFeedbackPrompt; 