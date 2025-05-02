import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import ChatHistory from '../../components/ChatHistory';
import ChatMessage from '../../components/ChatMessage';
import FeedbackModal from '../../components/FeedbackModal';
import LanguageToggle from '../../components/LanguageToggle';
import DarkModeToggle from '../../components/DarkModeToggle';
import ChatHeader from '../../components/ChatHeader';
import { motion } from 'framer-motion';
import { UserCircle, LogOut, MessageSquare, Star, PlusCircle, Home, BookOpen, User } from 'lucide-react';
import api from '../../utils/api';
import logo from '../../assets/images/logo.png';

const AuthenticatedChat = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false); // Local state for feedback modal
  const messageEndRef = useRef(null);
  const profileRef = useRef(null);
  const userInitials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  // Show feedback modal on mount
  useEffect(() => {
    setShowFeedback(true);
  }, []);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  // Handle clicks outside the profile dropdown
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  // Add event listener for outside clicks
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load chat history from the server
  useEffect(() => {
    const fetchChats = async () => {
      setFetchingChats(true);
      try {
        const response = await api.get(`/api/chat/history/${user.id}`);
        if (response.data) {
          setChats(response.data);
          if (response.data.length > 0) {
            setCurrentChat(response.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setFetchingChats(false);
      }
    };

    if (user?.id) {
      fetchChats();
    }
  }, [user?.id]);

  // Format timestamp as h:mm AM/PM
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCreateChat = async () => {
    const newChat = {
      id: Date.now().toString(),
      title: t.chat_newChat || 'New Chat',
      created_at: new Date().toISOString(),
      messages: [],
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);

    try {
      const response = await api.post('/api/chat/new', { user_id: user.id });
      if (response.data) {
        setChats(prev =>
          prev.map(chat =>
            chat.id === newChat.id ? { ...response.data, messages: [] } : chat
          )
        );
        setCurrentChat(response.data);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/api/chat/${chatId}`);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const response = await api.put(`/api/chat/${chatId}/rename`, { title: newTitle });
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId ? response.data : chat
        )
      );
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const handleSelectChat = async (chatId) => {
    try {
      const response = await api.get(`/api/chat/${chatId}`);
      if (response.data) {
        setCurrentChat(response.data.chat);
        const updatedChat = {
          ...response.data.chat,
          messages: response.data.messages
        };
        setCurrentChat(updatedChat);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      const selectedChat = chats.find(chat => chat.id === chatId);
      setCurrentChat(selectedChat);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const timestamp = formatTime(new Date());
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
      timestamp: timestamp,
    };

    let updatedChat;
    if (currentChat) {
      updatedChat = {
        ...currentChat,
        messages: [...(currentChat.messages || []), userMessage],
      };
    } else {
      updatedChat = {
        id: Date.now().toString(),
        title: inputMessage.substring(0, 30),
        created_at: new Date().toISOString(),
        messages: [userMessage],
      };
    }

    setCurrentChat(updatedChat);
    setInputMessage('');
    setLoading(true);

    try {
      const endpoint = t.language === 'fr' ? '/predict' : '/predict-en';
      const response = await api.post(`http://localhost:5001/predict`, {
        text: inputMessage,
      });

      if (response.data) {
        const aiMessage = {
          id: Date.now().toString() + '-response',
          role: 'assistant',
          content: `${response.data.prediction1} (${t.confidence}: ${response.data.confidence}%)\n\n${response.data.prediction}`,
          created_at: new Date().toISOString(),
          timestamp: formatTime(new Date()),
        };

        const finalChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, aiMessage],
        };

        if (!currentChat) {
          setChats(prev => [finalChat, ...prev]);
        } else {
          setChats(prev =>
            prev.map(chat => (chat.id === updatedChat.id ? finalChat : chat))
          );
        }

        setCurrentChat(finalChat);

        await api.post('/api/chat/message', {
          content: inputMessage,
          chat_id: finalChat.id,
          response: aiMessage.content,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: t.chat_errorMessage || "I'm sorry, I'm having trouble connecting to the server. Please try again later.",
        created_at: new Date().toISOString(),
        timestamp: formatTime(new Date()),
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
      };

      setCurrentChat(finalChat);
      setChats(prev =>
        prev.map(chat => (chat.id === updatedChat.id ? finalChat : chat))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden md:flex">
        <div className="p-4 flex flex-col items-center">
          <div className="mb-4 flex items-center">
            <img src={logo} alt="MedAI Logo" className="h-10 w-10 mr-2" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">MedAI</span>
          </div>
          <button
            onClick={handleCreateChat}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            New Chat
          </button>
        </div>
        {fetchingChats ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No chat history yet.</p>
                <p>Start a new conversation!</p>
              </div>
            ) : (
              <ChatHistory
                chats={chats}
                currentChat={currentChat}
                onSelectChat={handleSelectChat}
                onCreateChat={handleCreateChat}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
              />
            )}
          </div>
        )}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.full_name}
                  className="h-8 w-8 rounded-full object-cover cursor-pointer"
                  onClick={toggleMenu}
                />
              ) : (
                <div
                  className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-800 dark:text-blue-200 font-medium cursor-pointer"
                  onClick={toggleMenu}
                >
                  {userInitials}
                </div>
              )}
              <span className="text-gray-900 dark:text-gray-200 truncate">{user?.full_name}</span>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <ChatHeader onFeedbackClick={() => setShowFeedback(true)} />
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
          {!currentChat || currentChat.messages?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Ask me anything about your health concerns, symptoms, or general medical questions.
              </p>
            </div>
          ) : (
            <>
              {currentChat.messages?.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isUser={msg.role === 'user'}
                />
              ))}
              {loading && (
                <motion.div
                  className="flex items-start gap-4 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="animate-pulse flex space-x-2 mb-2">
                      <div className="h-2 w-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messageEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type your message here..."
                className="w-full pr-14 pl-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:bg-white dark:focus:bg-gray-600"
                rows={1}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className={`absolute right-2 bottom-2.5 p-1.5 rounded-lg transition-colors ${
                  inputMessage.trim() && !loading
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              This is not a substitute for professional medical advice. Please consult a healthcare provider for serious concerns.
            </p>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
        <div className="relative">
          <LanguageToggle />
        </div>
        <div>
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={(data) => {
          console.log('Feedback submitted:', data);
          setShowFeedback(false);
        }}
      />
    </div>
  );
};

export default AuthenticatedChat;