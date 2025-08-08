import React from "react";
import { 
  format, 
  startOfToday, 
  isWithinInterval, 
  addMonths, 
  addDays, 
  isSameDay, 
  isAfter, 
  isBefore 
} from "date-fns";

export const useEventFiltering = (events, options = {}) => {
  const {
    showMyEvents = true,
    visibleGroups = [],
    selectedGroupId = null,
    filterType = 'all' // 'personal', 'group', 'all'
  } = options;

  // ALL events from today onwards
  const today = startOfToday();
  const allEventsFromToday = React.useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return !isBefore(eventDate, today);
    });
  }, [events, today]);

  // Filter events based on type (personal, group, or all)
  const filteredEventsByType = React.useMemo(() => {
    return allEventsFromToday.filter((event) => {
      switch (filterType) {
        case 'personal':
          // Show Google Calendar events (they have google_event_id) and personal events
          if (event.google_event_id) return true;
          return event.group_id === null;
        
        case 'group':
          // For group calendars, show all events (the filtering is done by useGroupEvents)
          // This case is now handled by the unified system via useGroupEvents hook
          return true;
        
        case 'all':
        default:
          // Apply visibility settings for all events
          if (event.google_event_id) return true;
          if (!showMyEvents && event.group_id === null) return false;
          if (event.group_id && !visibleGroups.includes(event.group_id)) return false;
          return true;
      }
    });
  }, [allEventsFromToday, filterType, selectedGroupId, showMyEvents, visibleGroups]);

  // Get date range based on view filter
  const getDateRange = (viewFilter) => {
    const today = startOfToday();
    switch (viewFilter) {
      case 'today':
        return { start: today, end: addDays(today, 1) };
      case 'upcoming':
      default:
        return { start: addDays(today, 1), end: addMonths(today, 12) };
    }
  };

  // Filter events by date range
  const getEventsInRange = (viewFilter) => {
    const dateRange = getDateRange(viewFilter);
    return filteredEventsByType.filter((event) => {
      const eventDate = new Date(event.start);
      return isWithinInterval(eventDate, dateRange) || isSameDay(eventDate, dateRange.start);
    });
  };

  // Create events grouped by day for calendar display
  const calendarEvents = React.useMemo(() => {
    return filteredEventsByType.reduce((acc, event) => {
      const day = format(new Date(event.start), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {});
  }, [filteredEventsByType]);

  // Group events for list display
  const getGroupedEvents = (viewFilter) => {
    const eventsInRange = getEventsInRange(viewFilter);
    
    // Group by day for both today and upcoming views
    return eventsInRange.reduce((acc, event) => {
      const day = format(new Date(event.start), "yyyy-MM-dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    }, {});
  };

  // Get the optimal view filter based on available events
  const getOptimalViewFilter = () => {
    const today = startOfToday();
    
    // Check for today's events
    const todayEvents = filteredEventsByType.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, today);
    });
    
    // If there are events today, prefer today view
    if (todayEvents.length > 0) {
      return 'today';
    }
    
    // If no events today, check for upcoming events
    const upcomingEvents = filteredEventsByType.filter(event => {
      const eventDate = new Date(event.start);
      return isAfter(eventDate, today);
    });
    
    // Only switch to upcoming if there are actually upcoming events
    if (upcomingEvents.length > 0) {
      return 'upcoming';
    }
    
    // If no events at all, default to today view (don't force upcoming)
    return 'today';
  };

  // Check for today's events and suggest switching to upcoming if none
  const checkTodayEvents = (viewFilter, setViewFilter) => {
    if (viewFilter !== 'today') return;
    
    const optimalFilter = getOptimalViewFilter();
    if (optimalFilter !== viewFilter) {
      setViewFilter(optimalFilter);
    }
  };

  return {
    allEventsFromToday,
    filteredEventsByType,
    calendarEvents,
    getEventsInRange,
    getGroupedEvents,
    getOptimalViewFilter,
    checkTodayEvents
  };
};