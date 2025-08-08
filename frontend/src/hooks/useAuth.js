import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const useAuth = () => {
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("username");
    const token = localStorage.getItem("token");
    
    if (user) setUsername(user);
    if (token) setIsAuthenticated(true);
    
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    setIsAuthenticated(false);
    navigate("/");
  };

  const checkAuthAndRedirect = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found. Please log in again.");
      logout();
      return false;
    }
    return true;
  };

  const handleAuthError = (status) => {
    if (status === 401) {
      alert("Your session has expired. Please log in again.");
      logout();
      return true;
    }
    return false;
  };

  return {
    username,
    isAuthenticated,
    isLoading,
    logout,
    checkAuthAndRedirect,
    handleAuthError
  };
};