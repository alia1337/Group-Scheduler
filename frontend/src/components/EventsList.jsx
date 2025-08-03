import React from "react";
import { format, startOfToday, isSameDay } from "date-fns";
import { formatDateWithOrdinal, formatTimeRange } from "../utils/dateHelpers";

const EventsList = ({ 
  viewFilter, 
  groupedEvents, 
  onCreateEvent,
  isGroupView = false
}) => {
  // Helper function to render user label for group events
  const renderUserLabel = (event) => {
    if (!isGroupView || !event.creator_username) return null;
    
    return (
      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
        {event.creator_username}
      </span>
    );
  };

  // Helper function to render event tags (Google, user label)
  const renderEventTags = (event) => (
    <div className="flex items-center gap-1 mt-1">
      {event.google_event_id && (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Google
        </span>
      )}
      {renderUserLabel(event)}
    </div>
  );

  return (
    <>
      {/* Events List Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {viewFilter === 'today' && (isGroupView ? 'Today\'s Group Events' : 'Today\'s Events')}
          {viewFilter === 'upcoming' && (isGroupView ? 'Upcoming Group Events' : 'Upcoming Events')}
        </h3>
        {Object.keys(groupedEvents).length > 0 && (
          <p className="text-sm text-gray-600">
            {Object.values(groupedEvents).reduce((sum, events) => sum + events.length, 0)} event(s) found
            {isGroupView && ' from all group members'}
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
      ) : (
        // Both today and upcoming views - group by day
        Object.entries(groupedEvents)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([day, evts]) => {
            // Sort events by start time within each day
            const sortedEvents = evts.sort((a, b) => new Date(a.start) - new Date(b.start));
            
            return (
              <div key={day} className="mb-6">
                <div className="schedule-date flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800">
                    {format(new Date(day), "EEEE, MMMM do")}
                  </span>
                  {isSameDay(new Date(day), startOfToday()) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Today
                    </span>
                  )}
                </div>
                {isGroupView && (
                  <div className="text-sm text-gray-500 mb-2">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} from group members
                  </div>
                )}
                <div className="border-b border-gray-200 mb-3" />
                <ul className="space-y-3">
                  {sortedEvents.map((event, idx) => (
                    <li key={idx} className={isGroupView ? 
                      "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow" : 
                      "rbc-agenda-event-cell"
                    }>
                      {isGroupView ? (
                        <div className="flex items-start gap-3">
                          <div
                            className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-gray-900">
                                {event.title}
                              </h5>
                              <span className="text-sm text-gray-600 font-medium">
                                {formatTimeRange(event.start, event.end_time)}
                              </span>
                            </div>
                            {renderEventTags(event)}
                            {event.location && (
                              <div className="text-sm text-gray-500 mt-2">
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <span
                            className="dot"
                            style={{ backgroundColor: event.color }}
                          ></span>
                          <div className="content">
                            <div className="title font-medium text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTimeRange(event.start, event.end_time)}
                              {event.location && (
                                <div className="text-xs text-gray-400 mt-1">
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                            {renderEventTags(event)}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
      )}
    </>
  );
};

export default EventsList;