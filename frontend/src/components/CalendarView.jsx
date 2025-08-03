import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
  isGoogleConnected = false
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

  const handleDayClick = (date) => {
    console.log("Day clicked:", format(date, "yyyy-MM-dd"));
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
    <div className="bg-white shadow rounded-lg p-4 relative">
      <div className="flex justify-between items-center mb-2">
        <button onClick={handlePrevMonth} className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">&laquo;</button>
        <button 
          onClick={toggleMonthYearPicker}
          className="text-lg font-semibold hover:bg-gray-100 px-3 py-1 rounded cursor-pointer"
        >
          {format(currentDate, "MMMM yyyy")}
        </button>
        <button onClick={handleNextMonth} className="px-3 py-2 text-sm font-medium hover:bg-gray-100 rounded">&raquo;</button>
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
              className="px-2 py-1 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          
          {/* Year Selection */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <button 
                onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              >
                ← {currentDate.getFullYear() - 1}
              </button>
              <span className="font-semibold">{currentDate.getFullYear()}</span>
              <button 
                onClick={() => handleMonthYearSelect(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                className="px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
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
                className={`px-3 py-2 text-sm font-medium rounded hover:bg-blue-50 ${
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
                  className={`px-3 py-2 text-sm font-medium rounded ${
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
            const dayEvents = calendarEvents[dayKey] || [];
            console.log(`📅 Calendar tile for ${dayKey}: ${dayEvents.length} events`);
            
            if (dayEvents.length > 0) {
              return (
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
              );
            }
            return null;
          }
        }}
      />
      
      {/* Calendar Settings (only shown for Personal Calendar) */}
      {showSettings && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Calendar Settings</h3>
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              <span className="font-medium">View:</span> Personal Events Only
            </div>
            {isGoogleConnected && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Google Calendar:</span> Connected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;