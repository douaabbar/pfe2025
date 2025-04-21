import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import FeedbackModal from '../components/FeedbackModal';

const Chat = () => {
  const { user, getToken, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // For unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setChatHistory([
        {
          id: 'welcome',
          sender: 'ai',
          content: 'Hello! How can I assist you with your health concerns today?',
          created_at: new Date().toISOString()
        }
      ]);
    }
  }, [isAuthenticated]);
  
  // Show feedback modal after login (and on mount)
  useEffect(() => {
    if (isAuthenticated) {
      // Show feedback after a short delay
      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);
  
  // Scroll to bottom when chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
        content: message,
      created_at: new Date().toISOString()
      };
      
    // Add user message to chat history
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
      
    try {
      // For authenticated users, send to backend
      if (isAuthenticated) {
        const token = getToken();
        const response = await axios.post('/api/chat/message', {
          content: message
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const aiMessage = {
          id: response.data.id || `ai-${Date.now()}`,
          sender: 'ai',
          content: response.data.response || 'I understand your concern. Let me look into that for you.',
          created_at: new Date().toISOString()
        };
        
        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        // Simulate AI response for unauthenticated users
        setTimeout(() => {
          const aiMessage = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            content: 'I understand your concern. For a more personalized experience, please sign up or log in.',
            created_at: new Date().toISOString()
          };
          
          setChatHistory(prev => [...prev, aiMessage]);
      setLoading(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setLoading(false);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  const handleSubmitFeedback = (feedbackData) => {
    console.log('Feedback submitted:', feedbackData);
    // You can add API call to save feedback here if needed
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar for authenticated users */}
        {isAuthenticated && (
          <div className="w-full md:w-64 bg-gray-100 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chat History</h2>
          <button
                className="w-full py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-5 w-5" />
                <span>New Chat</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {/* Here you would map through user's chat history */}
              <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 cursor-pointer">
                Current Chat
              </div>
              {/* Example previous chats */}
              <div className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                Previous Chat 1
              </div>
              <div className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                Previous Chat 2
              </div>
            </div>
            </div>
          )}
          
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">MedAI Assistant</h1>
            {user && (
              <div className="flex items-center">
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt={user.full_name}
                    className="h-8 w-8 rounded-full" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <span className="ml-2 text-gray-700 dark:text-gray-300">
                  {user.full_name}
                </span>
              </div>
            )}
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                  Welcome to MedAI
                </h2>
                <p className="max-w-md text-gray-600 dark:text-gray-400">
                  Ask me anything about your symptoms, health concerns, or general medical questions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-3/4 rounded-lg p-3 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none'
                      }`}
                    >
                      <div className="mb-1">{msg.content}</div>
                      <div 
                        className={`text-xs ${
                          msg.sender === 'user' 
                            ? 'text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTimestamp(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 text-gray-900 dark:text-white rounded-tl-none">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="h-2 w-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
          <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form className="flex items-center gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
                className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="h-5 w-5" />
            </button>
          </form>
            
            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
              This is not a substitute for professional medical advice. Please consult a healthcare provider for serious concerns.
          </p>
          </div>
        </div>
      </div>
      
      {/* Feedback Modal */}
        <FeedbackModal
        isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
        onSubmit={handleSubmitFeedback}
        />
    </div>
  );
};

export default Chat;