import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const useGoogleAuth = (refreshEvents) => {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const { checkAuthAndRedirect, handleAuthError } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check if Google Calendar is connected (for UI state only)
    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((userData) => {
        if (userData.google_calendar_connected) {
          setIsGoogleConnected(true);
        } else {
          setIsGoogleConnected(false);
        }
      })
      .catch((err) => {});
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      setIsGoogleConnected(true);
      
      // Fetch user data again to get updated connection status
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            if (userData.google_calendar_connected) {
              setIsGoogleConnected(true);
              // Refresh the main events list to include newly synced Google events
              if (refreshEvents) refreshEvents();
            }
          });
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Force a refresh of events after successful connection
      setTimeout(() => {
        if (refreshEvents) {
          refreshEvents();
        }
      }, 1000); // Small delay to ensure backend sync is complete
    } else if (urlParams.get('error') === 'auth_failed') {
      alert('Google Calendar connection failed. Please try again.');
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshEvents]);

  const connectGoogle = async () => {
    if (!checkAuthAndRedirect()) return;

    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API_URL}/auth/google/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        
        if (handleAuthError(res.status)) return;
        
        alert(`HTTP Error ${res.status}: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        alert("Failed to get Google authorization URL.");
      }
    } catch (error) {
      alert("Error connecting to Google Calendar.");
    }
  };

  const disconnectGoogle = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/auth/google/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setIsGoogleConnected(false);
        // Refresh events to remove Google Calendar events
        if (refreshEvents) refreshEvents();
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const syncGoogleCalendar = async () => {
    if (!checkAuthAndRedirect()) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/auth/google/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        // Refresh events after sync
        setTimeout(() => {
          if (refreshEvents) refreshEvents();
        }, 1000);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  return {
    isGoogleConnected,
    connectGoogle,
    disconnectGoogle,
    syncGoogleCalendar
  };
};