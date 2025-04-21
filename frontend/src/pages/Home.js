import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Clock, Shield, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import TestimonialsSection from '../components/TestimonialsSection';
import api from '../utils/api';
import ArticleCard from '../components/ArticleCard';

// Feature cards data
const features = [
  {
    icon: <Brain className="h-10 w-10 text-blue-500" />,
    title: (t) => t('features.aiAnalysis.title'),
    description: (t) => t('features.aiAnalysis.description')
  },
  {
    icon: <Clock className="h-10 w-10 text-blue-500" />,
    title: (t) => t('features.availability.title'),
    description: (t) => t('features.availability.description')
  },
  {
    icon: <Shield className="h-10 w-10 text-blue-500" />,
    title: (t) => t('features.privacy.title'),
    description: (t) => t('features.privacy.description')
  }
];

const Home = () => {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch articles based on current language
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // Use the language-specific endpoints
        const url = language === 'en' ? '/api/articles/english' : '/api/articles/french';
        const response = await api.get(url);
        
        // Get the first 3 articles
        const fetchedArticles = response.data.slice(0, 3);
        setArticles(fetchedArticles);
      } catch (error) {
        console.error('Failed to fetch articles for home page:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [language]);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="h-[95vh] relative flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4 max-w-4xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {t('home.welcome')}
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8">
            {t('home.subtitle')}
          </p>
            <Link
              to={isAuthenticated ? "/chat" : "/register"}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md transition duration-300"
            >
              {t('home.getStarted')}
            </Link>
        </motion.div>
      </section>
      
      {/* Why Choose SympAI Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t('home.featuresTitle')}
          </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {typeof feature.title === 'function' ? feature.title(t) : feature.title}
            </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {typeof feature.description === 'function' ? feature.description(t) : feature.description}
            </p>
          </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Latest Health Articles */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('articles.title')}
          </h2>
            <Link 
              to="/articles" 
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>{t('articles.viewAll')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Testimonials Section - Using the new component */}
      <TestimonialsSection />
      
      {/* Call to Action */}
      <section className="py-20 bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('home.ctaTitle')}
        </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t('home.ctaSubtitle')}
        </p>
        <Link
          to={isAuthenticated ? "/chat" : "/register"}
            className="inline-block bg-white text-blue-600 font-medium px-8 py-3 rounded-md hover:bg-blue-50 transition duration-300"
        >
            {t('home.getStarted')}
        </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;