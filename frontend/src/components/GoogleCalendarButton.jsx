import React from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

const GoogleCalendarButton = ({ refreshEvents }) => {
  const { isGoogleConnected, connectGoogle, disconnectGoogle, syncGoogleCalendar } = useGoogleAuth(refreshEvents);

  return (
    <div className="flex gap-2">
      {isGoogleConnected ? (
        <>
          <button
            onClick={disconnectGoogle}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium rounded flex items-center gap-2"
          >
            <span className="text-xs">✓</span>
            Google Calendar
          </button>
          <button
            onClick={syncGoogleCalendar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium rounded"
            title="Sync Google Calendar"
          >
            Sync
          </button>
        </>
      ) : (
        <button
          onClick={connectGoogle}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium rounded"
        >
          Connect Google Calendar
        </button>
      )}
    </div>
  );
};

export default GoogleCalendarButton;