import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";

export const useGroupEvents = (selectedGroupId) => {
  const [groupEvents, setGroupEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchGroupEvents } = useApp();

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupEvents([]);
      return;
    }

    const loadGroupEvents = async () => {
      setLoading(true);
      try {
        const events = await fetchGroupEvents(selectedGroupId);
        setGroupEvents(events);
      } catch (error) {
        setGroupEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadGroupEvents();
  }, [selectedGroupId, fetchGroupEvents]);

  // Removed duplicate refresh logic - the main useEffect handles all refreshing

  const refreshGroupEvents = async () => {
    if (!selectedGroupId) return;
    
    setLoading(true);
    try {
      const events = await fetchGroupEvents(selectedGroupId);
      setGroupEvents(events);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  return {
    groupEvents,
    loading,
    refreshGroupEvents
  };
};