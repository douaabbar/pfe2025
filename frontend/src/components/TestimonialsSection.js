import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import api from '../utils/api';

// Star rating component
const StarRating = ({ rating }) => {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${
            i < rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Testimonial Item component
const TestimonialItem = ({ feedback }) => {
  // Get user information
  const getUserInfo = () => {
    if (!feedback.user) {
      return { 
        name: "Anonymous User", 
        role: "User",
        initials: "A"
      };
    }
    
    const name = feedback.user.full_name;
    let role = "User";
    
    if (feedback.user.is_professional) {
      role = feedback.user.profession || "Healthcare Professional";
    } else {
      role = "Patient";
    }
    
    // Generate initials for avatar fallback
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    return { name, role, initials };
  };

  const userInfo = getUserInfo();
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow-md">
      <div className="flex items-center mb-4">
        {feedback.user?.profile_image ? (
          <img 
            src={feedback.user.profile_image}
            alt={userInfo.name} 
            className="h-12 w-12 rounded-full mr-4 object-cover" 
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium mr-4">
            {userInfo.initials}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {userInfo.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {userInfo.role}
          </p>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        "{feedback.comment}"
      </p>
      <StarRating rating={feedback.rating} />
    </div>
  );
};

// Modal to show all testimonials
const TestimonialsModal = ({ isOpen, onClose }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (isOpen) {
      loadTestimonials(1, true);
    }
  }, [isOpen]);
  
  const loadTestimonials = async (pageNum, reset = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/feedback/?page=${pageNum}&per_page=6`);
      
      if (reset) {
        setTestimonials(response.data.items);
      } else {
        setTestimonials(prev => [...prev, ...response.data.items]);
      }
      
      setPage(pageNum);
      setHasMore(pageNum < response.data.pages);
    } catch (err) {
      console.error('Error loading testimonials:', err);
      setError('Failed to load testimonials. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadTestimonials(page + 1);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto relative z-10"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 py-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User Testimonials
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((feedback) => (
              <TestimonialItem key={feedback.id} feedback={feedback} />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No testimonials available yet.</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Main Testimonials Section component
const TestimonialsSection = () => {
  const [topTestimonials, setTopTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  
  useEffect(() => {
    fetchTopTestimonials();
  }, []);
  
  const fetchTopTestimonials = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/feedback/top?count=3');
      setTopTestimonials(response.data);
    } catch (err) {
      console.error('Error fetching top testimonials:', err);
      setError('Failed to load testimonials. Please try again later.');
      setTopTestimonials([]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          What Our Users Say
        </h2>
        
        {error && (
          <div className="max-w-lg mx-auto mb-8 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-center">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : topTestimonials.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topTestimonials.map((feedback, index) => (
                <motion.div
                  key={feedback.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <TestimonialItem feedback={feedback} />
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <button
                onClick={() => setShowAllModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                See More Comments
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No testimonials available yet. Be the first to leave your feedback!
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAllModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                See All Feedback
              </button>
            </div>
          </div>
        )}
      </div>
      
      <TestimonialsModal 
        isOpen={showAllModal} 
        onClose={() => setShowAllModal(false)} 
      />
    </section>
  );
};

export default TestimonialsSection; 