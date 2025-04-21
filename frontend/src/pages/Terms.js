import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Terms = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('legal.terms.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t('legal.terms.subtitle')}
        </p>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {t('legal.terms.intro')}
        </p>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('legal.terms.section1.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.terms.section1.content')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('legal.terms.section2.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.terms.section2.content')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('legal.terms.section3.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.terms.section3.content')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('legal.terms.section4.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.terms.section4.content')}
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {t('legal.terms.section5.title')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              {t('legal.terms.section5.content')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms; 