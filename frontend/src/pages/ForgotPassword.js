import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('auth.invalidEmail'))
        .required(t('auth.emailRequired')),
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError('');
      
      try {
        await axios.post('/api/auth/forgot-password', {
          email: values.email,
        });
        setSuccess(true);
      } catch (err) {
        setError(
          err.response?.data?.message || 
          'An error occurred. Please try again later.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.forgotPassword')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.enterEmailToReset')}
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  {t('auth.resetLinkSent')}
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    {t('auth.checkEmailForReset')}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      to="/login"
                      className="px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {t('auth.backToLogin')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>

            {formik.touched.email && formik.errors.email ? (
              <div className="text-red-500 text-sm">{formik.errors.email}</div>
            ) : null}

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isSubmitting
                    ? 'bg-indigo-400'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isSubmitting ? t('app.loading') : t('auth.sendResetLink')}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-sm">
                <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword; 