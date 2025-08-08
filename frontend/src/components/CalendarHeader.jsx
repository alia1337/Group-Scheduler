import React from "react";
import ViewFilterButtons from "./ViewFilterButtons";
import GoogleCalendarButton from "./GoogleCalendarButton";

const CalendarHeader = ({ 
  onCreateEvent, 
  viewFilter, 
  setViewFilter, 
  refreshEvents,
  buttonText = "Create Event",
  isGroupView = false,
  onFindTime = null
}) => {
  return (
    <div className="flex justify-between mb-4">
      <div className="flex gap-2">
        <button
          onClick={onCreateEvent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <span className="text-base">+</span>
          {buttonText}
        </button>
        
        {isGroupView && onFindTime && (
          <button
            onClick={onFindTime}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
          >
            <span className="text-base">🔍</span>
            Find Free Time
          </button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <ViewFilterButtons viewFilter={viewFilter} setViewFilter={setViewFilter} />
        
        <GoogleCalendarButton refreshEvents={refreshEvents} />
      </div>
    </div>
  );
};

export default CalendarHeader;