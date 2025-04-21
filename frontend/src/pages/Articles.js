import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

// Components
import ArticleCard from '../components/ArticleCard';

const Articles = () => {
  const { language, t } = useLanguage();
  
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch categories and articles
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/articles/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
        setError(err.response?.data?.error || 'Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Use direct language-specific endpoints to avoid CORS issues
        let url;
        if (language === 'en') {
          url = selectedCategory === 'all'
            ? `/api/articles/english`
            : `/api/articles/english?category=${selectedCategory}`;
        } else {
          url = selectedCategory === 'all'
            ? `/api/articles/french`
            : `/api/articles/french?category=${selectedCategory}`;
        }
        
        const response = await api.get(url);
        setArticles(response.data.articles || response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch articles', err);
        setError(err.response?.data?.error || t('articles.failedToLoad'));
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [selectedCategory, language, t]);
  
  // Filter articles based on search query
  const filteredArticles = articles.filter(article => {
    if (!article) return false;
    
    const title = article.title || ''; // Use the title directly since it's already in the correct language
    const summary = article.summary || ''; // Use the summary directly since it's already in the correct language
    
    const searchText = searchQuery.toLowerCase();
    return (
      title.toLowerCase().includes(searchText) || 
      summary.toLowerCase().includes(searchText)
    );
  });
  
  return (
    <div className="pt-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('articles.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('articles.stayInformed')}
        </p>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder={t('articles.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">{t('articles.allCategories')}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(`articles.categories.${category}`) || category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Articles Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-lg">{t('articles.noResults')}</p>
            <p className="mt-1">{t('articles.adjustSearch')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles;