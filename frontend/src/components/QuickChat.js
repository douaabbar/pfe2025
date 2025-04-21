import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const QuickChat = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([
    {
      sender: 'ai',
      message: t('welcome.askAnything')
    }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to conversation
    setConversation(prev => [
      ...prev,
      { sender: 'user', message: message.trim() }
    ]);
    
    // Clear input
    setMessage('');
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      setConversation(prev => [
        ...prev,
        { 
          sender: 'ai', 
          message: t('chat.detailedConversationPrompt')
        }
      ]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed top-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('chat.quickChat')}</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Chat Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {conversation.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
              }`}
            >
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('placeholder.typeMessage')}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        
        <Link
          to="/chat"
          state={{ forceUnauth: true }}
          className="block text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-3"
          onClick={onClose}
        >
          {t('chat.continueToFullExperience')}
        </Link>
      </div>
    </motion.div>
  );
};

export default QuickChat; 