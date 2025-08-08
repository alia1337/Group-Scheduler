import React from "react";
import CalendarView from "./CalendarView";
import EventsList from "./EventsList";
import EventModal from "./EventModal";
import SelectedDayView from "./SelectedDayView";
import CalendarHeader from "./CalendarHeader";

const CalendarLayout = ({
  currentDate,
  setCurrentDate,
  selectedDay,
  setSelectedDay,
  viewDay,
  setViewDay,
  calendarEvents,
  groupedEvents,
  viewFilter,
  setViewFilter,
  onCreateEvent,
  refreshEvents,
  showPopup,
  setShowPopup,
  newEvent,
  setNewEvent,
  onSubmit,
  showSettings = false,
  isGoogleConnected = false,
  buttonText = "Create Event",
  showLegend = false,
  legendOptions = {},
  isGroupView = false,
  onFindTime = null,
  children
}) => {
  const content = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CalendarView 
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        viewDay={viewDay}
        setViewDay={setViewDay}
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
          buttonText={buttonText}
          isGroupView={isGroupView}
          onFindTime={onFindTime}
        />

        <SelectedDayView 
          viewDay={viewDay}
          setViewDay={setViewDay}
          setSelectedDay={setSelectedDay}
          calendarEvents={calendarEvents}
          onAddEvent={onCreateEvent}
        />

        <EventsList 
          viewFilter={viewFilter}
          groupedEvents={groupedEvents}
          onCreateEvent={onCreateEvent}
          isGroupView={isGroupView}
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

  return children ? children(content) : content;
};

export default CalendarLayout;