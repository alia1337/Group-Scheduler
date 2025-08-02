import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const AppProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [visibleGroups, setVisibleGroups] = useState([]);
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [events, setEvents] = useState([]);

  // Fetch groups and events when the app loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("AppContext useEffect - token:", token ? "exists" : "not found");
    if (!token) return;

    // Fetch groups
    console.log("Fetching groups from API...");
    fetch(`${API_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Groups API response:", data);
        setGroups(Array.isArray(data) ? data : []);
        setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
      })
      .catch((err) => {
        console.error("Failed to fetch groups", err);
        setGroups([]);
        setVisibleGroups([]);
      });

    // Fetch events
    fetch(`${API_URL}/events`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          console.error("Events API returned non-array data:", data);
          setEvents([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch events", err);
        setEvents([]);
      });
  }, []);

  const toggleGroupVisibility = (groupId) => {
    setVisibleGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const addEvent = (newEvent) => {
    setEvents((prev) => [...prev, newEvent]);
  };

  const refreshGroups = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
      setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
    } catch (err) {
      console.error("Failed to refresh groups", err);
    }
  };

  const refreshEvents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to refresh events", err);
    }
  };

  const value = {
    groups,
    setGroups,
    visibleGroups,
    setVisibleGroups,
    toggleGroupVisibility,
    showMyEvents,
    setShowMyEvents,
    events,
    setEvents,
    addEvent,
    refreshGroups,
    refreshEvents,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;