import { useState } from "react";
import { format } from "date-fns";
import { useApi } from "./useApi";

export const useEventCreation = (addEvent) => {
  const [showPopup, setShowPopup] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    color: "#1a73e8",
    friend_emails: "",
  });
  const { get, post } = useApi();

  const resetForm = () => {
    setNewEvent({ 
      title: "", 
      date: "", 
      start_time: "", 
      end_time: "", 
      location: "", 
      color: "#1a73e8", 
      friend_emails: "" 
    });
  };

  const handleCreateEvent = (dateString = null) => {
    const today = format(new Date(), "yyyy-MM-dd");
    setNewEvent(prev => ({
      ...prev,
      date: dateString || today
    }));
    setShowPopup(true);
  };

  const validateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.start_time) {
      alert("Please fill in title, date, and start time");
      return false;
    }

    const eventStart = new Date(`${newEvent.date}T${newEvent.start_time}`);
    
    if (newEvent.end_time) {
      const eventEnd = new Date(`${newEvent.date}T${newEvent.end_time}`);
      if (eventEnd <= eventStart) {
        alert("End time must be after start time");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateEvent()) return;

    try {
      // Get user data
      const user = await get("/me");

      const eventStart = new Date(`${newEvent.date}T${newEvent.start_time}`);
      let eventEnd = null;
      
      if (newEvent.end_time) {
        eventEnd = new Date(`${newEvent.date}T${newEvent.end_time}`);
      }

      const payload = {
        title: newEvent.title,
        start: eventStart.toISOString(),
        end_time: eventEnd ? eventEnd.toISOString() : null,
        location: newEvent.location || null,
        color: newEvent.color,
        user_id: user.id,
        friend_emails: newEvent.friend_emails.split(",").map((email) => email.trim()).filter(email => email),
      };

      const savedEvent = await post("/events", payload);
      
      addEvent(savedEvent);
      setShowPopup(false);
      resetForm();
    } catch (error) {
      alert(`Failed to create event: ${error.message}`);
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    resetForm();
  };

  return {
    showPopup,
    setShowPopup,
    newEvent,
    setNewEvent,
    handleCreateEvent,
    handleSubmit,
    handleClose
  };
};