import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';
import { MoreVertical, Edit, Trash, Share, Archive } from 'lucide-react';

const ChatHistory = ({ 
  chats,
  currentChat,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onRenameChat
}) => {
  const { t } = useLanguage();
  const [editingChatId, setEditingChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const menuRef = useRef(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenForId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleRenameClick = (chat) => {
    setEditingChatId(chat.id);
    setNewTitle(chat.title || '');
    setMenuOpenForId(null);
  };
  
  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRenameChat(editingChatId, newTitle);
    }
    setEditingChatId(null);
  };
  
  const handleDeleteClick = (chat) => {
    setMenuOpenForId(null);
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      onDeleteChat(chat.id);
    }
  };
  
  const toggleMenu = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenForId(menuOpenForId === chatId ? null : chatId);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('chat.history')}
        </h2>
        <button
          onClick={onCreateChat}
          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          title="New Chat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-1 overflow-y-auto flex-1">
        {chats.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No chats yet</p>
            <button
              onClick={onCreateChat}
              className="mt-2 text-primary-600 hover:underline dark:text-primary-400"
            >
              {t('chat.startNew')}
            </button>
          </div>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.id}
              className={`group rounded-md overflow-hidden ${
                currentChat?.id === chat.id
                  ? 'bg-primary-100 dark:bg-primary-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {editingChatId === chat.id ? (
                <form onSubmit={handleRenameSubmit} className="p-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    autoFocus
                  />
                  <div className="flex justify-end mt-1 space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingChatId(null)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-primary-600 dark:text-primary-400"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div 
                  className="p-2 cursor-pointer flex justify-between items-start"
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {chat.title || 'New Chat'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(chat.created_at)}
                    </p>
                  </div>
                  
                  <div className="relative" ref={menuOpenForId === chat.id ? menuRef : null}>
                    <button
                      onClick={(e) => toggleMenu(e, chat.id)}
                      className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {menuOpenForId === chat.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-10 border border-gray-200 dark:border-gray-700">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameClick(chat);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-3" />
                            Rename
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(chat);
                            }}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash className="h-4 w-4 mr-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;