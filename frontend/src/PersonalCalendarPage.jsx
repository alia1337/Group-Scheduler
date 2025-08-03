import React, { useState } from "react";
import "./google-style-agenda.css";
import { useApp } from "./contexts/AppContext";
import { useAuth } from "./hooks/useAuth";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useEventCreation } from "./hooks/useEventCreation";
import { useEventFiltering } from "./hooks/useEventFiltering";
import CalendarView from "./components/CalendarView";
import EventsList from "./components/EventsList";
import EventModal from "./components/EventModal";
import SelectedDayView from "./components/SelectedDayView";
import GoogleCalendarButton from "./components/GoogleCalendarButton";
import ViewFilterButtons from "./components/ViewFilterButtons";

const PersonalCalendarPage = () => {
  const { events, addEvent, refreshEvents } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayForView, setSelectedDayForView] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [viewFilter, setViewFilter] = useState('today');
  const [hasCheckedTodayEvents, setHasCheckedTodayEvents] = useState(false);

  // Use custom hooks
  const { username } = useAuth();
  const { isGoogleConnected, connectGoogle, disconnectGoogle } = useGoogleAuth(refreshEvents);
  const { 
    showPopup, 
    setShowPopup, 
    newEvent, 
    setNewEvent, 
    handleCreateEvent, 
    handleSubmit 
  } = useEventCreation(addEvent);

  // Use event filtering hook for personal events only
  const { calendarEvents, getGroupedEvents, checkTodayEvents } = useEventFiltering(events, {
    filterType: 'personal'
  });

  // Get grouped events for current view
  const groupedEvents = getGroupedEvents(viewFilter);

  // Check for today's events and default to upcoming if none (only on initial load)
  React.useEffect(() => {
    if (!hasCheckedTodayEvents && viewFilter === 'today') {
      checkTodayEvents(viewFilter, setViewFilter);
      setHasCheckedTodayEvents(true);
    }
  }, [events, hasCheckedTodayEvents, viewFilter, checkTodayEvents]);

  // Custom create event handler that sets selectedDate
  const handleCreateEventWithDate = (dateString = null) => {
    setSelectedDate(new Date());
    handleCreateEvent(dateString);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CalendarView 
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          selectedCalendarDay={selectedCalendarDay}
          setSelectedCalendarDay={setSelectedCalendarDay}
          selectedDayForView={selectedDayForView}
          setSelectedDayForView={setSelectedDayForView}
          calendarEvents={calendarEvents}
          onAddEvent={handleCreateEventWithDate}
          showSettings={true}
          isGoogleConnected={isGoogleConnected}
        />

        <div className="md:col-span-2 bg-white shadow rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <button
              onClick={handleCreateEventWithDate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
            >
              <span className="text-base">+</span>
              Create Event
            </button>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* View Filter Buttons */}
              <ViewFilterButtons viewFilter={viewFilter} setViewFilter={setViewFilter} />
              
              {/* Google Calendar Connection */}
              <GoogleCalendarButton refreshEvents={refreshEvents} />
            </div>
          </div>

          <SelectedDayView 
            selectedDayForView={selectedDayForView}
            setSelectedDayForView={setSelectedDayForView}
            setSelectedCalendarDay={setSelectedCalendarDay}
            calendarEvents={calendarEvents}
            onAddEvent={handleCreateEventWithDate}
          />

          <EventsList 
            viewFilter={viewFilter}
            groupedEvents={groupedEvents}
            onCreateEvent={handleCreateEventWithDate}
          />
        </div>
      </div>

      <EventModal 
        showPopup={showPopup}
        setShowPopup={setShowPopup}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default PersonalCalendarPage;