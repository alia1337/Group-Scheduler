import React, { useEffect, useState, useRef } from "react";
import {
  format,
  startOfToday,
  endOfYear,
  isWithinInterval,
  addMonths,
  subMonths,
} from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./google-style-agenda.css";
import { Link, useNavigate } from "react-router-dom";

const MyCalendarPage = () => {
  const [events, setEvents] = useState([]);
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
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [groups, setGroups] = useState([]);
  const [visibleGroups, setVisibleGroups] = useState([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const monthYearPickerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    if (!token) return;

    fetch("http://localhost:8000/events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Ensure data is an array before setting
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          console.error("Events API returned non-array data:", data);
          setEvents([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch events", err);
        setEvents([]);
      });

    fetch("http://localhost:8000/groups", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setGroups(Array.isArray(data) ? data : []);
        setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
      })
      .catch((err) => {
        console.error("Failed to fetch groups", err);
        setGroups([]);
        setVisibleGroups([]);
      });

    // Check if Google Calendar is connected and fetch events
    fetch("http://localhost:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((userData) => {
        console.log("User data from /me endpoint:", userData);
        console.log("Google Calendar connected status:", userData.google_calendar_connected);
        
        if (userData.google_calendar_connected) {
          console.log("Google Calendar is connected, setting state and fetching events");
          setIsGoogleConnected(true);
          // Fetch Google Calendar events
          fetch("http://localhost:8000/auth/google/events", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((googleData) => {
              console.log("Google Calendar events received:", googleData);
              console.log("Number of Google events:", Array.isArray(googleData) ? googleData.length : 0);
              if (Array.isArray(googleData) && googleData.length > 0) {
                googleData.forEach(event => {
                  console.log(`Google event: ${event.title} on ${event.start}`);
                });
              }
              setGoogleEvents(Array.isArray(googleData) ? googleData : []);
            })
            .catch((err) => console.error("Failed to fetch Google events", err));
        } else {
          console.log("Google Calendar is not connected");
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
        fetch("http://localhost:8000/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            console.log("Updated user data after OAuth:", userData);
            if (userData.google_calendar_connected) {
              setIsGoogleConnected(true);
              // Fetch Google events
              fetch("http://localhost:8000/auth/google/events", {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((res) => res.json())
                .then((googleData) => {
                  console.log("Google Calendar events after OAuth:", googleData);
                  setGoogleEvents(Array.isArray(googleData) ? googleData : []);
                })
                .catch((err) => console.error("Failed to fetch Google events", err));
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
    setSelectedDayForView(date);
    setSelectedCalendarDay(date);
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

    const meRes = await fetch("http://localhost:8000/me", {
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

    const res = await fetch("http://localhost:8000/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const savedEvent = await res.json();
      setEvents((prev) => [...prev, savedEvent]);
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
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8000/auth/google/login", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error("Failed to get Google auth URL", error);
    }
  };

  // Show events from start of current year to end of next year
  const currentYear = new Date().getFullYear();
  const startOfCurrentYear = new Date(currentYear, 0, 1); // January 1st of current year
  const endOfNextYear = new Date(currentYear + 1, 11, 31, 23, 59, 59); // December 31st of next year

  const eventsInRange = events.filter((event) => {
    const eventDate = new Date(event.start);
    return isWithinInterval(eventDate, { start: startOfCurrentYear, end: endOfNextYear });
  });

  // Combine local events with Google Calendar events
  const allEvents = [...eventsInRange];
  if (isGoogleConnected) {
    const googleEventsFiltered = googleEvents.filter((event) => {
      const eventDate = new Date(event.start);
      return isWithinInterval(eventDate, { start: startOfCurrentYear, end: endOfNextYear });
    }).map(event => ({
      ...event,
      color: '#4285f4', // Google blue color
      source: 'google'
    }));
    allEvents.push(...googleEventsFiltered);
  }

  const filteredEvents = allEvents.filter((event) => {
    // Always show Google Calendar events if connected
    if (event.source === 'google') return true;
    
    if (!showMyEvents && event.group_id === null) return false;
    if (event.group_id && !visibleGroups.includes(event.group_id)) return false;
    return true;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const day = format(new Date(event.start), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  const toggleGroupVisibility = (groupId) => {
    setVisibleGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm mb-6">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
          <Link to="/" className="hover:underline font-medium">
            Home
          </Link>
          <Link to="/new-group" className="hover:underline font-medium">
            New Group
          </Link>
          <Link to="/new-event" className="hover:underline font-medium">
            New Event
          </Link>
          {username && <span className="text-gray-600">Welcome {username}</span>}
          <button onClick={handleLogout} className="ml-4 text-red-600 hover:underline">
            Logout
          </button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4 relative">
          <div className="flex justify-between items-center mb-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded">&laquo;</button>
            <button 
              onClick={toggleMonthYearPicker}
              className="text-lg font-semibold hover:bg-gray-100 px-3 py-1 rounded cursor-pointer"
            >
              {format(currentDate, "MMMM yyyy")}
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded">&raquo;</button>
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
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
              
              {/* Year Selection */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ← {currentDate.getFullYear() - 1}
                  </button>
                  <span className="font-semibold">{currentDate.getFullYear()}</span>
                  <button 
                    onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                    className="text-sm text-blue-600 hover:text-blue-800"
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
                    className={`p-2 text-sm rounded hover:bg-blue-50 ${
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
                      className={`px-3 py-1 text-xs rounded ${
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
                const dayEvents = groupedEvents[dayKey] || [];
                
                if (dayEvents.length > 0) {
                  return (
                    <div className="flex justify-center mt-1">
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
                    </div>
                  );
                }
                return null;
              }
            }}
          />
          <div className="mt-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={showMyEvents}
                onChange={(e) => setShowMyEvents(e.target.checked)}
                className="form-checkbox text-blue-600"
              />
              <span className="ml-2 text-sm">My Events</span>
            </label>
            {groups.map((group) => (
              <div key={group.group_id} className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={visibleGroups.includes(group.group_id)}
                    onChange={() => toggleGroupVisibility(group.group_id)}
                    className="form-checkbox text-blue-600"
                  />
                  <span className="ml-2 text-sm">{group.group_name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white shadow rounded-lg p-4">
          <div className="flex justify-between mb-4">
            <button
              onClick={handleCreateEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <span className="text-lg">+</span>
              Create Event
            </button>
            
            <div className="flex gap-2">
              {isGoogleConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Google Calendar Connected</span>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (!token) return;
                      
                      try {
                        const res = await fetch("http://localhost:8000/auth/google/disconnect", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        
                        if (res.ok) {
                          setIsGoogleConnected(false);
                          setGoogleEvents([]);
                          console.log("Google Calendar disconnected successfully");
                        } else {
                          console.error("Failed to disconnect Google Calendar");
                        }
                      } catch (error) {
                        console.error("Error disconnecting Google Calendar:", error);
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Connect Google Calendar
                </button>
              )}
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
                  onClick={() => setSelectedDayForView(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>
              
              {(() => {
                const dayKey = format(selectedDayForView, "yyyy-MM-dd");
                const dayEvents = groupedEvents[dayKey] || [];
                
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
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
                      >
                        <span className="text-xs">+</span>
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
                                {event.source === 'google' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded flex-shrink-0">
                                    Google
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-1">
                                {format(new Date(event.start), "h:mm a")}
                                {event.end_time && (
                                  <span> - {format(new Date(event.end_time), "h:mm a")}</span>
                                )}
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

          {Object.keys(groupedEvents).length === 0 ? (
            <div>No events this year.</div>
          ) : (
            Object.entries(groupedEvents).map(([day, evts]) => (
              <div key={day} className="mb-4">
                <div className="schedule-date">
                  {format(new Date(day), "dd EEE MMM")}
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
                          {event.source === 'google' && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Google
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(event.start), "h:mm a")}
                          {event.end_time && (
                            <span> - {format(new Date(event.end_time), "h:mm a")}</span>
                          )}
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyCalendarPage;
