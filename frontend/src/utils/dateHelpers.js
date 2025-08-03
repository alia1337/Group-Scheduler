import { format } from "date-fns";

// Helper function to format date with ordinal numbers (1st, 2nd, 3rd, etc.)
export const formatDateWithOrdinal = (date) => {
  const day = date.getDate();
  const ordinal = (n) => {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  };
  
  const weekday = format(date, "EEE");
  const month = format(date, "MMM");
  const dayWithOrdinal = ordinal(day);
  
  return `${weekday}, ${dayWithOrdinal} ${month}`;
};

// Helper function to format time range intelligently
export const formatTimeRange = (startTime, endTime) => {
  const startFormatted = format(new Date(startTime), "h:mm a");
  
  if (!endTime) {
    return startFormatted;
  }
  
  const endFormatted = format(new Date(endTime), "h:mm a");
  
  // If start and end times are the same, show only once
  if (startFormatted === endFormatted) {
    return startFormatted;
  }
  
  // Otherwise show as a range
  return `${startFormatted} - ${endFormatted}`;
};

// Format date for display in different contexts
export const formatDisplayDate = (date, formatString = "yyyy-MM-dd") => {
  return format(new Date(date), formatString);
};

// Check if two dates are the same day
export const isSameDate = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Get date range for filtering
export const getDateRange = (filterType, baseDate = new Date()) => {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  
  switch (filterType) {
    case 'today':
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      return { start: today, end: endOfToday };
    
    case 'upcoming':
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return { start: today, end: nextYear };
    
    case 'week':
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      return { start: today, end: endOfWeek };
    
    case 'month':
      const endOfMonth = new Date(today);
      endOfMonth.setMonth(today.getMonth() + 1);
      return { start: today, end: endOfMonth };
    
    default:
      return { start: today, end: today };
  }
};

// Parse ISO date string to local date
export const parseISOToLocal = (isoString) => {
  return new Date(isoString);
};

// Format date for API submission
export const formatForAPI = (date, time = null) => {
  if (time) {
    return new Date(`${date}T${time}`).toISOString();
  }
  return new Date(date).toISOString();
};