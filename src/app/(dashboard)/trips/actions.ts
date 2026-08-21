"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const createTripSchema = z.object({
  pickupAddress: z.string().min(1, "Pickup address is required"),
  dropoffAddress: z.string().min(1, "Dropoff address is required"),
  scheduledTime: z.coerce.date("Scheduled time is required"),
  clientId: z.string().min(1, "Client is required"),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  fare: z.coerce.number().positive("Fare must be positive"),
  status: z.enum(["SCHEDULED", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

const updateTripSchema = createTripSchema.extend({
  id: z.string(),
});

export async function createTrip(data: z.infer<typeof createTripSchema>) {
  try {
    const validated = createTripSchema.parse(data);

    // If driver assigned, set to ON_TRIP
    if (validated.driverId) {
      await prisma.driver.update({
        where: { id: validated.driverId },
        data: { status: "ON_TRIP" },
      });
    }

    const trip = await prisma.trip.create({
      data: {
        pickupAddress: validated.pickupAddress,
        dropoffAddress: validated.dropoffAddress,
        scheduledTime: validated.scheduledTime,
        clientId: validated.clientId,
        driverId: validated.driverId as any,
        vehicleId: validated.vehicleId as any,
        fare: validated.fare,
        status: validated.status,
      } as any,
      include: { client: true, driver: true, vehicle: true },
    });

    revalidatePath("/trips");
    revalidatePath("/dispatch");
    revalidatePath("/dashboard");
    return { success: true, trip };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to create trip" };
  }
}

export async function updateTrip(data: z.infer<typeof updateTripSchema>) {
  try {
    const validated = updateTripSchema.parse(data);
    const { id, ...updatePayload } = validated;

    const oldTrip = await prisma.trip.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!oldTrip) {
      return { error: "Trip not found" };
    }

    // If trip is being completed
    if (updatePayload.status === "COMPLETED" && oldTrip.status !== "COMPLETED") {
      if (oldTrip.driverId) {
        const otherTrips = await prisma.trip.count({
          where: {
            driverId: oldTrip.driverId,
            status: "IN_PROGRESS",
            id: { not: id },
          },
        });

        if (otherTrips === 0) {
          await prisma.driver.update({
            where: { id: oldTrip.driverId },
            data: { status: "AVAILABLE" },
          });
        }
      }
    }

    // If driver is being assigned/changed
    if (updatePayload.driverId && updatePayload.driverId !== oldTrip.driverId) {
      if (oldTrip.driverId && oldTrip.status === "SCHEDULED") {
        const otherTrips = await prisma.trip.count({
          where: {
            driverId: oldTrip.driverId,
            status: { in: ["DISPATCHED", "IN_PROGRESS"] },
          },
        });

        if (otherTrips === 0) {
          await prisma.driver.update({
            where: { id: oldTrip.driverId },
            data: { status: "AVAILABLE" },
          });
        }
      }

      if (updatePayload.status !== "COMPLETED" && updatePayload.status !== "CANCELLED") {
        await prisma.driver.update({
          where: { id: updatePayload.driverId },
          data: { status: "ON_TRIP" },
        });
      }
    }

    const updateData: any = {
      pickupAddress: updatePayload.pickupAddress,
      dropoffAddress: updatePayload.dropoffAddress,
      scheduledTime: updatePayload.scheduledTime,
      clientId: updatePayload.clientId,
      fare: updatePayload.fare,
      status: updatePayload.status,
    };

    if (updatePayload.driverId) {
      updateData.driverId = updatePayload.driverId;
    } else {
      updateData.driverId = null;
    }

    if (updatePayload.vehicleId) {
      updateData.vehicleId = updatePayload.vehicleId;
    } else {
      updateData.vehicleId = null;
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: updateData,
      include: { client: true, driver: true, vehicle: true },
    });

    // Update calendar event if scheduled time changed
    if (updatePayload.scheduledTime.getTime() !== oldTrip.scheduledTime.getTime()) {
      await prisma.calendarEvent.updateMany({
        where: { relatedTripId: id },
        data: { startTime: updatePayload.scheduledTime },
      });
    }

    revalidatePath("/trips");
    revalidatePath("/dispatch");
    revalidatePath("/dashboard");
    revalidatePath("/drivers");
    revalidatePath("/calendar");
    return { success: true, trip };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to update trip" };
  }
}

export async function deleteTrip(id: string) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { _count: { select: { invoices: true } } },
    });

    if (!trip) {
      return { error: "Trip not found" };
    }

    if (trip._count.invoices > 0) {
      return {
        error: "Cannot delete trip with associated invoices. Delete the invoice(s) first.",
      };
    }

    // Reset driver status if needed
    if (trip.driverId) {
      const otherTrips = await prisma.trip.count({
        where: {
          driverId: trip.driverId,
          status: { in: ["DISPATCHED", "IN_PROGRESS"] },
        },
      });

      if (otherTrips === 0) {
        await prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    // Delete related calendar event first
    await prisma.calendarEvent.deleteMany({
      where: { relatedTripId: id },
    });

    await prisma.trip.delete({
      where: { id },
    });

    revalidatePath("/trips");
    revalidatePath("/dispatch");
    revalidatePath("/dashboard");
    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete trip" };
  }
}

export async function getTrips() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        client: true,
        driver: true,
        vehicle: true,
        invoices: true,
      },
      orderBy: { scheduledTime: "desc" },
    });
    return trips;
  } catch (error) {
    throw new Error("Failed to fetch trips");
  }
}

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
    });
    return clients;
  } catch (error) {
    throw new Error("Failed to fetch clients");
  }
}

export async function getAvailableDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { name: "asc" },
    });
    return drivers;
  } catch (error) {
    throw new Error("Failed to fetch drivers");
  }
}

export async function getAllDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { name: "asc" },
    });
    return drivers;
  } catch (error) {
    throw new Error("Failed to fetch drivers");
  }
}

export async function getActiveVehicles() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      orderBy: { plate: "asc" },
    });
    return vehicles;
  } catch (error) {
    throw new Error("Failed to fetch vehicles");
  }
}

export async function getAllVehicles() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { plate: "asc" },
    });
    return vehicles;
  } catch (error) {
    throw new Error("Failed to fetch vehicles");
  }
}
