"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const createVehicleSchema = z.object({
  plate: z.string().min(1, "Plate is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  capacity: z.coerce.number().int().positive("Capacity must be positive"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
});

const updateVehicleSchema = createVehicleSchema.extend({
  id: z.string(),
});

export async function createVehicle(
  data: z.infer<typeof createVehicleSchema>
) {
  try {
    const validated = createVehicleSchema.parse(data);

    // Check if plate already exists
    const existing = await prisma.vehicle.findUnique({
      where: { plate: validated.plate },
    });

    if (existing) {
      return {
        error: "A vehicle with this plate number already exists",
      };
    }

    const vehicle = await prisma.vehicle.create({
      data: validated,
    });

    revalidatePath("/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to create vehicle" };
  }
}

export async function updateVehicle(
  data: z.infer<typeof updateVehicleSchema>
) {
  try {
    const validated = updateVehicleSchema.parse(data);
    const { id, ...updateData } = validated;

    // Check if plate is taken by another vehicle
    const existing = await prisma.vehicle.findFirst({
      where: {
        plate: updateData.plate,
        id: { not: id },
      },
    });

    if (existing) {
      return {
        error: "A vehicle with this plate number already exists",
      };
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to update vehicle" };
  }
}

export async function deleteVehicle(id: string) {
  try {
    // Check for active trips
    const activeTrips = await prisma.trip.findFirst({
      where: {
        vehicleId: id,
        status: {
          in: ["SCHEDULED", "DISPATCHED", "IN_PROGRESS"],
        },
      },
    });

    if (activeTrips) {
      return {
        error: "Cannot delete vehicle with active trips. Complete or cancel them first.",
      };
    }

    // Clear driver assignments
    await prisma.driver.updateMany({
      where: { assignedVehicleId: id },
      data: { assignedVehicleId: null },
    });

    await prisma.vehicle.delete({
      where: { id },
    });

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete vehicle" };
  }
}

export async function getVehicles() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: true,
      },
      orderBy: { plate: "asc" },
    });
    return vehicles;
  } catch (error) {
    throw new Error("Failed to fetch vehicles");
  }
}
