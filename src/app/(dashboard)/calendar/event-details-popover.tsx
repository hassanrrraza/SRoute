"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { deleteCalendarEvent } from "./actions";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  startTime: Date;
  endTime: Date;
  relatedTrip?: {
    id: string;
    pickupAddress: string;
    dropoffAddress: string;
    client?: { name: string };
    driver?: { name: string };
    vehicle?: { plate: string };
  };
  relatedDriver?: {
    name: string;
  };
}

interface EventDetailsPopoverProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

export function EventDetailsPopover({
  event,
  open,
  onOpenChange,
  onDelete,
}: EventDetailsPopoverProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCalendarEvent(event.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event deleted");
        onOpenChange(false);
        onDelete();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverContent className="w-80" side="right">
        <div className="space-y-4">
          {/* Event Type & Title */}
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded ${
                  event.type === "TRIP"
                    ? "bg-blue-500"
                    : event.type === "SHIFT"
                    ? "bg-purple-500"
                    : "bg-orange-500"
                }`}
              ></div>
              <span className="text-xs font-semibold text-slate-600">
                {event.type}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {event.title}
            </h3>
          </div>

          {/* Time */}
          <div>
            <p className="text-sm text-slate-600">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </p>
            <p className="text-xs text-slate-500">
              {formatDateTime(event.startTime)}
            </p>
          </div>

          {/* Trip Details */}
          {event.type === "TRIP" && event.relatedTrip && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-600">Client</p>
                <p className="text-sm text-slate-900">{event.relatedTrip.client?.name}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600">Route</p>
                <p className="text-sm text-slate-900">
                  {event.relatedTrip.pickupAddress?.split(",")[0]}
                </p>
                <p className="text-xs text-slate-500">→</p>
                <p className="text-sm text-slate-900">
                  {event.relatedTrip.dropoffAddress?.split(",")[0]}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">Driver</p>
                  <p className="text-sm text-slate-900">
                    {event.relatedTrip.driver?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600">Vehicle</p>
                  <p className="text-sm text-slate-900">
                    {event.relatedTrip.vehicle?.plate || "-"}
                  </p>
                </div>
              </div>

              {/* Link to trip */}
              <Link href={`/trips`} onClick={() => onOpenChange(false)}>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Trip Details
                </Button>
              </Link>
            </div>
          )}

          {/* Shift Details */}
          {event.type === "SHIFT" && event.relatedDriver && (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-600">Driver</p>
              <p className="text-sm text-slate-900">{event.relatedDriver.name}</p>
            </div>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Deleting..." : "Delete Event"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
