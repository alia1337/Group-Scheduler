import React from "react";
import "./google-style-agenda.css";
import { useLocation } from "react-router-dom";
import { useApp } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { useCalendarPage } from "./hooks/useCalendarPage";
import CalendarLayout from "./components/CalendarLayout";

const MyCalendarPage = () => {
  const { events, groups, visibleGroups, showMyEvents, addEvent, refreshEvents } = useApp();
  const location = useLocation();

  // Use custom hooks
  const { username } = useAuth();

  // Get group ID from URL for filtering
  const urlParams = new URLSearchParams(location.search);
  const selectedGroupId = urlParams.get('group') ? parseInt(urlParams.get('group'), 10) : null;

  // Use shared calendar page logic with specific filtering for group/all events
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
    groupedEvents,
    groupEventsLoading,
    isGroupView
  } = useCalendarPage(events, addEvent, {
    showMyEvents,
    visibleGroups,
    selectedGroupId,
    filterType: selectedGroupId ? 'group' : 'all'
  });

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
      onCreateEvent={handleCreateEvent}
      refreshEvents={refreshEvents}
      showPopup={showPopup}
      setShowPopup={setShowPopup}
      newEvent={newEvent}
      setNewEvent={setNewEvent}
      onSubmit={handleSubmit}
      showSettings={false}
      isGoogleConnected={false}
      showLegend={isGroupView}
      legendOptions={{
        showGoogleEvents: true,
        showGroupEvents: true,
        showPersonalEvents: true
      }}
    />
  );
};

export default MyCalendarPage;