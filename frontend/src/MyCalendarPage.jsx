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

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(false);
  const [joinKey, setJoinKey] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsCreator, setUserIsCreator] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const monthYearPickerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    if (!token) return;

    fetch(`${API_URL}/events`, {
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

    fetch(`${API_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // console.log("Groups data received:", data);
        setGroups(Array.isArray(data) ? data : []);
        setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
      })
      .catch((err) => {
        console.error("Failed to fetch groups", err);
        setGroups([]);
        setVisibleGroups([]);
      });

    // Check if Google Calendar is connected and fetch events
    fetch(`${API_URL}/me`, {
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
          fetch(`${API_URL}/auth/google/events`, {
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
        fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((userData) => {
            console.log("Updated user data after OAuth:", userData);
            if (userData.google_calendar_connected) {
              setIsGoogleConnected(true);
              // Fetch Google events
              fetch(`${API_URL}/auth/google/events`, {
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
      const res = await fetch(`${API_URL}/auth/google/login`, {
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

  const handleJoinGroup = async () => {
    const token = localStorage.getItem("token");
    if (!token || !joinKey.trim()) return;

    try {
      const res = await fetch(`${API_URL}/groups/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ join_key: joinKey.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setJoinMessage(`✅ ${data.message}`);
        setJoinKey("");
        // Refresh groups list
        fetch(`${API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            setGroups(Array.isArray(data) ? data : []);
            setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
          });
      } else {
        setJoinMessage(`❌ ${data.detail || "Failed to join group"}`);
      }
    } catch (error) {
      setJoinMessage("❌ Error joining group");
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

  const viewGroupMembers = async (groupId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // console.log("Group members data:", data);
        setGroupMembers(data.members);
        setUserIsAdmin(data.user_is_admin === 1 || data.user_is_admin === true);
        
        // Check if current user is the creator
        const currentGroup = groups.find(g => g.group_id === groupId);
        setUserIsCreator(currentGroup?.is_creator === 1);
        
        setSelectedGroupId(groupId);
        setShowMembersModal(true);
      } else {
        alert("Failed to fetch group members");
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      alert("Error fetching group members");
    }
  };

  const performAdminAction = async (userId, action) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/admin-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: selectedGroupId,
          user_id: userId,
          action: action,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Refresh the members list
        viewGroupMembers(selectedGroupId);
        // Refresh groups list to update admin status
        const token = localStorage.getItem("token");
        fetch(`${API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setGroups(data))
          .catch((err) => console.error("Error refreshing groups:", err));
      } else {
        alert(data.detail || "Action failed");
      }
    } catch (error) {
      console.error("Error performing admin action:", error);
      alert("Error performing action");
    }
  };

  const updateGroupName = async (groupId, newName) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}/name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Group name updated successfully!");
        setEditingGroupName(false);
        setNewGroupName("");
        // Refresh groups list
        const groupsRes = await fetch(`${API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      } else {
        alert(data.detail || "Failed to update group name");
      }
    } catch (error) {
      console.error("Error updating group name:", error);
      alert("Error updating group name");
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setShowMembersModal(false);
        // Refresh groups list
        const groupsRes = await fetch(`${API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
        setVisibleGroups(groupsData.map((g) => g.group_id));
        alert("Group deleted successfully!");
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Error deleting group");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6 px-4">
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm mb-6">
        <h1 className="text-2xl font-bold">Group Scheduler</h1>
        <nav className="space-x-6">
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
              <div key={group.group_id} className="mt-2 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={visibleGroups.includes(group.group_id)}
                      onChange={() => toggleGroupVisibility(group.group_id)}
                      className="form-checkbox text-blue-600"
                    />
                    <span className="ml-2 text-sm font-medium">{String(group.group_name || 'Unnamed Group').trim()}</span>
                    {group.is_admin === 1 && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Admin
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => viewGroupMembers(group.group_id)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    title="Group Settings"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                {/* Join Key */}
                {group.join_key && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-700">
                        <span className="font-medium">Join Key:</span>{" "}
                        <code className="bg-white px-2 py-1 rounded border text-sm font-mono">{group.join_key}</code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(group.join_key);
                          alert("Join key copied to clipboard!");
                        }}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Members List - Vertical Layout */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Members:</div>
                  <div className="space-y-1">
                    {group.members && group.members.map((member) => (
                      <div key={member.username} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {(member.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-800">{String(member.username || 'Unknown User').trim()}</span>
                        </div>
                        <div className="flex gap-1">
                          {member.is_creator === 1 && (
                            <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                              Creator
                            </span>
                          )}
                          {member.is_admin === 1 && member.is_creator !== 1 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                          {member.is_admin !== 1 && member.is_creator !== 1 && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-1 py-0.5 rounded">
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setShowJoinGroupModal(true)}
              className="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded text-sm"
            >
              Join Group by Key
            </button>
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
                        const res = await fetch(`${API_URL}/auth/google/disconnect`, {
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

      {/* Join Group Modal */}
      {showJoinGroupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Join Group</h3>
              <button
                onClick={() => {
                  setShowJoinGroupModal(false);
                  setJoinKey("");
                  setJoinMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Group Join Key
              </label>
              <input
                type="text"
                placeholder="e.g. ABC123XY"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={joinKey}
                onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask a group creator for their join key
              </p>
            </div>

            {joinMessage && (
              <div className="mb-4 p-3 rounded bg-gray-50 text-sm">
                {joinMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowJoinGroupModal(false);
                  setJoinKey("");
                  setJoinMessage("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={!joinKey.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
              >
                Join Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Settings Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Group Settings</h3>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setEditingGroupName(false);
                  setNewGroupName("");
                  setUserIsCreator(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Group Name Section */}
            {Boolean(userIsAdmin) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">Group Name</h4>
                  {!Boolean(editingGroupName) && (
                    <button
                      onClick={() => {
                        setEditingGroupName(true);
                        const currentGroup = groups.find(g => g.group_id === selectedGroupId);
                        setNewGroupName(currentGroup?.group_name || "");
                      }}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingGroupName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1 text-sm border border-gray-300 px-2 py-1 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter group name"
                    />
                    <button
                      onClick={() => updateGroupName(selectedGroupId, newGroupName)}
                      disabled={!newGroupName.trim()}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingGroupName(false);
                        setNewGroupName("");
                      }}
                      className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {groups.find(g => g.group_id === selectedGroupId)?.group_name || "Unnamed Group"}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {groupMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{member.username}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <div className="flex gap-1">
                      {Boolean(member.is_creator === 1) && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Creator
                        </span>
                      )}
                      {Boolean(member.is_admin === 1 && member.is_creator !== 1) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                      {Boolean(member.is_admin !== 1 && member.is_creator !== 1) && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          Member
                        </span>
                      )}
                    </div>
                  </div>

                  {Boolean(userIsAdmin && member.is_creator !== 1) && (
                    <div className="flex gap-2">
                      {member.is_admin !== 1 ? (
                        <button
                          onClick={() => performAdminAction(member.id, "promote")}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => performAdminAction(member.id, "demote")}
                          className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                        >
                          Remove Admin
                        </button>
                      )}
                      <button
                        onClick={() => performAdminAction(member.id, "kick")}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!Boolean(userIsAdmin) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only group admins can manage members. Contact an admin if you need to make changes.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {Boolean(userIsCreator) && (
                <button
                  onClick={() => deleteGroup(selectedGroupId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Group
                </button>
              )}
              <div className={Boolean(userIsCreator) ? "" : "ml-auto"}>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setUserIsCreator(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyCalendarPage;
