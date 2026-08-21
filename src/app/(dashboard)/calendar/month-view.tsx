"use client";

import { Card } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime: Date;
}

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create calendar grid
  const calendarDays: (number | null)[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push(null);
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Next month days
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push(null);
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "TRIP":
        return "bg-blue-500";
      case "SHIFT":
        return "bg-purple-500";
      case "MAINTENANCE":
        return "bg-orange-500";
      default:
        return "bg-slate-500";
    }
  };

  const getDayEvents = (day: number | null) => {
    if (!day) return [];

    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(dayDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === dayDate.getTime();
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-slate-100 p-3 text-center font-semibold text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          const dayEvents = day ? getDayEvents(day) : [];
          const isCurrentMonth = day !== null;

          return (
            <div
              key={idx}
              className={`min-h-32 p-2 ${
                isCurrentMonth ? "bg-white" : "bg-slate-50"
              } ${isToday(day) ? "bg-blue-50" : ""}`}
            >
              <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? "text-slate-400" : ""}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full text-left text-xs p-1 rounded text-white truncate hover:opacity-80 transition-opacity ${getTypeColor(
                      event.type
                    )}`}
                    title={`${event.title} - ${formatTime(new Date(event.startTime))}`}
                  >
                    {formatTime(new Date(event.startTime))} {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-500 px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
