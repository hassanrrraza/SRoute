"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { getCalendarEvents } from "./actions";
import { AddShiftDialog } from "./add-shift-dialog";
import { EventDetailsPopover } from "./event-details-popover";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { EmptyState } from "@/components/shared/empty-state";
import { CalendarSkeleton } from "@/components/shared/skeletons";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime: Date;
  relatedTrip?: any;
  relatedDriver?: any;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get date range based on view mode
      let startDate: Date;
      let endDate: Date;

      if (viewMode === "month") {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      } else {
        // Week view
        const dayOfWeek = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      }

      const result = await getCalendarEvents(startDate, endDate);
      setEvents(result as CalendarEvent[]);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
            <p className="text-slate-500 mt-1">View trips and driver shifts</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2 self-start">
            <Plus className="w-4 h-4" />
            Add Shift
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-600">Trip</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-slate-600">Shift</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-slate-600">Maintenance</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setViewMode("month")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === "month"
                ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              viewMode === "week"
                ? "text-blue-600 border-b-2 border-blue-600 -mb-px"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Week
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{monthName}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <>
            {events.length === 0 && (
              <div className="border border-slate-200 rounded-lg bg-white">
                <EmptyState
                  icon={CalendarDays}
                  title="No trips or shifts this period"
                  description="Scheduled trips appear automatically. Add a driver shift to block time on the calendar."
                  action={
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add a shift
                    </Button>
                  }
                  compact
                />
              </div>
            )}
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
            {viewMode === "month" ? (
              <MonthView
                currentDate={currentDate}
                events={events}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setPopoverOpen(true);
                }}
              />
            ) : (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventClick={(event) => {
                  setSelectedEvent(event);
                  setPopoverOpen(true);
                }}
              />
            )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Shift Dialog */}
      <AddShiftDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onShiftAdded={() => {
          setIsDialogOpen(false);
          loadEvents();
        }}
      />

      {/* Event Details Popover */}
      {selectedEvent && (
        <EventDetailsPopover
          event={selectedEvent}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          onDelete={() => {
            setPopoverOpen(false);
            loadEvents();
          }}
        />
      )}
    </DashboardLayout>
  );
}
