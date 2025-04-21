import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';
import api from '../utils/api';

// Components
import ArticleCard from '../components/ArticleCard';

const ArticleDetail = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Handle external URLs
  useEffect(() => {
    if (!id) return;
    
    // Check for various URL patterns
    const isUrl = id.includes('://') || id.startsWith('www.');
    if (isUrl) {
      const url = id.startsWith('http') ? id : `https://${id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      navigate('/articles'); // Go back to articles list
      return;
    }
  }, [id, navigate]);
  
  // Fetch article details
  useEffect(() => {
    const fetchArticle = async () => {
      // Skip fetching if ID appears to be a URL
      if (!id || id.includes('://') || id.startsWith('www.')) {
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        const response = await api.get(`/api/articles/${id}?language=${language}`);
        const articleData = response.data;
        
        // If the article is external (has source_url), redirect to it
        if (articleData.source_url) {
          window.open(articleData.source_url, '_blank', 'noopener,noreferrer');
          navigate('/articles');
          return;
        }
        
        setArticle(articleData);
        setLoading(false);
        
        // Fetch related articles in the same category
        if (articleData.category) {
          const relatedResponse = await api.get(
            `/api/articles?category=${articleData.category}&language=${language}&limit=3`
          );
          
          // Filter out the current article and any external articles
          const filtered = (relatedResponse.data.articles || relatedResponse.data || [])
            .filter(relatedArticle => 
              relatedArticle.id !== id && 
              (!relatedArticle.source_url || !relatedArticle.id.toString().includes('://'))
            );
          
          setRelatedArticles(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch article', err);
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load article');
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, language, navigate]);
  
  // Format the date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return '';
    }
  };
  
  // Get title, content based on language
  const getLocalizedField = (article, field) => {
    if (!article) return '';
    
    const fieldName = `${field}_${language}`;
    const fallbackField = `${field}_en`;
    
    return article[fieldName] || article[fallbackField] || article[field] || '';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 text-red-600 dark:text-red-400 my-8">
        <p>{error}</p>
        <button
          onClick={() => navigate('/articles')}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('articles.backToList')}
        </button>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-lg">{t('articles.notFound')}</p>
          <Link
            to="/articles"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('articles.backToList')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-8 pb-16">
      {/* Article Header */}
      <div className="mb-8">
        <Link
          to="/articles"
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('app.back')}
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {getLocalizedField(article, 'title')}
        </h1>
        
        <div className="flex flex-wrap items-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          <span className="mr-4">
            <span className="font-medium">{t('articles.publishedOn')}:</span> {formatDate(article.created_at)}
          </span>
          
          <span className="mr-4">
            <span className="font-medium">{t('articles.category')}:</span> {article.category}
          </span>
          
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <span className="font-medium">{t('articles.source')}</span>
              <svg className="inline-block ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
      
      {/* Article Image */}
      {article.image_url && (
        <div className="mb-8">
          <img
            src={article.image_url}
            alt={getLocalizedField(article, 'title')}
            className="w-full h-auto object-cover rounded-lg max-h-96"
          />
        </div>
      )}
      
      {/* Article Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert mb-12">
        <div dangerouslySetInnerHTML={{ __html: getLocalizedField(article, 'content') }} />
      </div>
      
      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('articles.relatedArticles')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <ArticleCard
                key={relatedArticle.id}
                article={relatedArticle}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;