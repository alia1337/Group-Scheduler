// src/MyScheduleView.jsx
import React from 'react';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./google-style-agenda.css";

function MyScheduleView({ events, date, length, localizer, accessors }) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + (length || 30));

  const eventsInRange = events.filter(event => {
    const evStart = accessors.start(event);
    const evEnd = accessors.end(event);
    return evStart < endDate && evEnd >= startDate;
  });

  eventsInRange.sort((a, b) => +accessors.start(a) - +accessors.start(b));

  const days = [];
  for (let cur = new Date(startDate); cur < endDate; cur.setDate(cur.getDate() + 1)) {
    days.push(new Date(cur));
  }

  return (
    <div className="rbc-agenda-content px-4 py-2">
      {eventsInRange.length === 0 && (
        <div className="no-events">
          {localizer.messages?.noEventsInRange || 'No events in this range.'}
        </div>
      )}

      {days.map(day => {
        const dayEvents = eventsInRange.filter(event => {
          const evStart = accessors.start(event);
          const evEnd = accessors.end(event);
          return (
            evStart <= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999) &&
            evEnd >= new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0)
          );
        });

        if (dayEvents.length === 0) return null;

        return (
          <div key={+day} className="mb-4">
            <div className="schedule-date">
              {localizer.format(day, 'agendaDateFormat')}
            </div>
            <div className="border-b border-gray-200 mb-2" />

            <ul className="schedule-list">
              {dayEvents.map((event, idx) => {
                const title = accessors.title(event);
                const desc = event.description || event.desc || '';
                const calendarName = event.calendarName || event.calendar || '';
                const start = accessors.start(event);
                const end = accessors.end(event);
                const allDay = accessors.allDay ? accessors.allDay(event) : event.allDay;

                let timeLabel = '';
                if (allDay) {
                  timeLabel = 'All day';
                } else if (start && end && start.toDateString() === end.toDateString()) {
                  const fmt = { hour: 'numeric', minute: 'numeric', hour12: true };
                  timeLabel = `${new Intl.DateTimeFormat('default', fmt).format(start)} – ${new Intl.DateTimeFormat('default', fmt).format(end)}`;
                } else {
                  const fmtDateTime = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
                  timeLabel = `${new Intl.DateTimeFormat('default', fmtDateTime).format(start)} – ${new Intl.DateTimeFormat('default', fmtDateTime).format(end)}`;
                }

                return (
                  <li key={idx} className="rbc-agenda-event-cell">
                    <span className="event-dot" style={{ backgroundColor: event.color }}></span>
                    <div className="content">
                      <div className="title font-medium text-gray-900">{title}</div>
                      {desc && <div className="desc text-gray-600 text-sm">{desc}</div>}
                      {calendarName && <div className="calendar text-gray-500 italic text-sm">{calendarName}</div>}
                      <div className="text-sm text-gray-500">{timeLabel}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

MyScheduleView.range = (start, { length = 30 }) => {
  const end = new Date(start);
  end.setDate(end.getDate() + length);
  return { start, end };
};

MyScheduleView.navigate = (date, action, { length = 30 }) => {
  const next = new Date(date);
  switch (action) {
    case 'PREV':
    case 'PREVIOUS':
      next.setDate(next.getDate() - length);
      return next;
    case 'NEXT':
      next.setDate(next.getDate() + length);
      return next;
    default:
      return date;
  }
};

MyScheduleView.title = (start, { length = 30, localizer }) => {
  const end = new Date(start);
  end.setDate(end.getDate() + length);
  return localizer.format({ start, end }, 'agendaHeaderFormat');
};

export default MyScheduleView;
