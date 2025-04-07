import React, { useEffect, useState } from "react";
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
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    color: "#1a73e8",
    friend_emails: "",
  });
  const [username, setUsername] = useState("");
  const [showMyEvents, setShowMyEvents] = useState(true);
  const [groups, setGroups] = useState([]);
  const [visibleGroups, setVisibleGroups] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
    if (!token) return;

    fetch("http://127.0.0.1:8000/events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Failed to fetch events", err));

    fetch("http://127.0.0.1:8000/groups", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setGroups(Array.isArray(data) ? data : []);
        setVisibleGroups(Array.isArray(data) ? data.map((g) => g.group_id) : []);
      })
      .catch((err) => console.error("Failed to fetch groups", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setShowPopup(true);
  };

  const handlePopupSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const eventStart = new Date(
      `${format(selectedDate, "yyyy-MM-dd")}T${newEvent.time || "09:00"}`
    );

    const meRes = await fetch("http://127.0.0.1:8000/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await meRes.json();

    const payload = {
      title: newEvent.title,
      start: eventStart,
      color: newEvent.color,
      user_id: user.id,
      friend_emails: newEvent.friend_emails.split(",").map((email) => email.trim()),
    };

    const res = await fetch("http://127.0.0.1:8000/events", {
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
      setNewEvent({ title: "", time: "", color: "#1a73e8", friend_emails: "" });
    }
  };

  const handleConnectGoogle = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/google/login", {
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

  const today = startOfToday();
  const end = endOfYear(today);

  const eventsThisYear = events.filter((event) => {
    const eventDate = new Date(event.start);
    return isWithinInterval(eventDate, { start: today, end });
  });

  const filteredEvents = eventsThisYear.filter((event) => {
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
          <a href="#" className="hover:underline font-medium">
            New Group
          </a>
          <a href="#" className="hover:underline font-medium">
            New Event
          </a>
          {username && <span className="text-gray-600">Welcome {username}</span>}
          <button onClick={handleLogout} className="ml-4 text-red-600 hover:underline">
            Logout
          </button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <button onClick={handlePrevMonth}>&laquo;</button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button onClick={handleNextMonth}>&raquo;</button>
          </div>
          <Calendar
            value={currentDate}
            onClickDay={handleDayClick}
            onActiveStartDateChange={({ activeStartDate }) =>
              setCurrentDate(activeStartDate)
            }
            showNavigation={false}
            showNeighboringMonth={false}
            tileContent={({ date, view }) => {
              if (view === "month") {
                const dayKey = format(date, "yyyy-MM-dd");
                const dayEvents = groupedEvents[dayKey] || [];
                return dayEvents.length > 0 ? (
                  <div
                    className="dot"
                    style={{ backgroundColor: dayEvents[0].color }}
                  ></div>
                ) : null;
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
          <div className="flex justify-end mb-4 gap-2">
            <button
              onClick={handleConnectGoogle}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Connect Google Calendar
            </button>
          </div>

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
                        <div className="title font-medium text-gray-900">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(event.start), "h:mm a")}
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
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-2">Add Event</h3>
            <p className="text-sm text-gray-600 mb-4">
              {format(selectedDate, "eeee, MMMM d")}
            </p>
            <input
              type="text"
              placeholder="Event Title"
              className="w-full mb-2 border px-2 py-1 rounded"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />
            <input
              type="time"
              className="w-full mb-2 border px-2 py-1 rounded"
              value={newEvent.time}
              onChange={(e) =>
                setNewEvent({ ...newEvent, time: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Friend Emails (comma-separated)"
              className="w-full mb-2 border px-2 py-1 rounded"
              value={newEvent.friend_emails}
              onChange={(e) =>
                setNewEvent({ ...newEvent, friend_emails: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handlePopupSubmit}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCalendarPage;
