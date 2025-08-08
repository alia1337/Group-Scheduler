import React, { useState, useEffect } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

const FindFreeTime = ({ 
  groupId, 
  groupMembers = [], 
  onClose, 
  refreshEvents 
}) => {
  const [startTime, setStartTime] = useState("09:00"); // 9 AM default
  const [endTime, setEndTime] = useState("17:00"); // 5 PM default
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default
  const [minPeople, setMinPeople] = useState(2); // Start with default of 2
  const [minHours, setMinHours] = useState(1); // Minimum continuous hours
  const [continuous, setContinuous] = useState(false);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  React.useEffect(() => {
    if (groupMembers.length > 0) {
      const defaultMin = Math.max(2, Math.ceil(groupMembers.length / 2));
      if (minPeople > groupMembers.length) {
        setMinPeople(defaultMin);
      }
    }
  }, [groupMembers, minPeople]);

  React.useEffect(() => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    const maxHours = Math.floor(totalMinutes / 60);
    
    if (minHours > maxHours && maxHours > 0) {
      setMinHours(maxHours);
    }
  }, [startTime, endTime, minHours]);

  const daysOfWeek = [
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
    { value: 0, label: "Sunday", short: "Sun" }
  ];



  const getAvailability = React.useCallback(async (specificDays = null) => {
    const daysToFetch = specificDays || selectedDays;
    
    if (!groupId || daysToFetch.length === 0) {
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const requestBody = {
        start_time: startTime,
        end_time: endTime,
        days_of_week: daysToFetch,
        weeks_ahead: 4,
        min_continuous_hours: continuous ? minHours : null
      };
      
      const response = await fetch(`http://localhost:8000/groups/${groupId}/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (specificDays && calculated) {
          setAvailability(prev => ({ ...prev, ...data }));
        } else {
          setAvailability(data);
        }
        setCalculated(true);
      }
    } catch (error) {
    }
    setLoading(false);
  }, [groupId, selectedDays, startTime, endTime, continuous, minHours]);

  const toggleDay = (dayValue) => {
    const isCurrentlySelected = selectedDays.includes(dayValue);
    const newSelectedDays = isCurrentlySelected
      ? selectedDays.filter(d => d !== dayValue)
      : [...selectedDays, dayValue];
    
    setSelectedDays(newSelectedDays);
    
    if (!isCurrentlySelected && groupMembers.length > 0 && calculated) {
      getAvailability([dayValue]);
    }
  };

  const getAvailabilityColor = (date, availableCount) => {
    const totalMembers = groupMembers.length;
    const shortfall = minPeople - availableCount;
    
    if (availableCount >= minPeople) {
      return "bg-green-200 border-green-400 text-green-800";
    } else if (shortfall === 1) {
      return "bg-yellow-200 border-yellow-400 text-yellow-800";
    } else {
      return "bg-red-200 border-red-400 text-red-800";
    }
  };

  const generateCalendarWeeks = () => {
    const weeks = [];
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });

    for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
      const weekStart = addDays(startOfCurrentWeek, weekIndex * 7);
      const week = [];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = addDays(weekStart, dayIndex);
        const dayOfWeek = date.getDay();
        const dateStr = format(date, 'yyyy-MM-dd');
        const isSelected = selectedDays.includes(dayOfWeek);
        const availableCount = availability[dateStr] || 0;
        const isPast = dateStr < todayStr;
        
        week.push({
          date,
          dateStr,
          dayOfWeek,
          isSelected,
          availableCount,
          isPast,
          colorClass: isPast ? "bg-gray-50 border-gray-200" : 
                      (isSelected ? getAvailabilityColor(date, availableCount) : "bg-gray-100 text-gray-400")
        });
      }
      weeks.push(week);
    }
    return weeks;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Find Free Time</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="900"
                    className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="900"
                    className="border border-gray-300 rounded px-3 py-2 text-sm flex-1"
                  />
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum People
                  </label>
                  <input
                    type="number"
                    value={minPeople}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1) {
                        setMinPeople(value);
                      }
                    }}
                    min="1"
                    max={Math.max(groupMembers.length, 20)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                  />
                  {groupMembers.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      of {groupMembers.length} group members
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Continuous Time
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={continuous}
                        onChange={(e) => setContinuous(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Require continuous block</span>
                    </label>
                    {continuous && (
                      <select
                        value={minHours}
                        onChange={(e) => setMinHours(parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-full"
                      >
                        {(() => {
                          const [startHour, startMin] = startTime.split(':').map(Number);
                          const [endHour, endMin] = endTime.split(':').map(Number);
                          const startMinutes = startHour * 60 + startMin;
                          const endMinutes = endHour * 60 + endMin;
                          const totalMinutes = endMinutes - startMinutes;
                          const maxHours = Math.floor(totalMinutes / 60);
                          
                          return Array.from({ length: maxHours }, (_, i) => i + 1).map(hours => (
                            <option key={hours} value={hours}>
                              {hours} hour{hours !== 1 ? 's' : ''}
                            </option>
                          ));
                        })()}
                      </select>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedDays.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => getAvailability()}
                disabled={loading || selectedDays.length === 0 || groupMembers.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
              >
                {loading ? 'Calculating...' : 'Find Available Times'}
              </button>
              {groupMembers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Loading group members...</p>
              )}
            </div>
          </div>

          {Object.keys(availability).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Legend:</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                  <span>Available ({minPeople}+ people free)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                  <span>1 person short</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                  <span>2+ people short</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Not selected</span>
                </div>
              </div>
            </div>
          )}

          {Object.keys(availability).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Availability for {startTime} - {endTime}
                {continuous && (
                  <span className="text-sm text-gray-600 font-normal">
                    {' '}(requiring {minHours} continuous hour{minHours !== 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              
              {generateCalendarWeeks().map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-2">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`p-3 rounded-lg border-2 text-center transition-colors min-h-[100px] flex flex-col justify-center ${day.colorClass}`}
                    >
                      {!day.isPast ? (
                        <>
                          <div className="font-medium">
                            {daysOfWeek.find(d => d.value === day.dayOfWeek)?.short}
                          </div>
                          <div className="text-lg font-bold">
                            {format(day.date, 'd')}
                          </div>
                          <div className="text-xs">
                            {format(day.date, 'MMM')}
                          </div>
                          <div className="text-xs mt-1 font-medium h-4">
                            {day.isSelected && !day.isPast && day.availableCount !== undefined ? (
                              `${day.availableCount} free`
                            ) : ''}
                          </div>
                        </>
                      ) : (
                        <div className="h-16"></div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {Object.keys(availability).length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p>Click "Find Available Times" to see when your group members are free</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindFreeTime;