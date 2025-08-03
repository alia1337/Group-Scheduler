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
        console.log("User data from /me endpoint:", userData);
        console.log("Google Calendar connected status:", userData.google_calendar_connected);
        
        if (userData.google_calendar_connected) {
          console.log("Google Calendar is connected");
          setIsGoogleConnected(true);
        } else {
          console.log("Google Calendar is not connected");
          setIsGoogleConnected(false);
        }
      })
      .catch((err) => console.error("Failed to fetch user data", err));
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      console.log("OAuth callback: connection successful");
      setIsGoogleConnected(true);
      
      // Fetch user data again to get updated connection status
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            console.log("Updated user data after OAuth:", userData);
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
          console.log("Forcing refresh of events after Google Calendar connection");
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
    console.log("Attempting to connect to Google Calendar...");
    
    try {
      const res = await fetch(`${API_URL}/auth/google/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("HTTP Error:", res.status, errorText);
        
        if (handleAuthError(res.status)) return;
        
        alert(`HTTP Error ${res.status}: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      console.log("Response data:", data);
      
      if (data.auth_url) {
        console.log("Redirecting to Google OAuth...");
        window.location.href = data.auth_url;
      } else {
        console.error("No auth_url in response:", data);
        alert("Failed to get Google authorization URL. Check console for details.");
      }
    } catch (error) {
      console.error("Failed to get Google auth URL", error);
      alert("Error connecting to Google Calendar. Check console for details.");
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
        console.log("Google Calendar disconnected successfully");
      } else {
        console.error("Failed to disconnect Google Calendar");
      }
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
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
        console.log("Google Calendar sync triggered successfully");
        // Refresh events after sync
        setTimeout(() => {
          if (refreshEvents) refreshEvents();
        }, 1000);
      } else {
        console.error("Failed to sync Google Calendar");
      }
    } catch (error) {
      console.error("Error syncing Google Calendar:", error);
    }
  };

  return {
    isGoogleConnected,
    connectGoogle,
    disconnectGoogle,
    syncGoogleCalendar
  };
};