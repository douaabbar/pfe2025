// pages/Chat/UnauthenticatedChat.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const UnauthenticatedChat = () => {
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // No API logic for now
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#f7fcfb] dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {t('findDoctor.title') || 'Trouvez un médecin près de chez vous'}
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {t('findDoctor.subtitle') || 'Décrivez vos symptômes et indiquez-nous votre ville. Notre IA recommandera le médecin disponible le plus proche.'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1 text-gray-800 dark:text-gray-200" htmlFor="symptoms">
              {t('findDoctor.symptomsLabel') || 'Décrivez vos symptômes'}
            </label>
            <textarea
              id="symptoms"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={4}
              placeholder={t('findDoctor.symptomsPlaceholder') || 'Veuillez décrire vos symptômes en détail'}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block font-semibold mb-1 text-gray-800 dark:text-gray-200" htmlFor="city">
              {t('findDoctor.cityLabel') || 'Votre ville'}
            </label>
            <input
              id="city"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={t('findDoctor.cityPlaceholder') || 'Entrez le nom de votre ville'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-md flex items-center justify-center text-lg transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 12H2m0 0l7-7m-7 7l7 7" />
            </svg>
            {t('findDoctor.submit') || 'Soumettre et obtenir une recommandation'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-base flex items-center justify-center gap-1"
          >
            <span>&#8594;</span> {t('findDoctor.signInToSave') || 'Connectez-vous pour sauvegarder votre historique'}
          </Link>
        </div>
      </div>
      <div className="flex justify-center gap-8 my-6">
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-gray-600 shadow transition font-semibold text-blue-700 dark:text-blue-200"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>
        <Link
          to="/articles"
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-pink-50 hover:bg-pink-100 dark:bg-gray-700 dark:hover:bg-gray-600 shadow transition font-semibold text-pink-700 dark:text-pink-200"
        >
          <BookOpen className="h-5 w-5" />
          Articles
        </Link>
      </div>
    </div>
  );
};

export default UnauthenticatedChat;
