import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

const ChatMessage = ({ message, isUser }) => {
  const { t } = useLanguage();
  
  // Format the timestamp
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  // Function to format the message content with proper markdown
  const formatContent = (content) => {
    if (!content) return '';
    
    // Handle markdown for lists, headers, and code blocks in a simple way
    // (A proper markdown library would be better for a production app)
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>') // Code blocks
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1
      .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2
      .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3
      .replace(/\n/g, '<br>'); // Line breaks
      
    return formattedContent;
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] lg:max-w-[70%] rounded-lg px-3 py-2 ${
        isUser 
          ? 'bg-primary-600 text-white rounded-tr-none' 
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm rounded-tl-none'
      }`}>
        <div className="flex items-center mb-0.5">
          <span className="font-medium text-xs">
            {isUser ? t('chat.userPrefix') : t('chat.aiPrefix')}
          </span>
          {message.created_at && (
            <span className={`text-xs ml-2 ${isUser ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatDate(message.created_at)}
            </span>
          )}
        </div>
        
        <div 
          className="prose prose-sm dark:prose-invert max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
      </div>
    </div>
  );
};

export default ChatMessage;