import React from "react";

const EventLegend = ({ showGoogleEvents = true, showGroupEvents = true, showPersonalEvents = true }) => {
  const legendItems = [];

  if (showGoogleEvents) {
    legendItems.push({
      color: '#4285f4',
      label: 'Google Calendar Events'
    });
  }

  if (showGroupEvents) {
    legendItems.push({
      color: '#34a853',
      label: 'Group Events'
    });
  }

  if (showPersonalEvents) {
    legendItems.push({
      color: '#ea4335',
      label: 'Personal Events'
    });
  }

  if (legendItems.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Event Key</h3>
      <div className="space-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventLegend;