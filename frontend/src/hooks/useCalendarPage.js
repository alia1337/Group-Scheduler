import React, { useState } from "react";
import { useEventCreation } from "./useEventCreation";
import { useEventFiltering } from "./useEventFiltering";
import { useGroupEvents } from "./useGroupEvents";

export const useCalendarPage = (events, addEvent, filteringOptions = {}) => {
  // Shared state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForView, setSelectedDayForView] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [viewFilter, setViewFilter] = useState('today');

  // Extract selectedGroupId from filtering options
  const { selectedGroupId, ...otherFilteringOptions } = filteringOptions;

  // Group events hook - only fetch if we have a specific group selected
  const { groupEvents, loading: groupEventsLoading } = useGroupEvents(selectedGroupId);

  // Determine which events to use based on whether we're viewing a specific group
  const eventsToFilter = selectedGroupId ? groupEvents : events;

  // Event creation hook
  const { 
    showPopup, 
    setShowPopup, 
    newEvent, 
    setNewEvent, 
    handleCreateEvent, 
    handleSubmit 
  } = useEventCreation(addEvent, selectedGroupId);

  // Event filtering hook
  const { calendarEvents, getGroupedEvents, getOptimalViewFilter } = useEventFiltering(eventsToFilter, {
    ...otherFilteringOptions,
    // For group-specific views, use 'all' filter type since useGroupEvents already filtered correctly
    filterType: selectedGroupId ? 'all' : otherFilteringOptions.filterType
  });

  // Get grouped events for current view
  const groupedEvents = getGroupedEvents(viewFilter);

  // Removed automatic view switching - let users manually choose their view
  // The auto-switching was confusing and switching too frequently

  return {
    // State
    currentDate,
    setCurrentDate,
    selectedDayForView,
    setSelectedDayForView,
    selectedCalendarDay,
    setSelectedCalendarDay,
    viewFilter,
    setViewFilter,
    
    // Event creation
    showPopup,
    setShowPopup,
    newEvent,
    setNewEvent,
    handleCreateEvent,
    handleSubmit,
    
    // Event data
    calendarEvents,
    groupedEvents,
    
    // Group-specific data
    groupEventsLoading,
    isGroupView: !!selectedGroupId
  };
};