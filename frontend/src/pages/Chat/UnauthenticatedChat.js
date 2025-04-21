// pages/Chat/UnauthenticatedChat.js
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import { getTranslation } from '../../utils/translations';
import { AlertTriangle, MessageSquare, Send, Loader, RefreshCcw } from 'lucide-react';
import axios from 'axios';

const UnauthenticatedChat = () => {
  const { language } = useContext(LanguageContext);
  const t = (key) => getTranslation(language, key);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: t('unauth.initialPrompt') },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus on input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/predict', {
        message: userMessage,
        language,
      });

      if (res.data && res.data.message) {
        // Ajout d'un léger délai pour simuler la saisie de réponse
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'bot', text: res.data.message }]);
          setLoading(false);
        }, 500);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(t('unauth.error'));
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([{ type: 'bot', text: t('unauth.initialPrompt') }]);
    setInput('');
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 text-blue-500 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('unauth.title')}</h1>
          </div>
          <button 
            onClick={handleNewChat}
            className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 flex items-center text-sm"
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            {t('unauth.startNew')}
          </button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('unauth.subtitle')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">{t('unauth.disclaimer')}</p>
        
        <div className="flex-grow overflow-y-auto mb-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm text-gray-800 dark:text-white rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-3 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <button 
                onClick={handleNewChat}
                className="text-sm underline mt-1"
              >
                {t('unauth.startNew')}
              </button>
            </div>
          </div>
        )}
        
        <div className="flex mt-2 relative">
          <input
            ref={inputRef}
            className="flex-grow border border-gray-300 dark:border-gray-600 rounded-l-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('unauth.inputPlaceholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <Link 
            to="/login" 
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {t('unauth.continue')} →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthenticatedChat;
