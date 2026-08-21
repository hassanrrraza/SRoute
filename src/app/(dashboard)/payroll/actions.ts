"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const generatePayrollSchema = z.object({
  periodStart: z.coerce.date("Period start is required"),
  periodEnd: z.coerce.date("Period end is required"),
});

const markPaidSchema = z.object({
  id: z.string(),
});

export async function generatePayroll(data: z.infer<typeof generatePayrollSchema>) {
  try {
    const validated = generatePayrollSchema.parse(data);

    // Validate date range
    if (validated.periodStart >= validated.periodEnd) {
      return { error: "Period start must be before period end" };
    }

    // Find all drivers with completed trips in the period
    const trips = await prisma.trip.findMany({
      where: {
        status: "COMPLETED",
        scheduledTime: {
          gte: validated.periodStart,
          lte: validated.periodEnd,
        },
      },
      include: { driver: true, client: true },
    });

    if (trips.length === 0) {
      return { error: "No completed trips found in this period" };
    }

    // Group trips by driver
    const tripsByDriver: Record<string, any[]> = {};
    trips.forEach((trip) => {
      if (!tripsByDriver[trip.driverId]) {
        tripsByDriver[trip.driverId] = [];
      }
      tripsByDriver[trip.driverId].push(trip);
    });

    // Generate payroll entries
    const created = [];
    const skipped = [];

    for (const [driverId, driverTrips] of Object.entries(tripsByDriver)) {
      const driver = driverTrips[0].driver;

      // Check for existing overlapping payroll entry
      const existing = await prisma.payrollEntry.findFirst({
        where: {
          driverId,
          periodStart: { lte: validated.periodEnd },
          periodEnd: { gte: validated.periodStart },
        },
      });

      if (existing) {
        skipped.push({
          driverId,
          driverName: driver.name,
          reason: `Overlapping payroll entry already exists for ${existing.periodStart.toDateString()} to ${existing.periodEnd.toDateString()}`,
        });
        continue;
      }

      // Calculate hours (1 hour per trip as a simple estimate)
      const hoursWorked = driverTrips.length;
      const grossPay = hoursWorked * driver.hourlyRate;

      const entry = await prisma.payrollEntry.create({
        data: {
          driverId,
          periodStart: validated.periodStart,
          periodEnd: validated.periodEnd,
          tripsCompleted: driverTrips.length,
          hoursWorked,
          grossPay,
          status: "PENDING",
        },
        include: { driver: true },
      });

      created.push(entry);
    }

    revalidatePath("/payroll");
    revalidatePath("/dashboard");
    revalidatePath("/drivers");

    return {
      success: true,
      created,
      skipped,
      message: `Created ${created.length} payroll entries${skipped.length > 0 ? `, skipped ${skipped.length}` : ""}`,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to generate payroll" };
  }
}

export async function markPayrollPaid(data: z.infer<typeof markPaidSchema>) {
  try {
    const validated = markPaidSchema.parse(data);

    const entry = await prisma.payrollEntry.update({
      where: { id: validated.id },
      data: {
        status: "PAID",
        paidDate: new Date(),
      },
      include: { driver: true },
    });

    revalidatePath("/payroll");
    revalidatePath("/dashboard");
    revalidatePath("/drivers");

    return { success: true, entry };
  } catch (error) {
    return { error: "Failed to mark payroll as paid" };
  }
}

export async function deletePayrollEntry(id: string) {
  try {
    const entry = await prisma.payrollEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return { error: "Payroll entry not found" };
    }

    if (entry.status !== "PENDING") {
      return { error: "Only PENDING payroll entries can be deleted" };
    }

    await prisma.payrollEntry.delete({
      where: { id },
    });

    revalidatePath("/payroll");
    revalidatePath("/dashboard");
    revalidatePath("/drivers");

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete payroll entry" };
  }
}

export async function getPayrollEntries(driverId?: string) {
  try {
    const entries = await prisma.payrollEntry.findMany({
      where: driverId ? { driverId } : undefined,
      include: { driver: true },
      orderBy: { periodStart: "desc" },
    });

    return entries;
  } catch (error) {
    throw new Error("Failed to fetch payroll entries");
  }
}

export async function getPayrollEntryDetails(id: string) {
  try {
    const entry = await prisma.payrollEntry.findUnique({
      where: { id },
      include: {
        driver: true,
      },
    });

    if (!entry) {
      return null;
    }

    // Get the trips for this payroll entry
    const trips = await prisma.trip.findMany({
      where: {
        driverId: entry.driverId,
        status: "COMPLETED",
        scheduledTime: {
          gte: entry.periodStart,
          lte: entry.periodEnd,
        },
      },
      include: { client: true },
      orderBy: { scheduledTime: "desc" },
    });

    return { ...entry, trips };
  } catch (error) {
    throw new Error("Failed to fetch payroll details");
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

export async function getPendingPayroll() {
  try {
    const entries = await prisma.payrollEntry.findMany({
      where: { status: "PENDING" },
      include: { driver: true },
    });

    const count = entries.length;
    const totalAmount = entries.reduce((sum, e) => sum + e.grossPay, 0);

    return { count, totalAmount };
  } catch (error) {
    throw new Error("Failed to fetch pending payroll");
  }
}
