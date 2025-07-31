import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // If user is authenticated, redirect to calendar
  if (token) {
    return <Navigate to="/calendar" replace />;
  }
  
  // If not authenticated, show the children (login/register page)
  return children;
};

export default AuthRedirect;