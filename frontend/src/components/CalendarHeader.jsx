import React from "react";
import ViewFilterButtons from "./ViewFilterButtons";
import GoogleCalendarButton from "./GoogleCalendarButton";

const CalendarHeader = ({ 
  onCreateEvent, 
  viewFilter, 
  setViewFilter, 
  refreshEvents,
  createButtonText = "Create Event",
  isGroupView = false,
  onFindFreeTime = null
}) => {
  return (
    <div className="flex justify-between mb-4">
      <div className="flex gap-2">
        <button
          onClick={onCreateEvent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <span className="text-base">+</span>
          {createButtonText}
        </button>
        
        {/* Find Free Time button - only show for group views */}
        {isGroupView && onFindFreeTime && (
          <button
            onClick={onFindFreeTime}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
          >
            <span className="text-base">🔍</span>
            Find Free Time
          </button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* View Filter Buttons */}
        <ViewFilterButtons viewFilter={viewFilter} setViewFilter={setViewFilter} />
        
        {/* Google Calendar Connection */}
        <GoogleCalendarButton refreshEvents={refreshEvents} />
      </div>
    </div>
  );
};

export default CalendarHeader;