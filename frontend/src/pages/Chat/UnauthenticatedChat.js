// pages/Chat/UnauthenticatedChat.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const UnauthenticatedChat = () => {
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
    <li key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-1 mt-4">
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {t('findDoctor.condition') || 'Condition'}: {doctor.name}
      </p>
      {doctor.specialty && (
        <p className="text-gray-800 dark:text-gray-200">{doctor.specialty}</p>
      )}
      {doctor.address && (
        <p className="text-gray-800 dark:text-gray-200">
          {t('findDoctor.recommendation') || 'Recommendation'}: {doctor.address}
        </p>
      )}
    </li>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#f7fcfb] dark:bg-gray-900 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          {t('findDoctor.title') || 'Trouvez un médecin près de chez vous'}
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {t('findDoctor.subtitle') || 'Décrivez vos symptômes et indiquez-nous votre ville. Notre IA recommandera le médecin disponible le plus proche.'}
        </p>

        {submitted && result && result.doctor_info?.length > 0 ? (
          <ul>{result.doctor_info.map(renderDoctorInfo)}</ul>
        ) : submitted && result?.error ? (
          <p className="text-red-600 font-semibold mt-4">{result.error}</p>
        ) : null}

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
              required
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
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-md flex items-center justify-center text-lg transition"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 12H2m0 0l7-7m-7 7l7 7" />
              </svg>
            )}
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
    </div>
  );
};

export default UnauthenticatedChat;
