import React, { useState, useEffect } from "react";
import "./google-style-agenda.css";
import { useLocation } from "react-router-dom";
import { useApp } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useCalendarPage } from "./hooks/useCalendarPage";
import CalendarLayout from "./components/CalendarLayout";
import FindFreeTime from "./components/FindFreeTime";

const MyCalendarPage = () => {
  const { events, groups, visibleGroups, showMyEvents, addEvent, refreshEvents } = useApp();
  const location = useLocation();
  const [showFindFreeTime, setShowFindFreeTime] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);

  // Use custom hooks
  const { username } = useAuth();
  const { isGoogleConnected } = useGoogleAuth(refreshEvents);

  // Get group ID from URL for filtering
  const urlParams = new URLSearchParams(location.search);
  const selectedGroupId = urlParams.get('group') ? parseInt(urlParams.get('group'), 10) : null;

  // Fetch group members when viewing a specific group
  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMembers(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroupMembers = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const members = await response.json();
        setGroupMembers(members);
      }
    } catch (error) {
      console.error("Failed to fetch group members:", error);
    }
  };

  const handleFindFreeTime = () => {
    setShowFindFreeTime(true);
  };

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
    <>
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
      isGoogleConnected={isGoogleConnected}
      showLegend={isGroupView}
      isGroupView={isGroupView}
      onFindFreeTime={isGroupView ? handleFindFreeTime : null}
      legendOptions={{
        showGoogleEvents: true,
        showGroupEvents: true,
        showPersonalEvents: true
      }}
    />
    
    {/* Find Free Time Modal */}
    {showFindFreeTime && (
      <FindFreeTime
        groupId={selectedGroupId}
        groupMembers={groupMembers}
        onClose={() => setShowFindFreeTime(false)}
        refreshEvents={refreshEvents}
      />
    )}
  </>
  );
};

export default MyCalendarPage;