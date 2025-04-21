import React, { createContext, useState, useContext, useCallback } from 'react';
import api from '../utils/api';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/register', userData);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    console.log("Login attempt for:", email);
    try {
      // Use api utility with relative URL
      const response = await api.post('/api/auth/login', { email, password });
      
      console.log("Login response:", response.status, response.data);
      const { token, user: userData } = response.data;
      console.log("Extracted token:", token ? token.substring(0, 15) + "..." : "missing");
      console.log("Extracted user data:", userData);
      setToken(token);
      // Check if token was set correctly
      setTimeout(() => {
        const storedToken = localStorage.getItem('token');
        console.log("Token in localStorage after setting:", storedToken ? storedToken.substring(0, 15) + "..." : "missing");
      }, 100);
      setUser(userData);
      console.log("User state set, calling checkAuth in 500ms...");
      // Force a checkAuth call after a short delay
      setTimeout(() => {
        console.log("Manually calling checkAuth...");
        checkAuth();
      }, 500);
      setLoading(false);
      return userData;
    } catch (err) {
      console.error("Login error:", err.response?.status, err.response?.data, err.message);
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    const token = getToken();
    console.log("checkAuth called, token exists:", !!token);
    if (!token) {
      setUser(null);
      setLoading(false);
      console.log("No token found, not authenticated");
      return;
    }

    setLoading(true);
    try {
      console.log("Calling /api/auth/user to verify authentication...");
      const response = await api.get('/api/auth/user');
      console.log("Auth check response:", response.status, response.data);
      if (response.data) {
        setUser(response.data);
        console.log("User authenticated:", response.data.email);
      } else {
        setToken(null);
        setUser(null);
        console.log("Empty response data, clearing authentication");
      }
    } catch (err) {
      console.error("Auth check failed:", err.response?.status, err.response?.data, err.message);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (userData) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure user ID is a number to match backend expectations
      const userId = Number(user.id);
      console.log('Updating profile for user ID:', userId, '(converted to number)');
      console.log('API endpoint:', `${api.defaults.baseURL}/api/profile/${userId}`);
      console.log('Token in context:', getToken() ? 'Token exists' : 'No token found');
      console.log('Request payload:', JSON.stringify({
        ...userData,
        profile_image: userData.profile_image ? 'Base64 image data [truncated]' : null
      }));
      
      // Use direct axios call rather than api instance to ensure correct headers
      const token = getToken();
      const response = await axios.put(`${api.defaults.baseURL}/api/profile/${userId}`, userData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile update API response status:', response.status);
      console.log('Profile update API response data:', JSON.stringify({
        ...response.data,
        profile_image: response.data?.profile_image ? 'Base64 image data [truncated]' : null
      }));
      
      setUser(response.data);
      console.log('User state updated with new profile data');
      
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Profile update error in context:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : 'No response object',
        request: err.request ? 'Request sent but no response' : 'Request setup failed'
      });
      
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Changing password for user ID:', user.id);
      
      // Ensure user ID is a number to match backend expectations
      const userId = Number(user.id);
      
      // Use direct axios call with proper headers
      const token = getToken();
      const response = await axios.put(`${api.defaults.baseURL}/api/profile/${userId}/password`, 
        { 
          current_password: currentPassword, 
          new_password: newPassword 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Password change response:', response.status);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error('Password change error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        } : 'No response object'
      });
      
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Failed to change password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    getToken,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};