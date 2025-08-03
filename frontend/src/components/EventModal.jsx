import React from "react";

const EventModal = ({
  showPopup,
  setShowPopup,
  newEvent,
  setNewEvent,
  onSubmit
}) => {
  const resetForm = () => {
    setNewEvent({ 
      title: "", 
      date: "", 
      start_time: "", 
      end_time: "", 
      location: "", 
      color: "#1a73e8", 
      friend_emails: "" 
    });
  };

  const handleClose = () => {
    setShowPopup(false);
    resetForm();
  };

  if (!showPopup) return null;

  return (
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
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-medium rounded-lg"
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;