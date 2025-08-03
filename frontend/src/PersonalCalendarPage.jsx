import React, { useState } from "react";
import "./google-style-agenda.css";
import { useApp } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useCalendarPage } from "./hooks/useCalendarPage";
import CalendarLayout from "./components/CalendarLayout";

const PersonalCalendarPage = () => {
  const { events, addEvent, refreshEvents } = useApp();
  const [selectedDate, setSelectedDate] = useState(null);

  // Use custom hooks
  const { username } = useAuth();
  const { isGoogleConnected } = useGoogleAuth(refreshEvents);
  
  // Use shared calendar page logic
  const {
    currentDate,
    setCurrentDate,
    selectedDayForView,
    setSelectedDayForView,
    selectedCalendarDay,
    setSelectedCalendarDay,
    viewFilter,
    setViewFilter,
    showPopup,
    setShowPopup,
    newEvent,
    setNewEvent,
    handleCreateEvent,
    handleSubmit,
    calendarEvents,
    groupedEvents
  } = useCalendarPage(events, addEvent, { filterType: 'personal' });

  // Custom create event handler that sets selectedDate
  const handleCreateEventWithDate = (dateString = null) => {
    setSelectedDate(new Date());
    handleCreateEvent(dateString);
  };

  return (
    <CalendarLayout
      currentDate={currentDate}
      setCurrentDate={setCurrentDate}
      selectedCalendarDay={selectedCalendarDay}
      setSelectedCalendarDay={setSelectedCalendarDay}
      selectedDayForView={selectedDayForView}
      setSelectedDayForView={setSelectedDayForView}
      calendarEvents={calendarEvents}
      groupedEvents={groupedEvents}
      viewFilter={viewFilter}
      setViewFilter={setViewFilter}
      onCreateEvent={handleCreateEventWithDate}
      refreshEvents={refreshEvents}
      showPopup={showPopup}
      setShowPopup={setShowPopup}
      newEvent={newEvent}
      setNewEvent={setNewEvent}
      onSubmit={handleSubmit}
      showSettings={true}
      isGoogleConnected={isGoogleConnected}
    >
      {(content) => <>{content}</>}
    </CalendarLayout>
  );
};

export default PersonalCalendarPage;