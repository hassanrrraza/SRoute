"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY"]),
  hourlyRate: z.coerce.number().positive("Hourly rate must be positive"),
  assignedVehicleId: z.string().optional().nullable(),
});

const updateDriverSchema = createDriverSchema.extend({
  id: z.string(),
});

export async function createDriver(
  data: z.infer<typeof createDriverSchema>
) {
  try {
    const validated = createDriverSchema.parse(data);

    // Check if license number already exists
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: validated.licenseNumber },
    });

    if (existing) {
      return {
        error: "A driver with this license number already exists",
      };
    }

    // If assigning a vehicle, clear previous assignment
    if (validated.assignedVehicleId) {
      await prisma.driver.updateMany({
        where: { assignedVehicleId: validated.assignedVehicleId },
        data: { assignedVehicleId: null },
      });
    }

    const driver = await prisma.driver.create({
      data: validated,
    });

    revalidatePath("/drivers");
    return { success: true, driver };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to create driver" };
  }
}

export async function updateDriver(
  data: z.infer<typeof updateDriverSchema>
) {
  try {
    const validated = updateDriverSchema.parse(data);
    const { id, ...updateData } = validated;

    // Check if license number is taken by another driver
    const existing = await prisma.driver.findFirst({
      where: {
        licenseNumber: updateData.licenseNumber,
        id: { not: id },
      },
    });

    if (existing) {
      return {
        error: "A driver with this license number already exists",
      };
    }

    // If assigning a vehicle, clear previous assignment
    if (updateData.assignedVehicleId) {
      await prisma.driver.updateMany({
        where: {
          assignedVehicleId: updateData.assignedVehicleId,
          id: { not: id },
        },
        data: { assignedVehicleId: null },
      });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/drivers");
    return { success: true, driver };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to update driver" };
  }
}

export async function deleteDriver(id: string) {
  try {
    // Check for active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        driverId: id,
        status: {
          in: ["SCHEDULED", "DISPATCHED", "IN_PROGRESS"],
        },
      },
    });

    if (activeTrips) {
      return {
        error: "Cannot delete driver with active trips. Complete or cancel them first.",
      };
    }

    await prisma.driver.delete({
      where: { id },
    });

    revalidatePath("/drivers");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete driver" };
  }
}

export async function getDrivers() {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        assignedVehicle: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return drivers;
  } catch (error) {
    throw new Error("Failed to fetch drivers");
  }
}

export async function getVehicles() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { plate: "asc" },
    });
    return vehicles;
  } catch (error) {
    throw new Error("Failed to fetch vehicles");
  }
}
