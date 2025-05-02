import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, MessageSquare, Star, BarChart2, Search, UserPlus, UserMinus, 
  Trash2, AlertTriangle, FileText, Rss, Brain, Eye, EyeOff, Bookmark, 
  BookmarkX, Plus, Edit, RefreshCw, Check, X, User, Shield, History, BarChart3, 
  PenSquare, RotateCw, AlertCircle
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Loading from '../../components/Loading';
import Error from '../../components/Error';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { getToken, isAuthenticated, user } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart references
  const topicsChartRef = useRef(null);
  const sentimentChartRef = useRef(null);
  const timeSeriesChartRef = useRef(null);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [nlpData, setNlpData] = useState(null);
  
  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    summary: '',
    image_url: '',
    source_url: '',
    source_name: 'MedAI',
    category: 'general',
    is_hidden: false,
    is_featured: false
  });
  
  const [rssFeedForm, setRssFeedForm] = useState({
    name: '',
    url: '',
    description: '',
    language: 'en',
    category: 'general',
    is_active: true
  });
  
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [formType, setFormType] = useState('article'); // 'article' ou 'rss'
  
  // NLP analysis parameters
  const [nlpParams, setNlpParams] = useState({
    days: 30,
    language: 'all'
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [articleSearchInput, setArticleSearchInput] = useState('');
  const [rssFeedSearchTerm, setRssFeedSearchTerm] = useState('');
  const [rssFeedSearchInput, setRssFeedSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState({
    show: false,
    type: null,
    userId: null,
    userEmail: null,
    articleId: null,
    articleTitle: null,
    feedId: null,
    feedName: null
  });
  
  // Success notification state
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    message: ''
  });
  
  // Check if user is admin on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user && !user.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, user]);
  
  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Handle article search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setArticleSearchTerm(articleSearchInput);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [articleSearchInput]);
  
  // Handle RSS feed search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setRssFeedSearchTerm(rssFeedSearchInput);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [rssFeedSearchInput]);
  
  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        let endpoint = '';
        
        switch (activeTab) {
          case 'stats':
            endpoint = '/api/admin/stats';
            try {
              const statsResponse = await axios.get(endpoint, { headers });
              setStats(statsResponse.data);
            } catch (err) {
              console.error('Error fetching stats:', err);
              setError(`Unable to load statistics. ${err.response?.data?.error || err.message}`);
              setStats(null);
            }
            break;
          case 'feedbacks':
            endpoint = '/api/admin/feedbacks';
            try {
              const feedbacksResponse = await axios.get(endpoint, { headers });
              setFeedbacks(feedbacksResponse.data.items || []);
            } catch (err) {
              console.error('Error fetching feedbacks:', err);
              setError(`Unable to load feedbacks. ${err.response?.data?.error || err.message}`);
              setFeedbacks([]);
            }
            break;
          case 'users':
            endpoint = `/api/admin/users${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`;
            try {
              const usersResponse = await axios.get(endpoint, { headers });
              setUsers(usersResponse.data.items || []);
            } catch (err) {
              console.error('Error fetching users:', err);
              setError(`Unable to load users. ${err.response?.data?.error || err.message}`);
              setUsers([]);
            }
            break;
          case 'articles':
            endpoint = `/api/admin/articles${articleSearchTerm ? `?search=${encodeURIComponent(articleSearchTerm)}` : ''}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`;
            try {
              const articlesResponse = await axios.get(endpoint, { headers });
              setArticles(articlesResponse.data.items || []);
              
              // Fetch RSS feeds when on articles tab
              const rssFeedsResponse = await axios.get('/api/admin/rss-feeds', { headers });
              setRssFeeds(rssFeedsResponse.data.items || []);
            } catch (err) {
              console.error('Error fetching articles:', err);
              setError(`Unable to load articles. ${err.response?.data?.error || err.message}`);
              setArticles([]);
            }
            break;
          case 'nlp':
            endpoint = `/api/admin/nlp/topics?days=${nlpParams.days}&language=${nlpParams.language}`;
            try {
              const nlpResponse = await axios.get(endpoint, { headers });
              setNlpData(nlpResponse.data);
              // Create charts after data is loaded
              createCharts(nlpResponse.data);
            } catch (err) {
              console.error('Error fetching NLP data:', err);
              setError(`Unable to load NLP analysis. ${err.response?.data?.error || err.message}`);
              setNlpData(null);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error:', error);
        setError(`An error occurred: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, searchTerm, articleSearchTerm, selectedCategory, nlpParams, getToken]);

  // Format date for display with proper localization
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle user actions (block, delete, admin)
  const handleUserAction = async (action, userId) => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '';
      let method = 'PUT';
      
      switch (action) {
        case 'block':
          endpoint = `/api/admin/users/${userId}/block`;
          break;
        case 'delete':
          endpoint = `/api/admin/users/${userId}`;
          method = 'DELETE';
          break;
        case 'admin':
          endpoint = `/api/admin/users/${userId}/admin`;
          break;
        default:
          throw new Error('Unrecognized action');
      }
      
      let response;
      if (method === 'PUT') {
        response = await axios.put(endpoint, {}, { headers });
      } else if (method === 'DELETE') {
        response = await axios.delete(endpoint, { headers });
      }
      
      // Refresh users list
      const usersResponse = await axios.get(`/api/admin/users${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`, { headers });
      setUsers(usersResponse.data.items || []);
      
      // Clear confirmation dialog
      setConfirmAction({ show: false, type: null, userId: null, userEmail: null });
      
      // Show success notification instead of alert
      setSuccessNotification({
        show: true,
        message: response.data.message
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setSuccessNotification({
          show: false,
          message: ''
        });
      }, 3000);
      
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      setError(`Unable to perform this action. ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle article actions (create, update, delete, toggle visibility/featured)
  const handleArticleAction = async (action, articleId) => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (action === 'visibility') {
        // Find the article to toggle its visibility
        const article = articles.find(a => a.id === articleId);
        if (article) {
          const updatedArticle = { ...article, is_hidden: !article.is_hidden };
          
          // Update the article locally
          setArticles(prevArticles => 
            prevArticles.map(a => a.id === articleId ? updatedArticle : a)
          );
          
          // Show success notification
          setSuccessNotification({
            show: true,
            message: `Article is now ${updatedArticle.is_hidden ? 'hidden' : 'visible'}`
          });
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setSuccessNotification({
              show: false,
              message: ''
            });
          }, 3000);
        }
      } else if (action === 'featured') {
        // Find the article to toggle its featured status
        const article = articles.find(a => a.id === articleId);
        if (article) {
          const updatedArticle = { ...article, is_featured: !article.is_featured };
          
          // Update the article locally
          setArticles(prevArticles => 
            prevArticles.map(a => a.id === articleId ? updatedArticle : a)
          );
          
          // Show success notification
          setSuccessNotification({
            show: true,
            message: `Article is now ${updatedArticle.is_featured ? 'featured' : 'not featured'}`
          });
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setSuccessNotification({
              show: false,
              message: ''
            });
          }, 3000);
        } else if (action === 'delete') {
          // Remove the article locally
          setArticles(prevArticles => 
            prevArticles.filter(a => a.id !== articleId)
          );
          
          // Show success notification
          setSuccessNotification({
            show: true,
            message: 'Article deleted successfully'
          });
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setSuccessNotification({
              show: false,
              message: ''
            });
          }, 3000);
        }
      }
    } catch (err) {
      console.error(`Error performing article action ${action}:`, err);
      setError(`Unable to perform this action. ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation dialog
  const showConfirmation = (type, userId, userEmail) => {
    setConfirmAction({
      show: true,
      type,
      userId,
      userEmail
    });
  };
  
  // Handle RSS feed actions (create, update, delete)
  const handleRssFeedAction = async (action, feedId = null) => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      let endpoint = '';
      let method = 'PUT';
      let data = {};
      
      switch (action) {
        case 'create':
          endpoint = `/api/admin/rss-feeds`;
          method = 'POST';
          data = rssFeedForm;
          break;
        case 'update':
          endpoint = `/api/admin/rss-feeds/${feedId}`;
          method = 'PUT';
          data = rssFeedForm;
          break;
        case 'delete':
          endpoint = `/api/admin/rss-feeds/${feedId}`;
          method = 'DELETE';
          break;
        case 'toggle':
          endpoint = `/api/admin/rss-feeds/${feedId}/toggle`;
          break;
        default:
          throw new Error('Unrecognized action');
      }
      
      let response;
      if (method === 'PUT') {
        response = await axios.put(endpoint, data, { headers });
      } else if (method === 'POST') {
        response = await axios.post(endpoint, data, { headers });
      } else if (method === 'DELETE') {
        response = await axios.delete(endpoint, { headers });
      }
      
      // Refresh RSS feeds list
      const rssFeedsResponse = await axios.get(
        `/api/admin/rss-feeds${rssFeedSearchTerm ? `?search=${encodeURIComponent(rssFeedSearchTerm)}` : ''}`, 
        { headers }
      );
      setRssFeeds(rssFeedsResponse.data.items || []);
      
      // Show success notification
      setSuccessNotification({
        show: true,
        message: response.data.message
      });
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setSuccessNotification({
          show: false,
          message: ''
        });
      }, 3000);
      
    } catch (err) {
      console.error(`Error performing RSS feed action ${action}:`, err);
      setError(`Unable to perform this action. ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle confirmation action
  const handleConfirmAction = () => {
    const { type, userId, articleId, feedId } = confirmAction;
    
    if (type === 'delete') {
      handleUserAction(type, userId);
    } else if (type === 'block') {
      handleUserAction(type, userId);
    } else if (type === 'admin') {
      handleUserAction(type, userId);
    } else if (type === 'delete-article') {
      handleArticleAction('delete', articleId);
    } else if (type === 'delete-feed') {
      handleRssFeedAction('delete', feedId);
    }
  };

  // Render stat card with proper translations
  const StatCard = ({ title, value, icon: Icon, color }) => {
    // Translate stat titles
    const translations = {
      "Utilisateurs inscrits": {en: "Registered Users", fr: "Utilisateurs inscrits"},
      "Conversations totales": {en: "Total Conversations", fr: "Conversations totales"},
      "Note moyenne": {en: "Average Rating", fr: "Note moyenne"},
      "Feedbacks soumis": {en: "Submitted Feedbacks", fr: "Feedbacks soumis"},
      "Messages échangés": {en: "Exchanged Messages", fr: "Messages échangés"},
      "Taux d'engagement": {en: "Engagement Rate", fr: "Taux d'engagement"}
    };
    
    // Get translated title
    const translatedTitle = translations[title] ? translations[title][language] : title;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{translatedTitle}</h3>
          <div className={`p-2 rounded-md ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    );
  };

  // Render stats tab content
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Utilisateurs inscrits" 
          value={stats.user_count || 0} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Conversations totales" 
          value={stats.chat_count || 0} 
          icon={MessageSquare} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Note moyenne" 
          value={stats.average_rating ? stats.average_rating.toFixed(1) + '/5' : 'N/A'} 
          icon={Star} 
          color="bg-yellow-500" 
        />
        <StatCard 
          title="Feedbacks soumis" 
          value={stats.feedback_count || 0} 
          icon={Star} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Messages échangés" 
          value={stats.message_count || 0} 
          icon={MessageSquare} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Taux d'engagement" 
          value={stats.engagement_rate ? (stats.engagement_rate * 100).toFixed(0) + '%' : 'N/A'} 
          icon={Users} 
          color="bg-orange-500" 
        />
      </div>
    );
  };

  // Render feedback tab content
  const renderFeedbacks = () => {
    const language = localStorage.getItem('language') || 'en';
    
    // Translations for table headers
    const translations = {
      "Note": {en: "Rating", fr: "Note"},
      "Commentaire": {en: "Comment", fr: "Commentaire"},
      "Utilisateur": {en: "User", fr: "Utilisateur"},
      "Date": {en: "Date", fr: "Date"},
      "Langue": {en: "Language", fr: "Langue"},
      "Aucun feedback trouvé": {en: "No feedback found", fr: "Aucun feedback trouvé"},
      "Pas de commentaire": {en: "No comment", fr: "Pas de commentaire"},
      "Anonyme": {en: "Anonymous", fr: "Anonyme"}
    };
    
    const translate = (key) => translations[key] ? translations[key][language] : key;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Note")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Commentaire")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Utilisateur")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Date")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Langue")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("Actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {translate("Aucun feedback trouvé")}
                </td>
              </tr>
            ) : (
              feedbacks.map((feedback) => (
                <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {feedback.comment || <span className="text-gray-500 italic">{translate("Pas de commentaire")}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {feedback.user_email || <span className="text-gray-500 italic">{translate("Anonyme")}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(feedback.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {feedback.language || 'fr'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleHideFeedback(feedback.id)}
                        className="p-1 rounded-full text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                        title="Hide review"
                      >
                        {/* Eye/EyeOff icon for hide */}
                        {feedback.hidden ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0021 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.636-1.364M3 3l18 18" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0021 9c0 5.523-4.477 10-10 10S1 14.523 1 9a9.956 9.956 0 012.636-2.364" /></svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(feedback.id)}
                        className="p-1 rounded-full text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                        title="Delete review"
                      >
                        {/* Trash icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Render users tab content
  const renderUsers = () => {
    // Translations for user table
    const translations = {
      "EMAIL": {en: "EMAIL", fr: "EMAIL"},
      "NOM": {en: "NAME", fr: "NOM"},
      "DATE D'INSCRIPTION": {en: "REGISTRATION DATE", fr: "DATE D'INSCRIPTION"},
      "STATUT": {en: "STATUS", fr: "STATUT"},
      "RÔLE": {en: "ROLE", fr: "RÔLE"},
      "ACTIONS": {en: "ACTIONS", fr: "ACTIONS"},
      "Aucun utilisateur trouvé": {en: "No users found", fr: "Aucun utilisateur trouvé"},
      "Rechercher des utilisateurs...": {en: "Search users...", fr: "Rechercher des utilisateurs..."},
      "Actif": {en: "Active", fr: "Actif"},
      "Bloqué": {en: "Blocked", fr: "Bloqué"},
      "Admin": {en: "Admin", fr: "Admin"},
      "Utilisateur": {en: "User", fr: "Utilisateur"}
    };
    
    const translate = (key) => translations[key] ? translations[key][language] : key;
    
    return (
      <div>
        <div className="mb-6 flex items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={translate("Rechercher des utilisateurs...")}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("EMAIL")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("NOM")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("DATE D'INSCRIPTION")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("STATUT")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("RÔLE")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{translate("ACTIONS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {translate("Aucun utilisateur trouvé")}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{user.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">{formatDate(user.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_verified 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.is_verified ? translate("Actif") : translate("Bloqué")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_admin 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {user.is_admin ? translate("Admin") : translate("Utilisateur")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => showConfirmation('admin', user.id, user.email)}
                          className={`p-1 rounded-full ${!user.is_admin ? 'text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-100' : 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-100'}`}
                          title={!user.is_admin ? "Make admin" : "Remove admin"}
                        >
                          {!user.is_admin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                        </button>
                        
                        <button
                          onClick={() => showConfirmation('block', user.id, user.email)}
                          className={`p-1 rounded-full ${!user.is_verified ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-100' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100'}`}
                          title={!user.is_verified ? "Unblock user" : "Block user"}
                        >
                          {!user.is_verified ? <UserPlus className="h-5 w-5" /> : <UserMinus className="h-5 w-5" />}
                        </button>
                        
                        <button
                          onClick={() => showConfirmation('delete', user.id, user.email)}
                          className="p-1 rounded-full text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
                          title="Delete user"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render confirmation modal with proper translations
  const renderConfirmationModal = () => {
    if (!confirmAction.show) return null;
    
    // Determine action text based on type and current user/item state
    let actionText = '';
    let targetName = '';
    
    if (confirmAction.type === 'delete') {
      actionText = translate("delete", "action");
      targetName = confirmAction.userEmail;
    } else if (confirmAction.type === 'block') {
      const targetUser = users.find(u => u.id === confirmAction.userId);
      actionText = targetUser && !targetUser.is_verified ? translate("unblock", "action") : translate("block", "action");
      targetName = confirmAction.userEmail;
    } else if (confirmAction.type === 'admin') {
      const targetUser = users.find(u => u.id === confirmAction.userId);
      actionText = targetUser && targetUser.is_admin ? translate("remove_admin", "action") : translate("grant_admin", "action");
      targetName = confirmAction.userEmail;
    } else if (confirmAction.type === 'delete-article') {
      actionText = translate("delete_article", "action");
      targetName = confirmAction.articleTitle;
    } else if (confirmAction.type === 'delete-feed') {
      actionText = translate("delete_feed", "action");
      targetName = confirmAction.feedName;
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">{translate("confirmation", "action")}</h3>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {translate("confirm_action", "action")} {actionText} {targetName}?
          </p>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {translate("cannot_undo", "action")}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmAction({
                show: false,
                type: null,
                userId: null,
                userEmail: null,
                articleId: null,
                articleTitle: null,
                feedId: null,
                feedName: null
              })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              {translate("cancel", "action")}
            </button>
            
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              {translate("confirm", "action")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render success notification
  const renderSuccessNotification = () => {
    if (!successNotification.show) return null;
    
    return (
      <div className="fixed top-4 right-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-100 px-4 py-3 rounded z-50 flex items-center shadow-md">
        <Check className="h-5 w-5 mr-2" />
        <span>{successNotification.message}</span>
        <button 
          onClick={() => setSuccessNotification({ show: false, message: '' })}
          className="ml-4 text-green-700 dark:text-green-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Render Article Form with RSS integration
  const renderArticleForm = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {formType === 'article' 
                ? (isEditingArticle ? translate("edit_article", "action") : translate("add_article", "action"))
                : (isEditingArticle ? translate("edit_rss_feed", "action") : translate("add_rss_feed", "action"))}
            </h3>
            <button 
              onClick={() => setShowArticleForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex space-x-2">
              <button 
                onClick={() => setFormType('article')}
                className={`px-4 py-2 rounded-md ${formType === 'article' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {translate("add_article", "action")}
              </button>
              <button 
                onClick={() => setFormType('rss')}
                className={`px-4 py-2 rounded-md ${formType === 'rss' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {translate("add_rss_feed", "action")}
              </button>
            </div>
          </div>
          
          {formType === 'article' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (isEditingArticle) {
                handleArticleAction('update', currentItemId);
              } else {
                handleArticleAction('create');
              }
              setShowArticleForm(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("title", "action")}
                  </label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                    required
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("summary", "action")}
                  </label>
                  <textarea
                    value={articleForm.summary}
                    onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("category", "action")}
                  </label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({...articleForm, category: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">{translate("general", "category")}</option>
                    <option value="prevention">{translate("prevention", "category")}</option>
                    <option value="fitness">{translate("fitness", "category")}</option>
                    <option value="nutrition">{translate("nutrition", "category")}</option>
                    <option value="mental_health">{translate("mental_health", "category")}</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowArticleForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {translate("cancel", "action")}
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {translate("save", "action")}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (isEditingArticle) {
                handleRssFeedAction('update', currentItemId);
              } else {
                handleRssFeedAction('create');
              }
              setShowArticleForm(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("feed_name", "action")}
                  </label>
                  <input
                    type="text"
                    value={rssFeedForm.name}
                    onChange={(e) => setRssFeedForm({...rssFeedForm, name: e.target.value})}
                    required
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("feed_url", "action")}
                  </label>
                  <input
                    type="url"
                    value={rssFeedForm.url}
                    onChange={(e) => setRssFeedForm({...rssFeedForm, url: e.target.value})}
                    required
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("description", "action")}
                  </label>
                  <textarea
                    value={rssFeedForm.description}
                    onChange={(e) => setRssFeedForm({...rssFeedForm, description: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("language", "action")}
                  </label>
                  <select
                    value={rssFeedForm.language}
                    onChange={(e) => setRssFeedForm({...rssFeedForm, language: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">{translate("english", "action")}</option>
                    <option value="fr">{translate("french", "action")}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {translate("category", "action")}
                  </label>
                  <select
                    value={rssFeedForm.category}
                    onChange={(e) => setRssFeedForm({...rssFeedForm, category: e.target.value})}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">{translate("general", "category")}</option>
                    <option value="prevention">{translate("prevention", "category")}</option>
                    <option value="fitness">{translate("fitness", "category")}</option>
                    <option value="nutrition">{translate("nutrition", "category")}</option>
                    <option value="mental_health">{translate("mental_health", "category")}</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowArticleForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {translate("cancel", "action")}
                </button>
                
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {translate("save", "action")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Render RSS tab content
  const renderRssTab = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{translate("rss_management", "tab")}</h2>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {translate("rss_description", "action")}
          </div>
          <button
            onClick={() => {
              setRssFeedForm({
                name: '',
                url: '',
                description: '',
                language: language === 'en' ? 'en' : 'fr',
                category: 'general',
                is_active: true
              });
              setIsEditingArticle(false);
              setCurrentItemId(null);
              setShowArticleForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {translate("add_rss_feed", "action")}
          </button>
        </div>
        
        {/* Search for RSS feeds */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={rssFeedSearchInput}
              onChange={(e) => setRssFeedSearchInput(e.target.value)}
              placeholder={translate("search_rss_feeds", "action")}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* RSS feeds list */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loading size="large" message={translate("loading_rss_feeds", "action")} />
            </div>
          ) : error ? (
            <Error message={error} />
          ) : rssFeeds.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {translate("no_rss_feeds", "action")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("feed_name", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("category", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("language", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("status", "action")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("actions", "action")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rssFeeds.map(feed => (
                    <tr key={feed.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {feed.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                          {feed.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {feed.category || 'general'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {feed.language === 'fr' ? 'Français' : 'English'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          feed.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {feed.is_active ? translate("active", "status") : translate("inactive", "status")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setRssFeedForm({
                                name: feed.name,
                                url: feed.url,
                                description: feed.description || '',
                                language: feed.language || 'en',
                                category: feed.category || 'general',
                                is_active: feed.is_active
                              });
                              setIsEditingArticle(true);
                              setCurrentItemId(feed.id);
                              setFormType('rss');
                              setShowArticleForm(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title={translate("edit_feed")}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleRssFeedAction('toggle', feed.id)}
                            className={`${feed.is_active ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                            title={translate(feed.is_active ? "deactivate" : "activate", "action")}
                          >
                            {feed.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmAction({
                                show: true,
                                type: 'delete-feed',
                                feedId: feed.id,
                                feedName: feed.name
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title={translate("delete_feed")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Tab translations
  const tabTranslations = {
    "stats": {en: "Statistics", fr: "Statistiques"},
    "feedbacks": {en: "Feedbacks", fr: "Feedbacks"},
    "users": {en: "Users", fr: "Utilisateurs"},
    "articles": {en: "Articles", fr: "Articles"},
    "nlp": {en: "NLP Analysis", fr: "Analyse NLP"},
    "rss": {en: "RSS Feeds", fr: "Flux RSS"}
  };

  // Category translations
  const categoryTranslations = {
    "all": {en: "All Categories", fr: "Toutes les catégories"},
    "general": {en: "General", fr: "Général"},
    "prevention": {en: "Prevention", fr: "Prévention"},
    "preventive_care": {en: "Preventive Care", fr: "Soins préventifs"},
    "fitness": {en: "Fitness", fr: "Fitness"},
    "nutrition": {en: "Nutrition", fr: "Nutrition"},
    "mental_health": {en: "Mental Health", fr: "Santé mentale"}
  };

  // Status translations
  const statusTranslations = {
    "visible": {en: "Visible", fr: "Visible"},
    "hidden": {en: "Hidden", fr: "Masqué"},
    "featured": {en: "Featured", fr: "Mis en avant"},
    "active": {en: "Active", fr: "Actif"},
    "inactive": {en: "Inactive", fr: "Inactif"},
    "blocked": {en: "Blocked", fr: "Bloqué"},
    "admin": {en: "Admin", fr: "Admin"},
    "user": {en: "User", fr: "Utilisateur"}
  };

  // Action translations
  const actionTranslations = {
    "new_article": {en: "New Article", fr: "Nouvel Article"},
    "add_article": {en: "Add Article", fr: "Ajouter un article"},
    "edit_article": {en: "Edit Article", fr: "Modifier l'article"},
    "summary": {en: "Summary", fr: "Résumé"},
    "view_original": {en: "View original", fr: "Voir l'original"},
    "show_article": {en: "Show article", fr: "Afficher l'article"},
    "hide_article": {en: "Hide article", fr: "Masquer l'article"},
    "feature_article": {en: "Mark as featured", fr: "Marquer comme mis en avant"},
    "unfeature_article": {en: "Remove from featured", fr: "Retirer des mis en avant"},
    "delete_article": {en: "Delete article", fr: "Supprimer l'article"},
    "refresh_data": {en: "Refresh Data", fr: "Actualiser les données"},
    "loading_articles": {en: "Loading articles...", fr: "Chargement des articles..."},
    "loading_nlp": {en: "Loading NLP data...", fr: "Chargement des données NLP..."},
    "no_articles": {en: "No articles found", fr: "Aucun article trouvé"},
    "no_nlp_data": {en: "No NLP data available. Try refreshing the data.", fr: "Aucune donnée NLP disponible. Essayez d'actualiser les données."},
    "time_period": {en: "Time Period (Days)", fr: "Période (Jours)"},
    "language_select": {en: "Language", fr: "Langue"},
    "popular_topics": {en: "Popular Topics", fr: "Sujets populaires"},
    "top_keywords": {en: "Top Keywords", fr: "Mots-clés principaux"},
    "no_topic_data": {en: "No topic data available", fr: "Aucune donnée de sujet disponible"},
    "no_keyword_data": {en: "No keyword data available", fr: "Aucune donnée de mot-clé disponible"},
    "article_management": {en: "Article Management", fr: "Gestion des Articles"},
    "articles_external_api": {en: "Articles are fetched from external health APIs and can be managed locally.", fr: "Les articles sont récupérés à partir d'APIs de santé externes et peuvent être gérés localement."},
    "search_articles": {en: "Search articles...", fr: "Rechercher des articles..."},
    "title": {en: "Title", fr: "Titre"},
    "category": {en: "Category", fr: "Catégorie"},
    "source": {en: "Source", fr: "Source"},
    "status": {en: "Status", fr: "Statut"},
    "actions": {en: "Actions", fr: "Actions"},
    "all": {en: "All Categories", fr: "Toutes les catégories"},
    "delete_confirmation": {en: "Are you sure you want to delete this article?", fr: "Êtes-vous sûr de vouloir supprimer cet article ?"},
    "cancel": {en: "Cancel", fr: "Annuler"},
    "confirm": {en: "Confirm", fr: "Confirmer"},
    "confirmation": {en: "Confirmation", fr: "Confirmation"},
    "confirm_action": {en: "Are you sure you want to", fr: "Êtes-vous sûr de vouloir"},
    "cannot_undo": {en: "This action cannot be undone.", fr: "Cette action ne peut pas être annulée."},
    "delete": {en: "delete", fr: "supprimer"},
    "block": {en: "block", fr: "bloquer"},
    "unblock": {en: "unblock", fr: "débloquer"},
    "grant_admin": {en: "grant admin rights to", fr: "donner des droits admin à"},
    "remove_admin": {en: "remove admin rights from", fr: "retirer les droits admin de"},
    "delete_feed": {en: "delete the RSS feed", fr: "supprimer le flux RSS"},
    "add_rss_feed": {en: "Add RSS Feed", fr: "Ajouter un flux RSS"},
    "feed_name": {en: "Feed Name", fr: "Nom du flux"},
    "feed_url": {en: "Feed URL", fr: "URL du flux"},
    "description": {en: "Description", fr: "Description"},
    "language": {en: "Language", fr: "Langue"},
    "english": {en: "English", fr: "Anglais"},
    "french": {en: "French", fr: "Français"},
    "save": {en: "Save", fr: "Enregistrer"},
    "close": {en: "Close", fr: "Fermer"},
    "add_rss_description": {en: "Add an RSS feed to fetch articles from. The articles will be included in the Home and Articles pages.", fr: "Ajoutez un flux RSS pour récupérer des articles. Les articles seront inclus dans les pages Accueil et Articles."},
    "edit_rss_feed": {en: "Edit RSS Feed", fr: "Modifier le flux RSS"},
    "edit_rss_feed_description": {en: "Edit the details of the RSS feed.", fr: "Modifier les détails du flux RSS."},
    "rss_management": {en: "RSS Feed Management", fr: "Gestion des flux RSS"},
    "rss_description": {en: "Add and manage RSS feeds to fetch health articles automatically.", fr: "Ajoutez et gérez des flux RSS pour récupérer automatiquement des articles de santé."},
    "search_rss_feeds": {en: "Search RSS feeds...", fr: "Rechercher des flux RSS..."},
    "loading_rss_feeds": {en: "Loading RSS feeds...", fr: "Chargement des flux RSS..."},
    "no_rss_feeds": {en: "No RSS feeds found", fr: "Aucun flux RSS trouvé"},
    "activate": {en: "Activate", fr: "Activer"},
    "deactivate": {en: "Deactivate", fr: "Désactiver"}
  };

  // Translation helper function
  const translate = (key, category = "action") => {
    let dictionary;
    
    switch(category) {
      case "tab":
        dictionary = tabTranslations;
        break;
      case "category":
        dictionary = categoryTranslations;
        break;
      case "status":
        dictionary = statusTranslations;
        break;
      case "action":
      default:
        dictionary = actionTranslations;
        break;
    }
    
    return (dictionary[key] && dictionary[key][language]) || key;
  };
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="loader animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded-md mb-6">
          {error}
        </div>
      );
    }
    
    switch (activeTab) {
      case 'stats':
        return renderStats();
      case 'feedbacks':
        return renderFeedbacks();
      case 'users':
        return renderUsers();
      case 'articles':
        return renderArticles();
      case 'nlp':
        return renderNlpAnalysis();
      default:
        return null;
    }
  };
  
  // Title translations
  const dashboardTitle = language === 'en' ? 'Admin Dashboard' : 'Tableau de bord administrateur';
  
  // Create charts for NLP analysis
  const createCharts = (data) => {
    if (!data) return;
    
    try {
      // Destroy existing charts to prevent duplicates
      if (topicsChartRef.current && typeof topicsChartRef.current.destroy === 'function') {
        topicsChartRef.current.destroy();
      }
      if (sentimentChartRef.current && typeof sentimentChartRef.current.destroy === 'function') {
        sentimentChartRef.current.destroy();
      }
      if (timeSeriesChartRef.current && typeof timeSeriesChartRef.current.destroy === 'function') {
        timeSeriesChartRef.current.destroy();
      }
      
      // Get canvas contexts
      const topicsCanvas = document.getElementById('topicsChart');
      const sentimentCanvas = document.getElementById('sentimentChart');
      const timeSeriesCanvas = document.getElementById('timeSeriesChart');
      
      if (!topicsCanvas || !sentimentCanvas || !timeSeriesCanvas) {
        console.error('Canvas elements not found');
        return;
      }
      
      // Set up topics chart if topics data exists
      if (data.topics && Array.isArray(data.topics)) {
        const topicLabels = data.topics.map(topic => topic.topic);
        const topicData = data.topics.map(topic => topic.count);
        
        // Generate colors for topics
        const topicColors = data.topics.map((_, index) => {
          const hue = (index * 137) % 360; // Golden ratio to create visually distinct colors
          return `hsla(${hue}, 70%, 60%, 0.8)`;
        });
        
        try {
          topicsChartRef.current = new ChartJS(topicsCanvas, {
            type: 'bar',
            data: {
              labels: topicLabels,
              datasets: [{
                label: 'Mentions',
                data: topicData,
                backgroundColor: topicColors,
                borderColor: topicColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `${context.parsed.x} mentions`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of mentions'
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('Error creating topics chart:', error);
        }
      }
    } catch (error) {
      console.error('Error in createCharts:', error);
    }
  };
  
  // Render NLP Analysis tab content
  const renderNlpAnalysis = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{translate("nlp")}</h2>
        
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {translate("time_period")}
              </label>
              <select 
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={nlpParams.days}
                onChange={(e) => setNlpParams({...nlpParams, days: parseInt(e.target.value)})}
              >
                <option value={7}>{language === 'en' ? '7 days' : '7 jours'}</option>
                <option value={30}>{language === 'en' ? '30 days' : '30 jours'}</option>
                <option value={90}>{language === 'en' ? '90 days' : '90 jours'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {translate("language_select")}
              </label>
              <select 
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={nlpParams.language}
                onChange={(e) => setNlpParams({...nlpParams, language: e.target.value})}
              >
                <option value="all">{language === 'en' ? 'All' : 'Toutes'}</option>
                <option value="en">{language === 'en' ? 'English' : 'Anglais'}</option>
                <option value="fr">{language === 'en' ? 'French' : 'Français'}</option>
              </select>
            </div>
            <div className="self-end">
              <button
                onClick={() => {
                  const fetchNlpData = async () => {
                    try {
                      setLoading(true);
                      setError(null);
                      const token = getToken();
                      const headers = { Authorization: `Bearer ${token}` };
                      const endpoint = `/api/admin/nlp/topics?days=${nlpParams.days}&language=${nlpParams.language}`;
                      const nlpResponse = await axios.get(endpoint, { headers });
                      setNlpData(nlpResponse.data);
                      
                      // Apply a slight delay to ensure DOM elements are ready
                      setTimeout(() => createCharts(nlpResponse.data), 100);
                    } catch (err) {
                      console.error('Error fetching NLP data:', err);
                      setError(`Unable to load NLP analysis. ${err.response?.data?.error || err.message}`);
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchNlpData();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {translate("refresh_data")}
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loading size="large" message={translate("loading_nlp")} />
          </div>
        ) : error ? (
          <Error message={error} />
        ) : !nlpData ? (
          <div className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-md mb-4">
            <p className="text-yellow-700 dark:text-yellow-200">
              {translate("no_nlp_data")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-medium mb-4">{translate("popular_topics")}</h3>
              <div className="h-64 flex items-center justify-center">
                {nlpData.topics && nlpData.topics.length > 0 ? (
                  <canvas id="topicsChart"></canvas>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{translate("no_topic_data")}</p>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <h3 className="text-lg font-medium mb-4">{translate("top_keywords")}</h3>
              <div className="overflow-hidden">
                {nlpData.keywords && nlpData.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {nlpData.keywords.map((keyword, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">{translate("no_keyword_data")}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Fetch articles from APIs when the Articles tab is active
  useEffect(() => {
    const fetchArticlesFromAPIs = async () => {
      if (activeTab !== 'articles') return;
      
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch both English and French articles
        const englishResponse = await axios.get('/api/articles/english', { headers });
        const frenchResponse = await axios.get('/api/articles/french', { headers });
        
        // Combine the articles
        const allArticles = [...englishResponse.data, ...frenchResponse.data];
        
        // Apply filters if needed
        let filteredArticles = allArticles;
        if (articleSearchTerm) {
          const searchLower = articleSearchTerm.toLowerCase();
          filteredArticles = filteredArticles.filter(article => 
            article.title.toLowerCase().includes(searchLower) || 
            (article.summary && article.summary.toLowerCase().includes(searchLower))
          );
        }
        
        if (selectedCategory && selectedCategory !== 'all') {
          filteredArticles = filteredArticles.filter(article => 
            article.category === selectedCategory
          );
        }
        
        setArticles(filteredArticles);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError(`Unable to load articles. ${err.response?.data?.error || err.message}`);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticlesFromAPIs();
  }, [activeTab, articleSearchTerm, selectedCategory, getToken]);

  // Render Articles tab content with integrated RSS management
  const renderArticles = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">{translate("article_management")}</h2>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {translate("articles_external_api")}
          </div>
          <button
            onClick={() => {
              if (formType === 'article') {
                setArticleForm({
                  title: '',
                  content: '',
                  summary: '',
                  image_url: '',
                  source_url: '',
                  source_name: 'MedAI',
                  category: 'general',
                  is_hidden: false,
                  is_featured: false
                });
              } else {
                setRssFeedForm({
                  name: '',
                  url: '',
                  description: '',
                  language: language === 'en' ? 'en' : 'fr',
                  category: 'general',
                  is_active: true
                });
              }
              setIsEditingArticle(false);
              setCurrentItemId(null);
              setShowArticleForm(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {translate("new_article")}
          </button>
        </div>
        
        {/* RSS Feeds Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
          <h3 className="text-md font-semibold mb-2">{translate("rss_management", "tab")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {translate("rss_description", "action")}
          </p>
          
          {rssFeeds.length === 0 ? (
            <div className="text-center py-3 text-gray-500 dark:text-gray-400">
              {translate("no_rss_feeds", "action")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("feed_name", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("category", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("language", "action")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("status", "action")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("actions", "action")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rssFeeds.map(feed => (
                    <tr key={feed.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {feed.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                          {feed.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {feed.category || 'general'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {feed.language === 'fr' ? 'Français' : 'English'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          feed.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {translate(feed.is_active ? "active" : "inactive", "status")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setRssFeedForm({
                                name: feed.name,
                                url: feed.url,
                                description: feed.description || '',
                                language: feed.language || 'en',
                                category: feed.category || 'general',
                                is_active: feed.is_active
                              });
                              setIsEditingArticle(true);
                              setCurrentItemId(feed.id);
                              setFormType('rss');
                              setShowArticleForm(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title={translate("edit_feed")}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleRssFeedAction('toggle', feed.id)}
                            className={`${feed.is_active ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                            title={translate(feed.is_active ? "deactivate" : "activate", "action")}
                          >
                            {feed.is_active ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmAction({
                                show: true,
                                type: 'delete-feed',
                                feedId: feed.id,
                                feedName: feed.name
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title={translate("delete_feed")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Search and filter controls */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={articleSearchInput}
                  onChange={(e) => setArticleSearchInput(e.target.value)}
                  placeholder={translate("search_articles")}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{translate("all", "category")}</option>
                <option value="general">{translate("general", "category")}</option>
                <option value="prevention">{translate("prevention", "category")}</option>
                <option value="fitness">{translate("fitness", "category")}</option>
                <option value="nutrition">{translate("nutrition", "category")}</option>
                <option value="mental_health">{translate("mental_health", "category")}</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Articles list */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loading size="large" message={translate("loading_articles")} />
            </div>
          ) : error ? (
            <Error message={error} />
          ) : articles.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              {translate("no_articles")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("title")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("category")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("source")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("status")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {translate("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {articles.map(article => (
                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {article.title}
                        </div>
                        {article.summary && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs mt-1">
                            {article.summary.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {article.category || 'general'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {article.source_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.is_hidden
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {translate(article.is_hidden ? "hidden" : "visible")}
                        </span>
                        {article.is_featured && (
                          <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {translate("featured")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <a 
                            href={article.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            title={translate("view_original")}
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                          <button 
                            onClick={() => handleArticleAction('visibility', article.id)}
                            className={`${article.is_hidden ? 'text-green-500 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                            title={translate(article.is_hidden ? "show_article" : "hide_article")}
                          >
                            {article.is_hidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => handleArticleAction('featured', article.id)}
                            className={`${article.is_featured ? 'text-gray-500 hover:text-gray-700' : 'text-purple-500 hover:text-purple-700'}`}
                            title={translate(article.is_featured ? "unfeature_article" : "feature_article")}
                          >
                            {article.is_featured ? <BookmarkX className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={() => {
                              setConfirmAction({
                                show: true,
                                type: 'delete-article',
                                articleId: article.id,
                                articleTitle: article.title
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                            title={translate("delete_article")}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Add these functions inside AdminDashboard component
  const handleDeleteFeedback = async (feedbackId) => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/feedback/${feedbackId}`, { headers });
      setFeedbacks(prev => prev.filter(fb => fb.id !== feedbackId));
      setSuccessNotification({ show: true, message: 'Review deleted successfully!' });
      setTimeout(() => setSuccessNotification({ show: false, message: '' }), 3000);
    } catch (err) {
      setError('Failed to delete review.');
    } finally {
      setLoading(false);
    }
  };

  const handleHideFeedback = (feedbackId) => {
    setFeedbacks(prev => prev.map(fb =>
      fb.id === feedbackId ? { ...fb, hidden: !fb.hidden } : fb
    ));
    setSuccessNotification({ show: true, message: 'Review visibility toggled!' });
    setTimeout(() => setSuccessNotification({ show: false, message: '' }), 2000);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-md bg-blue-500 mr-3">
            <BarChart2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardTitle}</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="uppercase">{translate("stats", "tab")}</span>
              </button>
              <button
                onClick={() => setActiveTab('feedbacks')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'feedbacks'
                    ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="uppercase">{translate("feedbacks", "tab")}</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="uppercase">{translate("users", "tab")}</span>
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'articles'
                    ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="uppercase">{translate("articles", "tab")}</span>
              </button>
              <button
                onClick={() => setActiveTab('nlp')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'nlp'
                    ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="uppercase">{translate("nlp", "tab")}</span>
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {renderConfirmationModal()}
      {renderSuccessNotification()}
      {showArticleForm && renderArticleForm()}
    </div>
  );
};

export default AdminDashboard; 