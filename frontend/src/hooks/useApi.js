import { useAuth } from "./useAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const useApi = () => {
  const { handleAuthError } = useAuth();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  const apiCall = async (endpoint, options = {}) => {
    const config = {
      headers: getAuthHeaders(),
      ...options,
      ...(options.body && typeof options.body === 'object' && {
        body: JSON.stringify(options.body)
      })
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      
      if (!response.ok) {
        if (handleAuthError(response.status)) {
          throw new Error("Authentication failed");
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const get = (endpoint) => apiCall(endpoint);
  
  const post = (endpoint, data) => apiCall(endpoint, {
    method: "POST",
    body: data
  });
  
  const put = (endpoint, data) => apiCall(endpoint, {
    method: "PUT", 
    body: data
  });
  
  const del = (endpoint) => apiCall(endpoint, {
    method: "DELETE"
  });

  return {
    apiCall,
    get,
    post,
    put,
    delete: del
  };
};