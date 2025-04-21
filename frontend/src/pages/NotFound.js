import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          {t('error.notFound')}
        </h2>
        <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('error.goHome')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;