import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EventLegend from "./EventLegend";

const CalendarView = ({ 
  currentDate, 
  setCurrentDate, 
  selectedCalendarDay, 
  setSelectedCalendarDay,
  selectedDayForView,
  setSelectedDayForView,
  calendarEvents,
  onAddEvent,
  showSettings = false,
  isGoogleConnected = false,
  showLegend = false,
  legendOptions = {}
}) => {
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const monthYearPickerRef = useRef(null);

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

  const handleCalendarChange = (date) => {
    console.log("Calendar change:", format(date, "yyyy-MM-dd"));
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

  return (
    <div className="bg-white shadow rounded-lg p-4" style={{ minHeight: '400px', height: 'fit-content' }}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={handlePrevMonth} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-sm font-medium rounded flex-shrink-0"
          >
            ‹ Prev
          </button>
          
          <button 
            onClick={toggleMonthYearPicker}
            className="text-lg font-semibold text-gray-800 hover:bg-gray-100 px-3 py-1 rounded cursor-pointer flex-1 text-center whitespace-nowrap overflow-hidden"
          >
            {format(currentDate, "MMMM yyyy")}
          </button>
          
          <button 
            onClick={handleNextMonth} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 text-sm font-medium rounded flex-shrink-0"
          >
            Next ›
          </button>
        </div>

        {/* Month/Year Picker Modal */}
        {showMonthYearPicker && (
          <div 
            ref={monthYearPickerRef}
            className="absolute top-12 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl z-20 p-4 mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Select Month & Year</h3>
              <button 
                onClick={() => setShowMonthYearPicker(false)}
                className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            {/* Year Selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                  className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                >
                  ← {currentDate.getFullYear() - 1}
                </button>
                <span className="font-semibold text-gray-800">{currentDate.getFullYear()}</span>
                <button 
                  onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                  className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
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
                  className={`px-3 py-2 text-sm font-medium rounded ${
                    currentDate.getMonth() === index 
                      ? 'bg-blue-600 text-white font-semibold' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
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
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar using react-calendar */}
      <div className="react-calendar-wrapper" style={{ width: '100%' }}>
        <Calendar
          onChange={handleCalendarChange}
          value={selectedCalendarDay}
          activeStartDate={currentDate}
          onActiveStartDateChange={({ activeStartDate }) => setCurrentDate(activeStartDate)}
          tileContent={({ date }) => {
            const dayKey = format(date, "yyyy-MM-dd");
            const dayEvents = calendarEvents[dayKey] || [];
            
            if (dayEvents.length === 0) return null;
            
            return (
              <div className="event-dots">
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className="event-dot"
                    style={{
                      backgroundColor: event.google_event_id ? '#4285f4' : event.group_id ? '#34a853' : '#ea4335',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      display: 'inline-block',
                      marginRight: '2px'
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: '10px', color: '#666' }}>+{dayEvents.length - 3}</span>
                )}
              </div>
            );
          }}
          showNeighboringMonth={false}
          showNavigation={false}
        />
      </div>
      
      {/* Calendar Settings (only shown for Personal Calendar) */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Calendar Settings</h3>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              <span className="font-medium">View:</span> Personal Events Only
            </div>
            {isGoogleConnected && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Google Calendar:</span> Connected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Legend (optional) */}
      {showLegend && <EventLegend {...legendOptions} />}
    </div>
  );
};

export default CalendarView;