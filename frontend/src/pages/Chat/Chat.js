import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import AuthenticatedChat from './AuthenticatedChat';
import UnauthenticatedChat from './UnauthenticatedChat';

const Chat = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const forceUnauth = location.state?.forceUnauth;

  console.log('[Chat/index.js] isAuthenticated:', isAuthenticated);
  console.log('[Chat/index.js] Rendering:', (!isAuthenticated || forceUnauth) ? 'UnauthenticatedChat' : 'AuthenticatedChat');

  // Show unauthenticated chat if user is not authenticated or if forceUnauth is true
  return isAuthenticated ? (
    <AuthenticatedChat />
  ) : (
    <UnauthenticatedChat />
  );
};

export default Chat; 