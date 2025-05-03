// QuickChat.js
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const QuickChat = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setSubmitted(false);
    setResult(null);

    try {
      const apiLanguage = language === 'fr' ? 'french' : 'english';

      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: symptoms, language: apiLanguage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await res.json();
      if (data.error) {
        setResult({ error: data.error });
      } else {
        const doctor = {
          name: data.prediction1 || 'Unknown Condition',
          specialty: `Confidence: ${data.confidence}%`,
          address: data.prediction || ''
        };
        setResult({ doctor_info: [doctor] });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error:', err);
      setResult({ error: 'An error occurred while finding a doctor. Please try again.' });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorInfo = (doctor, index) => (
    <li key={index} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg space-y-1 mt-2">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {t('findDoctor.condition') || 'Condition'}: {doctor.name}
      </p>
      {doctor.specialty && (
        <p className="text-gray-800 dark:text-gray-200 text-sm">{doctor.specialty}</p>
      )}
      {doctor.address && (
        <p className="text-gray-800 dark:text-gray-200 text-sm">
          {t('findDoctor.recommendation') || 'Recommendation'}: {doctor.address}
        </p>
      )}
    </li>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed top-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('chat.quickChat')}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200" htmlFor="symptoms">
              {t('findDoctor.symptomsLabel') || 'Décrivez vos symptômes'}
            </label>
            <textarea
              id="symptoms"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 resize-none bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              rows={3}
              placeholder={t('findDoctor.symptomsPlaceholder') || 'Veuillez décrire vos symptômes en détail'}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200" htmlFor="city">
              {t('findDoctor.cityLabel') || 'Votre ville'}
            </label>
            <input
              id="city"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
              placeholder={t('findDoctor.cityPlaceholder') || 'Entrez le nom de votre ville'}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded-md flex items-center justify-center text-sm transition"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                />
              </svg>
            ) : null}
            {t('findDoctor.submit') || 'Soumettre et obtenir une recommandation'}
          </button>
        </form>

        {submitted && result && result.doctor_info?.length > 0 ? (
          <ul className="mt-4">{result.doctor_info.map(renderDoctorInfo)}</ul>
        ) : submitted && result?.error ? (
          <p className="text-red-600 font-semibold mt-3 text-sm">{result.error}</p>
        ) : null}

        <div className="mt-4 text-center">
          <Link
            to="/chat"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            {t('chat.continueToFullExperience')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickChat;
