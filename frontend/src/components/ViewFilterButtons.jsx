import React from "react";

const ViewFilterButtons = ({ viewFilter, setViewFilter }) => {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
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
  );
};

export default ViewFilterButtons;