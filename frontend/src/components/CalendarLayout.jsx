import React from "react";
import CalendarView from "./CalendarView";
import EventsList from "./EventsList";
import EventModal from "./EventModal";
import SelectedDayView from "./SelectedDayView";
import CalendarHeader from "./CalendarHeader";

const CalendarLayout = ({
  // Calendar state
  currentDate,
  setCurrentDate,
  selectedCalendarDay,
  setSelectedCalendarDay,
  selectedDayForView,
  setSelectedDayForView,
  
  // Event data
  calendarEvents,
  groupedEvents,
  viewFilter,
  setViewFilter,
  
  // Event handlers
  onCreateEvent,
  refreshEvents,
  
  // Event modal
  showPopup,
  setShowPopup,
  newEvent,
  setNewEvent,
  onSubmit,
  
  // Calendar specific props
  showSettings = false,
  isGoogleConnected = false,
  createButtonText = "Create Event",
  showLegend = false,
  legendOptions = {},
  
  // Layout wrapper (for PersonalCalendar vs MyCalendar difference)
  children
}) => {
  const content = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CalendarView 
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        selectedCalendarDay={selectedCalendarDay}
        setSelectedCalendarDay={setSelectedCalendarDay}
        selectedDayForView={selectedDayForView}
        setSelectedDayForView={setSelectedDayForView}
        calendarEvents={calendarEvents}
        onAddEvent={onCreateEvent}
        showSettings={showSettings}
        isGoogleConnected={isGoogleConnected}
        showLegend={showLegend}
        legendOptions={legendOptions}
      />

      <div className="md:col-span-2 bg-white shadow rounded-lg p-4">
        <CalendarHeader 
          onCreateEvent={onCreateEvent}
          viewFilter={viewFilter}
          setViewFilter={setViewFilter}
          refreshEvents={refreshEvents}
          createButtonText={createButtonText}
        />

        <SelectedDayView 
          selectedDayForView={selectedDayForView}
          setSelectedDayForView={setSelectedDayForView}
          setSelectedCalendarDay={setSelectedCalendarDay}
          calendarEvents={calendarEvents}
          onAddEvent={onCreateEvent}
        />

        <EventsList 
          viewFilter={viewFilter}
          groupedEvents={groupedEvents}
          onCreateEvent={onCreateEvent}
        />
      </div>

      <EventModal 
        showPopup={showPopup}
        setShowPopup={setShowPopup}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        onSubmit={onSubmit}
      />
    </div>
  );

  // If children are provided, wrap the content (for PersonalCalendar's <> wrapper)
  return children ? children(content) : content;
};

export default CalendarLayout;