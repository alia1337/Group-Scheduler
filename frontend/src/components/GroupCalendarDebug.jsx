import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";

const GroupCalendarDebug = ({ selectedGroupId }) => {
  const [debugInfo, setDebugInfo] = useState("");
  const { fetchGroupEvents } = useApp();

  const runDebugTest = async () => {
    let info = `=== Group Calendar Debug ===\n`;
    info += `Selected Group ID: ${selectedGroupId}\n`;
    info += `Type: ${typeof selectedGroupId}\n`;
    
    if (!selectedGroupId) {
      info += `❌ No group ID provided\n`;
      setDebugInfo(info);
      return;
    }

    try {
      info += `🔍 Testing group events endpoint...\n`;
      const events = await fetchGroupEvents(selectedGroupId);
      info += `✅ Endpoint responded successfully\n`;
      info += `📊 Events returned: ${events.length}\n`;
      
      if (events.length > 0) {
        info += `\n📋 Event Details:\n`;
        events.forEach((event, idx) => {
          info += `  ${idx + 1}. ${event.title} (User: ${event.creator_username || event.user_id})\n`;
        });
      } else {
        info += `ℹ️ No events found for this group\n`;
        info += `\nPossible reasons:\n`;
        info += `• Group has no members with events\n`;
        info += `• Events weren't synced when joining\n`;
        info += `• Database query issue\n`;
      }
    } catch (error) {
      info += `❌ Error: ${error.message}\n`;
    }

    setDebugInfo(info);
  };

  if (!selectedGroupId) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4">
        <h3 className="font-bold text-yellow-800">Debug Info</h3>
        <p className="text-yellow-700">No group selected - viewing all events</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-300 rounded p-4 mb-4">
      <h3 className="font-bold text-blue-800 mb-2">Group Calendar Debug</h3>
      <button 
        onClick={runDebugTest}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm mb-2"
      >
        Run Debug Test
      </button>
      {debugInfo && (
        <pre className="text-xs text-blue-700 bg-white p-2 rounded border mt-2 whitespace-pre-wrap">
          {debugInfo}
        </pre>
      )}
    </div>
  );
};

export default GroupCalendarDebug;