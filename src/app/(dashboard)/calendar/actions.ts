"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const createShiftSchema = z.object({
  driverId: z.string().min(1, "Driver is required"),
  title: z.string().min(1, "Title is required"),
  startTime: z.coerce.date("Start time is required"),
  endTime: z.coerce.date("End time is required"),
});

export async function getCalendarEvents(startDate: Date, endDate: Date) {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        relatedTrip: {
          include: {
            client: true,
            driver: true,
            vehicle: true,
          },
        },
        relatedDriver: true,
      },
      orderBy: { startTime: "asc" },
    });
    return events;
  } catch (error) {
    throw new Error("Failed to fetch calendar events");
  }
}

export async function createShift(data: z.infer<typeof createShiftSchema>) {
  try {
    const validated = createShiftSchema.parse(data);

    const shift = await prisma.calendarEvent.create({
      data: {
        title: validated.title,
        type: "SHIFT",
        startTime: validated.startTime,
        endTime: validated.endTime,
        relatedDriverId: validated.driverId,
      },
      include: {
        relatedDriver: true,
      },
    });

    revalidatePath("/calendar");
    return { success: true, shift };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to create shift" };
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    await prisma.calendarEvent.delete({
      where: { id },
    });

    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete event" };
  }
}

export async function getDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { name: "asc" },
    });
    return drivers;
  } catch (error) {
    throw new Error("Failed to fetch drivers");
  }
}
