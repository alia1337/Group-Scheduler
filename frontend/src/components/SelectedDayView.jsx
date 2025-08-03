import React from "react";
import { format } from "date-fns";
import { formatTimeRange } from "../utils/dateHelpers";

const SelectedDayView = ({
  selectedDayForView,
  setSelectedDayForView,
  setSelectedCalendarDay,
  calendarEvents,
  onAddEvent
}) => {
  if (!selectedDayForView) return null;

  const dayKey = format(selectedDayForView, "yyyy-MM-dd");
  const dayEvents = calendarEvents[dayKey] || [];
  console.log(`🗓️ Selected Day View - ${dayKey}: Found ${dayEvents.length} events`);

  const handleClose = () => {
    setSelectedDayForView(null);
    setSelectedCalendarDay(null);
  };

  const handleAddEvent = () => {
    onAddEvent(dayKey);
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-900">
          {format(selectedDayForView, "EEEE, MMMM d")}
        </h4>
        <button
          onClick={handleClose}
          className="px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          ×
        </button>
      </div>
      
      {dayEvents.length === 0 ? (
        <div className="text-center py-4 text-gray-600">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm">No events on this day</p>
          <button
            onClick={handleAddEvent}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded"
          >
            + Add Event
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">
              {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleAddEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium rounded flex items-center gap-1"
            >
              <span className="text-sm">+</span>
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {dayEvents.map((event, idx) => (
              <div key={idx} className="bg-white rounded p-3 border border-gray-200 hover:border-gray-300">
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-gray-900 text-sm truncate">
                        {event.title}
                      </h5>
                      {event.google_event_id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded flex-shrink-0">
                          Google
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-1">
                      {formatTimeRange(event.start, event.end_time)}
                    </div>
                    
                    {event.location && (
                      <div className="text-xs text-gray-500">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedDayView;