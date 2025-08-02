import React, { useEffect, useState, useRef } from "react";
import {
  format,
  startOfToday,
  endOfYear,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  addDays,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./google-style-agenda.css";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "./contexts/AppContext";

// Helper function to format date with ordinal numbers (1st, 2nd, 3rd, etc.)
const formatDateWithOrdinal = (date) => {
  const day = date.getDate();
  const ordinal = (n) => {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };
  
  const weekday = format(date, "EEE");
  const month = format(date, "MMM");
  const dayWithOrdinal = ordinal(day);
  
  return `${weekday}, ${dayWithOrdinal} ${month}`;
};

// Helper function to format time range intelligently
const formatTimeRange = (startTime, endTime) => {
  const startFormatted = format(new Date(startTime), "h:mm a");
  
  if (!endTime) {
    return startFormatted;
  }
  
  const endFormatted = format(new Date(endTime), "h:mm a");
  
  // If start and end times are the same, show only once
  if (startFormatted === endFormatted) {
    return startFormatted;
  }
  
  // Otherwise show as a range
  return `${startFormatted} - ${endFormatted}`;
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PersonalCalendarPage = () => {
  const { events, addEvent, refreshEvents } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayForView, setSelectedDayForView] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    color: "#1a73e8",
    friend_emails: "",
  });
  const [username, setUsername] = useState("");
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [viewFilter, setViewFilter] = useState('today'); // 'today', 'upcoming'
  const [hasCheckedTodayEvents, setHasCheckedTodayEvents] = useState(false);
  const monthYearPickerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    
    const token = localStorage.getItem("token");
    if (!token) return;

    // Check if Google Calendar is connected (for UI state only)
    fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((userData) => {
        console.log("User data from /me endpoint:", userData);
        console.log("Google Calendar connected status:", userData.google_calendar_connected);
        
        if (userData.google_calendar_connected) {
          console.log("Google Calendar is connected");
          setIsGoogleConnected(true);
          // Note: Google events are now included in the main /events endpoint
        } else {
          console.log("Google Calendar is not connected");
          setIsGoogleConnected(false);
        }
      })
      .catch((err) => console.error("Failed to fetch user data", err));
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      console.log("OAuth callback: connection successful");
      setIsGoogleConnected(true);
      // Fetch user data again to get updated connection status
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            console.log("Updated user data after OAuth:", userData);
            if (userData.google_calendar_connected) {
              setIsGoogleConnected(true);
              // Refresh the main events list to include newly synced Google events
              refreshEvents();
            }
          });
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error') === 'auth_failed') {
      alert('Google Calendar connection failed. Please try again.');
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Close month/year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthYearPickerRef.current && !monthYearPickerRef.current.contains(event.target)) {
        setShowMonthYearPicker(false);
      }
    };

    if (showMonthYearPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMonthYearPicker]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    console.log("Previous month:", format(newDate, "MMMM yyyy"));
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    console.log("Next month:", format(newDate, "MMMM yyyy"));
    setCurrentDate(newDate);
  };

  const handleMonthYearSelect = (month, year) => {
    const newDate = new Date(year, month, 1);
    setCurrentDate(newDate);
    setShowMonthYearPicker(false);
  };

  const toggleMonthYearPicker = () => {
    setShowMonthYearPicker(!showMonthYearPicker);
  };

  const handleDayClick = (date) => {
    console.log("Day clicked:", format(date, "yyyy-MM-dd"));
    console.log("Current calendar month:", format(currentDate, "yyyy-MM"));
    
    // Toggle selection - if same day is clicked, deselect it
    if (selectedCalendarDay && isSameDay(selectedCalendarDay, date)) {
      setSelectedDayForView(null);
      setSelectedCalendarDay(null);
    } else {
      setSelectedDayForView(date);
      setSelectedCalendarDay(date);
    }
  };

  const handleCreateEvent = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    setNewEvent(prev => ({
      ...prev,
      date: today
    }));
    setSelectedDate(new Date());
    setShowPopup(true);
  };

  const handlePopupSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Validate required fields
    if (!newEvent.title || !newEvent.date || !newEvent.start_time) {
      alert("Please fill in title, date, and start time");
      return;
    }

    const eventStart = new Date(`${newEvent.date}T${newEvent.start_time}`);
    let eventEnd = null;
    
    if (newEvent.end_time) {
      eventEnd = new Date(`${newEvent.date}T${newEvent.end_time}`);
      // Validate that end time is after start time
      if (eventEnd <= eventStart) {
        alert("End time must be after start time");
        return;
      }
    }

    const meRes = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await meRes.json();

    const payload = {
      title: newEvent.title,
      start: eventStart.toISOString(),
      end_time: eventEnd ? eventEnd.toISOString() : null,
      location: newEvent.location || null,
      color: newEvent.color,
      user_id: user.id,
      friend_emails: newEvent.friend_emails.split(",").map((email) => email.trim()).filter(email => email),
    };

    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const savedEvent = await res.json();
      addEvent(savedEvent);
      setShowPopup(false);
      setNewEvent({ 
        title: "", 
        date: "", 
        start_time: "", 
        end_time: "", 
        location: "", 
        color: "#1a73e8", 
        friend_emails: "" 
      });
    } else {
      const errorData = await res.json();
      alert(`Failed to create event: ${errorData.detail || 'Unknown error'}`);
    }
  };

  const handleConnectGoogle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      alert("No authentication token found. Please log in again.");
      return;
    }

    console.log("Attempting to connect to Google Calendar...");
    
    try {
      const res = await fetch(`${API_URL}/auth/google/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("HTTP Error:", res.status, errorText);
        
        if (res.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login");
          return;
        }
        
        alert(`HTTP Error ${res.status}: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      console.log("Response data:", data);
      
      if (data.auth_url) {
        console.log("Redirecting to Google OAuth...");
        window.location.href = data.auth_url;
      } else {
        console.error("No auth_url in response:", data);
        alert("Failed to get Google authorization URL. Check console for details.");
      }
    } catch (error) {
      console.error("Failed to get Google auth URL", error);
      alert("Error connecting to Google Calendar. Check console for details.");
    }
  };


  // ALL events from today onwards (completely independent of view tabs)
  const today = startOfToday();
  const allEventsFromToday = events.filter((event) => {
    const eventDate = new Date(event.start);
    return !isBefore(eventDate, today);
  });

  // ALL personal events (for calendar dots - completely independent of view tabs)
  const allPersonalEvents = allEventsFromToday.filter((event) => {
    // Show Google Calendar events (they have google_event_id)
    if (event.google_event_id) return true;
    // Show only personal events (group_id is null and no google_event_id)
    return event.group_id === null;
  });

  // Get date range based on view filter (for events list only)
  const getDateRange = () => {
    const today = startOfToday();
    switch (viewFilter) {
      case 'today':
        return { start: today, end: addDays(today, 1) };
      case 'upcoming':
      default:
        return { start: addDays(today, 1), end: addMonths(today, 12) }; // Next 12 months, excluding today
    }
  };

  const dateRange = getDateRange();
  const eventsInRange = allPersonalEvents.filter((event) => {
    const eventDate = new Date(event.start);
    return isWithinInterval(eventDate, dateRange) || isSameDay(eventDate, dateRange.start);
  });
  
  // Events filtered by current view (Today/Upcoming) for the events list only
  const filteredEvents = eventsInRange;

  // Check for today's events and default to upcoming if none (only on initial load)
  React.useEffect(() => {
    if (!hasCheckedTodayEvents && viewFilter === 'today') {
      const today = startOfToday();
      
      if (events.length > 0) {
        // Check for today's events (personal and Google events)
        const todayEvents = events.filter(event => {
          const eventDate = new Date(event.start);
          const isToday = isSameDay(eventDate, today);
          const isPersonalOrGoogle = event.google_event_id || event.group_id === null;
          return isToday && isPersonalOrGoogle;
        });
        
        console.log('Today events found:', todayEvents.length);
        
        // If no events today, check for upcoming events
        if (todayEvents.length === 0) {
          const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            const isFuture = isAfter(eventDate, today);
            const isPersonalOrGoogle = event.google_event_id || event.group_id === null;
            return isFuture && isPersonalOrGoogle;
          });
          
          console.log('Upcoming events found:', upcomingEvents.length);
          
          if (upcomingEvents.length > 0) {
            console.log('Switching to upcoming view');
            setViewFilter('upcoming');
          }
        }
        
        setHasCheckedTodayEvents(true);
      }
    }
  }, [events, hasCheckedTodayEvents, viewFilter]);

  // Create events grouped by day for calendar display (completely independent of tabs)
  const calendarEvents = React.useMemo(() => {
    console.log(`📅 Creating calendar events from ${allPersonalEvents.length} total personal events`);
    return allPersonalEvents.reduce((acc, event) => {
      const day = format(new Date(event.start), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {});
  }, [allPersonalEvents]);
  
  // Group events differently based on view filter for the events list
  const groupedEvents = React.useMemo(() => {
    if (viewFilter === 'today') {
      // Group by day for today view
      return filteredEvents.reduce((acc, event) => {
        const day = format(new Date(event.start), "yyyy-MM-dd");
        if (!acc[day]) acc[day] = [];
        acc[day].push(event);
        return acc;
      }, {});
    } else {
      // Group by month for upcoming view
      return filteredEvents.reduce((acc, event) => {
        const month = format(new Date(event.start), "yyyy-MM");
        if (!acc[month]) acc[month] = [];
        acc[month].push(event);
        return acc;
      }, {});
    }
  }, [filteredEvents, viewFilter]);


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4 relative">
          <div className="flex justify-between items-center mb-2">
            <button onClick={handlePrevMonth} className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">&laquo;</button>
            <button 
              onClick={toggleMonthYearPicker}
              className="text-lg font-semibold hover:bg-gray-100 px-3 py-1 rounded cursor-pointer"
            >
              {format(currentDate, "MMMM yyyy")}
            </button>
            <button onClick={handleNextMonth} className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">&raquo;</button>
          </div>

          {/* Month/Year Picker Modal */}
          {showMonthYearPicker && (
            <div 
              ref={monthYearPickerRef}
              className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Select Month & Year</h3>
                <button 
                  onClick={() => setShowMonthYearPicker(false)}
                  className="px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  ×
                </button>
              </div>
              
              {/* Year Selection */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                    className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    ← {currentDate.getFullYear() - 1}
                  </button>
                  <span className="font-semibold">{currentDate.getFullYear()}</span>
                  <button 
                    onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                    className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                  >
                    {currentDate.getFullYear() + 1} →
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((monthName, index) => (
                  <button
                    key={index}
                    onClick={() => handleMonthYearSelect(index, currentDate.getFullYear())}
                    className={`px-3 py-2 text-sm font-medium rounded hover:bg-blue-50 ${
                      currentDate.getMonth() === index 
                        ? 'bg-blue-100 text-blue-800 font-semibold' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {monthName}
                  </button>
                ))}
              </div>

              {/* Quick Year Navigation */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-center gap-2 flex-wrap">
                  {[2023, 2024, 2025, 2026, 2027].map(year => (
                    <button
                      key={year}
                      onClick={() => handleMonthYearSelect(currentDate.getMonth(), year)}
                      className={`px-3 py-2 text-sm font-medium rounded ${
                        currentDate.getFullYear() === year
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <Calendar
            value={selectedCalendarDay}
            activeStartDate={currentDate}
            onClickDay={handleDayClick}
            onActiveStartDateChange={({ activeStartDate }) => {
              setCurrentDate(activeStartDate);
            }}
            view="month"
            showNavigation={false}
            showNeighboringMonth={false}
            minDetail="month"
            maxDetail="month"
            tileContent={({ date, view }) => {
              if (view === "month") {
                const dayKey = format(date, "yyyy-MM-dd");
                const dayEvents = calendarEvents[dayKey] || [];
                console.log(`📅 Calendar tile for ${dayKey}: ${dayEvents.length} events`);
                
                if (dayEvents.length > 0) {
                  return (
                    <div className="flex gap-1 max-w-full overflow-hidden">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: event.color }}
                          title={event.title}
                        ></div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div 
                          className="w-2 h-2 rounded-full bg-gray-400"
                          title={`+${dayEvents.length - 3} more events`}
                        ></div>
                      )}
                    </div>
                  );
                }
                return null;
              }
            }}
          />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendar Settings</h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium">View:</span> Personal Events Only
              </div>
              {isGoogleConnected && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Google Calendar:</span> Connected
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white shadow rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <button
              onClick={handleCreateEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2"
            >
              <span className="text-base">+</span>
              Create Event
            </button>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* View Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewFilter('today')}
                  className={`px-4 py-2 text-sm font-medium rounded ${
                    viewFilter === 'today'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewFilter('upcoming')}
                  className={`px-4 py-2 text-sm font-medium rounded ${
                    viewFilter === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Upcoming
                </button>
              </div>
              
              {/* Google Calendar Connection */}
              <div className="flex gap-2">
                {isGoogleConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓ Google Calendar Connected</span>
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem("token");
                        if (!token) return;
                        
                        try {
                          const res = await fetch(`${API_URL}/auth/google/disconnect`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          
                          if (res.ok) {
                            setIsGoogleConnected(false);
                            // Refresh events to remove Google Calendar events
                            refreshEvents();
                            console.log("Google Calendar disconnected successfully");
                          } else {
                            console.error("Failed to disconnect Google Calendar");
                          }
                        } catch (error) {
                          console.error("Error disconnecting Google Calendar:", error);
                        }
                      }}
                      className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 text-sm font-medium rounded transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium rounded"
                  >
                    Connect Google Calendar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Selected Day Events Section */}
          {selectedDayForView && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-900">
                  {format(selectedDayForView, "EEEE, MMMM d")}
                </h4>
                <button
                  onClick={() => {
                    setSelectedDayForView(null);
                    setSelectedCalendarDay(null);
                  }}
                  className="px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const dayKey = format(selectedDayForView, "yyyy-MM-dd");
                const dayEvents = calendarEvents[dayKey] || [];
                console.log(`🗓️ Selected Day View - ${dayKey}: Found ${dayEvents.length} events`);
                
                if (dayEvents.length === 0) {
                  return (
                    <div className="text-center py-4 text-gray-600">
                      <div className="text-2xl mb-2">📅</div>
                      <p className="text-sm">No events on this day</p>
                      <button
                        onClick={() => {
                          setNewEvent(prev => ({
                            ...prev,
                            date: dayKey
                          }));
                          setShowPopup(true);
                        }}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded"
                      >
                        + Add Event
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm text-gray-600">
                        {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => {
                          setNewEvent(prev => ({
                            ...prev,
                            date: dayKey
                          }));
                          setShowPopup(true);
                        }}
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
                );
              })()}
            </div>
          )}

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
                onClick={handleCreateEvent}
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
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Event</h3>
            
            {/* Event Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                placeholder="Enter event title"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
              />
            </div>

            {/* Time Range */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEvent.start_time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start_time: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEvent.end_time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Enter location (optional)"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
              />
            </div>

            {/* Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                {["#1a73e8", "#d32f2f", "#388e3c", "#f57c00", "#7b1fa2", "#616161"].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${newEvent.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewEvent({ ...newEvent, color })}
                  />
                ))}
              </div>
            </div>

            {/* Friend Emails */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Share with Friends
              </label>
              <input
                type="text"
                placeholder="Enter email addresses (comma-separated)"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newEvent.friend_emails}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, friend_emails: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add friend email addresses to share this event
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPopup(false);
                  setNewEvent({ 
                    title: "", 
                    date: "", 
                    start_time: "", 
                    end_time: "", 
                    location: "", 
                    color: "#1a73e8", 
                    friend_emails: "" 
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium rounded-lg"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PersonalCalendarPage;