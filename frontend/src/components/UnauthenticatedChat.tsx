import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Send, LogIn, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface FormData {
  symptoms: string;
  city: string;
}

interface Doctor {
  name: string;
  specialty?: string;
  address?: string;
  phone?: string;
  website?: string;
}

interface Result {
  doctor_info?: Doctor[];
  error?: string;
}

const UnauthenticatedChat = () => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState<FormData>({ symptoms: '', city: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { symptoms } = formData;
    if (!symptoms.trim()) return;

    setLoading(true);
    setSubmitted(false);
    setResult(null);

    try {
      const apiLanguage = language === 'fr' ? 'french' : 'english';
      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: symptoms,
          language: apiLanguage
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await res.json();
      if (data.error) {
        setResult({ error: data.error });
      } else {
        const doctor: Doctor = {
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

  const renderDoctorInfo = (doctor: Doctor, index: number) => (
    <li key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-1">
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        Condition: {doctor.name}
      </p>
      {doctor.specialty && (
        <p className="text-gray-800 dark:text-gray-200">
          {doctor.specialty}
        </p>
      )}
      {doctor.address && (
        <p className="text-gray-800 dark:text-gray-200">
          Recommendation: {doctor.address}
        </p>
      )}
    </li>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Find a Doctor Near You
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Describe your symptoms and tell us your city. Our AI will recommend the nearest available doctor.
              </p>
            </div>

            <div className="p-6">
              {submitted && result && result.doctor_info && result.doctor_info.length > 0 ? (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Recommended Treatment
                  </h3>
                  <ul className="space-y-4">
                    {result.doctor_info.map((doctor, index) => renderDoctorInfo(doctor, index))}
                  </ul>
                </div>
              ) : submitted && result?.error ? (
                <div className="text-center text-red-600 font-semibold">
                  {result.error}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Describe your symptoms
                    </label>
                    <textarea
                      name="symptoms"
                      rows={4}
                      required
                      className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={formData.symptoms}
                      onChange={handleChange}
                      placeholder="Please describe your symptoms in detail"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Your city
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter your city name"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 ${
                      loading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Submit & Get Recommendation
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign in to save your history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthenticatedChat; 