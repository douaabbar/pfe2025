import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const ArticleCard = ({ article }) => {
  const { t } = useLanguage();
  
  // Map snake_case fields from backend to camelCase for component
  const {
    title,
    summary,
    category,
    image_url: imageUrl,  // Backend uses image_url, map to imageUrl
    source_url: sourceUrl, // Backend uses source_url, map to sourceUrl
    read_more_url: readMoreUrl, // Backend uses read_more_url
    created_at: createdAt  // Backend uses created_at, map to createdAt
  } = article;

  // Get a themed placeholder image based on category
  const getPlaceholderImage = (category) => {
    const placeholders = {
      general: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=500',
      nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=500',
      fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=500',
      mental_health: 'https://images.unsplash.com/photo-1474418397713-7ede21d49118?q=80&w=500',
      preventive_care: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=500'
    };
    return placeholders[category] || placeholders.general;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return '';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      nutrition: 'bg-green-100 text-green-800',
      fitness: 'bg-blue-100 text-blue-800',
      mental_health: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
      preventive_care: 'bg-red-100 text-red-800'
    };
    return colors[category] || colors.general;
  };

  // Determine the article URL - prefer the source URL if available
  const articleUrl = sourceUrl || readMoreUrl || `/articles/${article.id}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
      <div className="relative h-48 w-full">
        <img
          src={imageUrl || getPlaceholderImage(category)}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getPlaceholderImage(category);
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
            {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {summary}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(createdAt)}
          </span>
          <div className="flex">
            {/* Single Read More link that points to the article source */}
            {articleUrl.startsWith('/') ? (
              <Link
                to={articleUrl}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center"
              >
                {t('articles.readMore')}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <a
                href={articleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center"
              >
                {t('articles.readMore')}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;