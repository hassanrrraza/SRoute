"use client";

import { Card } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime: Date;
}

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  // Get week start (Sunday) and dates
  const dayOfWeek = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
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

  const getDayEvents = (dayDate: Date) => {
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {/* Day headers */}
        {weekDays.map((day, idx) => (
          <div
            key={idx}
            className={`p-3 text-center font-semibold text-sm ${
              isToday(day) ? "bg-blue-100" : "bg-slate-100"
            }`}
          >
            <div className="text-xs text-slate-600">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
            </div>
            <div className={isToday(day) ? "text-blue-600" : ""}>{formatDateHeader(day)}</div>
          </div>
        ))}

        {/* Events */}
        {weekDays.map((day, idx) => {
          const dayEvents = getDayEvents(day);

          return (
            <div key={idx} className={`min-h-96 p-2 ${isToday(day) ? "bg-blue-50" : "bg-white"}`}>
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full text-left text-xs p-1.5 rounded text-white hover:opacity-80 transition-opacity block ${getTypeColor(
                      event.type
                    )}`}
                    title={event.title}
                  >
                    <div className="font-semibold truncate">{formatTime(new Date(event.startTime))}</div>
                    <div className="truncate">{event.title}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
