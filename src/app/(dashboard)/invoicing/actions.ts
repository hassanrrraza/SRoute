"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";

const createInvoiceSchema = z.object({
  tripId: z.string().min(1, "Trip is required"),
});

const updateInvoiceSchema = z.object({
  id: z.string(),
  dueDate: z.coerce.date("Due date is required"),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
  lineItems: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1, "Description required"),
      quantity: z.coerce.number().int().positive("Quantity must be positive"),
      unitPrice: z.coerce.number().positive("Unit price must be positive"),
    })
  ),
  taxRate: z.coerce.number().min(0).max(100, "Tax rate must be 0-100"),
});

const markPaidSchema = z.object({
  id: z.string(),
});

// Helper to generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function generateInvoice(data: z.infer<typeof createInvoiceSchema>) {
  try {
    const validated = createInvoiceSchema.parse(data);

    const trip = await prisma.trip.findUnique({
      where: { id: validated.tripId },
      include: { client: true },
    });

    if (!trip) {
      return { error: "Trip not found" };
    }

    if (trip.status !== "COMPLETED") {
      return { error: "Only completed trips can be invoiced" };
    }

    // Check if trip already has invoice
    const existing = await prisma.invoice.findFirst({
      where: { tripId: validated.tripId },
    });

    if (existing) {
      return { error: "This trip already has an invoice" };
    }

    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30-day terms

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        tripId: validated.tripId,
        clientId: trip.clientId,
        dueDate,
        status: "DRAFT",
        subtotal: trip.fare,
        tax: 0,
        total: trip.fare,
      },
      include: {
        trip: { include: { client: true } },
        lineItems: true,
        client: true,
      },
    });

    // Create default line item
    await prisma.invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description: `Transport service: ${trip.pickupAddress} to ${trip.dropoffAddress}`,
        quantity: 1,
        unitPrice: trip.fare,
        total: trip.fare,
      },
    });

    revalidatePath("/invoicing");
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return { success: true, invoice };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to generate invoice" };
  }
}

export async function updateInvoice(data: z.infer<typeof updateInvoiceSchema>) {
  try {
    const validated = updateInvoiceSchema.parse(data);

    const invoice = await prisma.invoice.findUnique({
      where: { id: validated.id },
    });

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    // Calculate totals
    const subtotal = validated.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const tax = (subtotal * validated.taxRate) / 100;
    const total = subtotal + tax;

    // Update invoice
    const updated = await prisma.invoice.update({
      where: { id: validated.id },
      data: {
        dueDate: validated.dueDate,
        status: validated.status,
        subtotal,
        tax,
        total,
      },
      include: { lineItems: true, client: true, trip: true },
    });

    // Delete existing line items and create new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: validated.id },
    });

    for (const item of validated.lineItems) {
      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: validated.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        },
      });
    }

    revalidatePath("/invoicing");
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return { success: true, invoice: updated };
  } catch (error) {
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message || "Validation error" };
    }
    return { error: "Failed to update invoice" };
  }
}

export async function markInvoicePaid(data: z.infer<typeof markPaidSchema>) {
  try {
    const validated = markPaidSchema.parse(data);

    const invoice = await prisma.invoice.update({
      where: { id: validated.id },
      data: {
        status: "PAID",
        paidDate: new Date(),
      },
      include: { client: true, trip: true },
    });

    revalidatePath("/invoicing");
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return { success: true, invoice };
  } catch (error) {
    return { error: "Failed to mark invoice as paid" };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return { error: "Invoice not found" };
    }

    if (invoice.status !== "DRAFT") {
      return { error: "Only DRAFT invoices can be deleted" };
    }

    await prisma.invoice.delete({
      where: { id },
    });

    revalidatePath("/invoicing");
    revalidatePath("/billing");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    return { error: "Failed to delete invoice" };
  }
}

export async function getInvoices(clientId?: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: clientId ? { clientId } : undefined,
      include: {
        client: true,
        trip: true,
        lineItems: true,
      },
      orderBy: { issuedDate: "desc" },
    });

    return invoices;
  } catch (error) {
    throw new Error("Failed to fetch invoices");
  }
}

export async function getCompletedTripsWithoutInvoice() {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        status: "COMPLETED",
      },
      include: { client: true, driver: true },
      orderBy: { scheduledTime: "desc" },
    });

    // Filter out trips that already have invoices
    const result = await Promise.all(
      trips.map(async (trip) => {
        const hasInvoice = await prisma.invoice.findFirst({
          where: { tripId: trip.id },
        });
        return hasInvoice ? null : trip;
      })
    );

    return result.filter((t) => t !== null);
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

export async function getBillingData() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { client: true },
    });

    const clients = await prisma.client.findMany({
      include: {
        trips: true,
        invoices: {
          include: { lineItems: true },
        },
      },
    });

    const clientData = clients.map((client) => {
      const clientInvoices = client.invoices;
      const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalPaid = clientInvoices
        .filter((inv) => inv.status === "PAID")
        .reduce((sum, inv) => sum + inv.total, 0);
      const totalOutstanding = totalInvoiced - totalPaid;

      return {
        client,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        tripCount: client.trips.length,
        invoiceCount: clientInvoices.length,
      };
    });

    const totalRevenue = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    const totalOutstanding = invoices
      .filter((inv) => inv.status !== "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      clientData,
      totalRevenue,
      totalOutstanding,
      invoiceCount: invoices.length,
    };
  } catch (error) {
    throw new Error("Failed to fetch billing data");
  }
}
