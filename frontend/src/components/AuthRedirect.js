import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // If user is authenticated, redirect to personal calendar
  if (token) {
    return <Navigate to="/personal-calendar" replace />;
  }
  
  // If not authenticated, show the children (login/register page)
  return children;
};

export default AuthRedirect;