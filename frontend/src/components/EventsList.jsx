import React from "react";
import { format, startOfToday, isSameDay } from "date-fns";
import { formatDateWithOrdinal, formatTimeRange } from "../utils/dateHelpers";

const EventsList = ({ 
  viewFilter, 
  groupedEvents, 
  onCreateEvent 
}) => {
  return (
    <>
      {/* Events List Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {viewFilter === 'today' && 'Today\'s Events'}
          {viewFilter === 'upcoming' && 'Upcoming Events'}
        </h3>
        {Object.keys(groupedEvents).length > 0 && (
          <p className="text-sm text-gray-600">
            {Object.values(groupedEvents).reduce((sum, events) => sum + events.length, 0)} event(s) found
          </p>
        )}
      </div>

      {Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <h4 className="text-lg font-medium mb-2">No events found</h4>
          <p className="text-sm mb-4">
            {viewFilter === 'today' && 'No events scheduled for today.'}
            {viewFilter === 'upcoming' && 'No upcoming events scheduled.'}
          </p>
          <button
            onClick={onCreateEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg"
          >
            Create Your First Event
          </button>
        </div>
      ) : viewFilter === 'today' ? (
        // Today view - group by day
        Object.entries(groupedEvents).map(([day, evts]) => (
          <div key={day} className="mb-4">
            <div className="schedule-date">
              {format(new Date(day), "dd EEE MMM")}
              {isSameDay(new Date(day), startOfToday()) && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Today
                </span>
              )}
            </div>
            <div className="border-b border-gray-200 mb-2" />
            <ul className="schedule-list">
              {evts.map((event, idx) => (
                <li key={idx} className="rbc-agenda-event-cell">
                  <span
                    className="dot"
                    style={{ backgroundColor: event.color }}
                  ></span>
                  <div className="content">
                    <div className="title font-medium text-gray-900 flex items-center gap-2">
                      {event.title}
                      {event.google_event_id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Google
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeRange(event.start, event.end_time)}
                      {event.location && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        // Upcoming view - group by month
        Object.entries(groupedEvents)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, evts]) => {
            // Sort events within each month by date
            const sortedEvents = evts.sort((a, b) => new Date(a.start) - new Date(b.start));
            
            return (
              <div key={month} className="mb-6">
                {/* Month Header */}
                <div className="bg-gray-50 px-4 py-3 rounded-lg mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {format(new Date(month + '-01'), "MMMM yyyy")}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Events for this month */}
                <div className="space-y-3 ml-2">
                  {sortedEvents.map((event, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-gray-900">
                              {event.title}
                            </h5>
                            {event.google_event_id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Google
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-1">
                            {formatDateWithOrdinal(new Date(event.start))} at {formatTimeRange(event.start, event.end_time)}
                          </div>
                          
                          {event.location && (
                            <div className="text-sm text-gray-500">
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
      )}
    </>
  );
};

export default EventsList;