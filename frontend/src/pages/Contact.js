import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mail, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('legal.contact.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {t('legal.contact.subtitle')}
        </p>
        
        <p className="text-gray-700 dark:text-gray-300 mb-8">
          {t('legal.contact.intro')}
        </p>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('legal.contact.email')}</h3>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <MapPin className="h-6 w-6 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('legal.contact.address')}</h3>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('legal.contact.hours')}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact; 