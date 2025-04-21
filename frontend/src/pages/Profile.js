import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateProfile, changePassword, logout, getToken, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    is_professional: false,
    profession: '',
    bio: '',
    profile_image: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [chats, setChats] = useState([]);
  const [feedback, setFeedback] = useState([]);
  
  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        is_professional: user.is_professional || false,
        profession: user.profession || '',
        bio: user.bio || '',
        profile_image: user.profile_image || '',
      });
    }
  }, [user]);
  
  // Load user chats and feedback
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const token = getToken();
          const headers = { Authorization: `Bearer ${token}` };
          
          // Fetch user activity data (chats and feedback) from the new endpoint
          const activityResponse = await axios.get(`/api/profile/${user.id}/activity`, { headers });
          
          if (activityResponse.data) {
            setChats(activityResponse.data.chats || []);
            setFeedback(activityResponse.data.feedback || []);
          }
        } catch (err) {
          console.error('Failed to fetch user data', err);
          // Handle errors gracefully
          setChats([]);
          setFeedback([]);
        }
      };
      
      fetchUserData();
    }
  }, [user, getToken]);
  
  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData({
      ...profileData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission triggered! Form event:', e.type);
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Ensure user ID is the correct type (number)
      if (!user || !user.id) {
        throw new Error('User information is missing');
      }
      
      // Convert user ID to a number to ensure correct type comparison in backend
      const userId = Number(user.id);
      console.log('Using numeric user ID for request:', userId);
      
      console.log('Submitting profile data:', JSON.stringify({
        ...profileData,
        profile_image: profileData.profile_image ? 
          profileData.profile_image.substring(0, 30) + '...[truncated]' : null
      }));
      
      console.log('User ID from context:', userId);
      console.log('Token from localStorage:', localStorage.getItem('token') ? 'Token exists' : 'No token found');
      
      // Check if we're making the request to the correct endpoint
      console.log('API endpoint should be:', `/api/profile/${userId}`);
      
      try {
        // Use direct axios call with explicit numeric ID and proper Content-Type
        const token = getToken();
        const response = await axios.put(`/api/profile/${userId}`, profileData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Profile update response:', response.status);
        console.log('Profile update response data:', JSON.stringify({
          ...response.data,
          profile_image: response.data?.profile_image ? 
            response.data.profile_image.substring(0, 30) + '...[truncated]' : null
        }));
        
        setUser(response.data);
      setSuccess('Profile updated successfully');
      } catch (requestError) {
        console.error('Request error details:', {
          message: requestError.message,
          response: requestError.response ? {
            status: requestError.response.status,
            statusText: requestError.response.statusText,
            data: requestError.response.data
          } : 'No response object',
          request: requestError.request ? 'Request sent but no response' : 'Request setup failed',
          stack: requestError.stack
        });
        throw requestError;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      setLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to change password');
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      setError('');
      
      try {
        const token = getToken();
        await axios.delete(`/api/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        logout();
        navigate('/');
      } catch (err) {
        setError(err.message || 'Failed to delete account');
        setLoading(false);
      }
    }
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.match('image/*')) {
      setError('Only image files are allowed.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      // event.target.result contains the base64 encoded image
      const imageData = event.target.result;
      console.log('Image loaded successfully, size:', Math.round(imageData.length / 1024), 'KB');
      console.log('Image data starts with:', imageData.substring(0, 30) + '...');
      
      setProfileData({
        ...profileData,
        profile_image: imageData
      });
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setError('Failed to read the image file.');
    };
    
    // Read the file as a data URL (base64)
    reader.readAsDataURL(file);
  };
  
  const handleCameraCapture = () => {
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera access.');
      return;
    }
    
    // Create a hidden video and canvas element for capturing the photo
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        // Show a custom camera UI or use the browser's default one
        if (window.confirm('Allow camera access to take a profile picture?')) {
          // For simplicity, we're using a confirm dialog
          // In a real app, you'd create a nice camera UI with a capture button
          
          // Take the photo after a slight delay to give camera time to adjust
          setTimeout(() => {
            video.srcObject = stream;
            video.play();
            
            // Wait a bit for the video to start playing
            setTimeout(() => {
              // Set canvas dimensions to match video
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Draw the current video frame to the canvas
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Convert canvas to base64 image
              const imageData = canvas.toDataURL('image/jpeg');
              
              // Update state with captured image
              setProfileData({
                ...profileData,
                profile_image: imageData
              });
              
              // Stop all video streams
              stream.getTracks().forEach(track => track.stop());
            }, 500);
          }, 1000);
        } else {
          // User didn't confirm, stop the stream
          stream.getTracks().forEach(track => track.stop());
        }
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Make sure you have given permission.');
      });
  };
  
  // Add this function to test the API directly
  const testApiDirectly = async () => {
    try {
      console.log('Testing API directly...');
      const token = getToken();
      console.log('Token for test:', token ? 'exists' : 'missing');
      
      // Make a simple GET request to the profile endpoint
      const response = await axios.get(`/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Test API GET response:', response.status, response.data);
      setSuccess('API test successful! Check console for details.');
      
      // Now try a simple PUT with minimal data
      const testData = { full_name: user.full_name + ' (test)' };
      console.log('Testing PUT with data:', testData);
      
      const putResponse = await axios.put(`/api/profile/${user.id}`, testData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test API PUT response:', putResponse.status, putResponse.data);
      setSuccess('API PUT test successful! Check console for details.');
      
    } catch (err) {
      console.error('API test failed:', err);
      setError(`API test failed: ${err.message}`);
    }
  };
  
  const handleSimpleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Trying simple profile update with direct axios call...');
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      if (!user || !user.id) {
        throw new Error('User information is missing');
      }
      
      // Create a simplified payload with just text fields
      const simplePayload = {
        full_name: profileData.full_name,
        bio: profileData.bio,
        is_professional: profileData.is_professional,
        profession: profileData.profession,
        // Intentionally exclude profile_image to simplify
      };
      
      console.log('Simple update payload:', simplePayload);
      
      // Make a direct API call
      const response = await axios.put(
        `/api/profile/${user.id}`, 
        simplePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Simple update response:', response.status, response.data);
      
      if (response.status === 200) {
        setSuccess('Profile updated successfully (simple method)');
        // Update user state with the response data
        setUser(response.data);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (err) {
      console.error('Simple profile update failed:', err);
      setError(`Simple update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {t('profile.title')}
        </h1>
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              {profileData.profile_image ? (
                <img
                  src={profileData.profile_image}
                  alt={profileData.full_name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-2xl font-bold">
                  {profileData.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileData.is_professional ? `Dr. ${profileData.full_name}` : profileData.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {profileData.email}
              </p>
              {profileData.is_professional && profileData.profession && (
                <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">
                  {profileData.profession}
                </p>
              )}
              {profileData.bio && (
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {profileData.bio}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile.edit')}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile.changePassword')}
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {t('profile.activity')}
            </button>
          </nav>
        </div>
        
        {/* Success and Error Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-md p-4 text-green-600 dark:text-green-400">
            {success}
          </div>
        )}
        
        {/* Edit Profile Form */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.fullName')}
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                    disabled
                  />
                </div>
                
                <div>
                  <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.profileImage')}
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="relative group">
                      {profileData.profile_image ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                          <img
                            src={profileData.profile_image}
                            alt={profileData.full_name}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setProfileData({...profileData, profile_image: ''})}
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500">
                          <span>{t('action.uploadImage')}</span>
                  <input
                            type="file" 
                            id="profile_image_upload" 
                            accept="image/*"
                            className="sr-only"
                            onChange={handleImageUpload}
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={handleCameraCapture}
                          className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {t('action.takePhoto')}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('profile.uploadProfilePicture')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_professional"
                      name="is_professional"
                      type="checkbox"
                      checked={profileData.is_professional}
                      onChange={handleProfileChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded dark:border-gray-700"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_professional" className="font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.isProfessional')}
                    </label>
                  </div>
                </div>
                
                {profileData.is_professional && (
                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.profession')}
                    </label>
                    <input
                      type="text"
                      id="profession"
                      name="profession"
                      value={profileData.profession}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.bio')}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="4"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={(e) => {
                      console.log('Save button clicked!');
                      // The form's onSubmit should handle this, but let's add a fallback
                      if (!e.isDefaultPrevented()) {
                        console.log('Button click - default action proceeding');
                      }
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    {t('app.save')}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {t('profile.deleteAccount')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {/* Change Password Form */}
        {activeTab === 'password' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.currentPassword')}
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.newPassword')}
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters long and include uppercase, lowercase, number and special character.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('profile.confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : null}
                    {t('profile.changePassword')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="space-y-8">
              {/* Recent Chats */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('profile.recentChats')}
                </h3>
                
                {chats.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">{t('chat.noRecentChats')}</p>
                ) : (
                  <div className="space-y-4">
                    {chats.slice(0, 5).map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3"
                      >
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span className="text-gray-800 dark:text-gray-200">
                            {chat.title || 'Untitled Chat'}
                          </span>
                        </div>
                        <a
                          href={`/chat?id=${chat.id}`}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Feedback History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('feedback.history')}
                </h3>
                
                {feedback.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">{t('feedback.noFeedback')}</p>
                ) : (
                  <div className="space-y-4">
                    {feedback.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-gray-200 dark:border-gray-700 pb-3"
                      >
                        <div className="flex items-center mb-2">
                          <div className="flex mr-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-5 w-5 ${
                                  star <= item.rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {item.comment && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            "{item.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
