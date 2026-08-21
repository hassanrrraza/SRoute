import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  await prisma.calendarEvent.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@seemroute.local",
      passwordHash: hashPassword("admin"),
      role: "ADMIN",
    },
  });

  const dispatcherUser = await prisma.user.create({
    data: {
      name: "Dispatcher",
      email: "dispatcher@seemroute.local",
      passwordHash: hashPassword("dispatcher"),
      role: "DISPATCHER",
    },
  });

  console.log("✓ Users created");

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        plate: "XY-01-AB",
        make: "Toyota",
        model: "Camry",
        capacity: 5,
        status: "ACTIVE",
      },
    }),
    prisma.vehicle.create({
      data: {
        plate: "XY-02-CD",
        make: "Honda",
        model: "Civic",
        capacity: 5,
        status: "ACTIVE",
      },
    }),
    prisma.vehicle.create({
      data: {
        plate: "XY-03-EF",
        make: "Mercedes",
        model: "Sprinter",
        capacity: 8,
        status: "ACTIVE",
      },
    }),
    prisma.vehicle.create({
      data: {
        plate: "XY-04-GH",
        make: "Toyota",
        model: "Hiace",
        capacity: 10,
        status: "ACTIVE",
      },
    }),
    prisma.vehicle.create({
      data: {
        plate: "XY-05-IJ",
        make: "Nissan",
        model: "Altima",
        capacity: 5,
        status: "MAINTENANCE",
      },
    }),
    prisma.vehicle.create({
      data: {
        plate: "XY-06-KL",
        make: "Ford",
        model: "Focus",
        capacity: 5,
        status: "INACTIVE",
      },
    }),
  ]);

  console.log("✓ Vehicles created");

  // Create drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Ahmed Hassan",
        phone: "+92-300-1234567",
        licenseNumber: "DL-2025-001",
        status: "AVAILABLE",
        hourlyRate: 500,
        assignedVehicleId: vehicles[0].id,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Muhammad Ali",
        phone: "+92-300-2234567",
        licenseNumber: "DL-2025-002",
        status: "ON_TRIP",
        hourlyRate: 500,
        assignedVehicleId: vehicles[1].id,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Fatima Khan",
        phone: "+92-300-3234567",
        licenseNumber: "DL-2025-003",
        status: "AVAILABLE",
        hourlyRate: 550,
        assignedVehicleId: vehicles[2].id,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Hassan Raza",
        phone: "+92-300-4234567",
        licenseNumber: "DL-2025-004",
        status: "OFF_DUTY",
        hourlyRate: 500,
        assignedVehicleId: vehicles[3].id,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Zainab Ahmed",
        phone: "+92-300-5234567",
        licenseNumber: "DL-2025-005",
        status: "AVAILABLE",
        hourlyRate: 480,
        // No vehicle assigned
      },
    }),
    prisma.driver.create({
      data: {
        name: "Omar Khan",
        phone: "+92-300-6234567",
        licenseNumber: "DL-2025-006",
        status: "ON_TRIP",
        hourlyRate: 520,
        // No vehicle assigned
      },
    }),
    prisma.driver.create({
      data: {
        name: "Amina Ali",
        phone: "+92-300-7234567",
        licenseNumber: "DL-2025-007",
        status: "AVAILABLE",
        hourlyRate: 500,
        // No vehicle assigned
      },
    }),
    prisma.driver.create({
      data: {
        name: "Tariq Hassan",
        phone: "+92-300-8234567",
        licenseNumber: "DL-2025-008",
        status: "OFF_DUTY",
        hourlyRate: 510,
        // No vehicle assigned
      },
    }),
  ]);

  console.log("✓ Drivers created");

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Acme Corporation",
        phone: "+92-21-1234567",
        email: "contact@acmecorp.pk",
        address: "123 Business Park, Karachi",
      },
    }),
    prisma.client.create({
      data: {
        name: "Tech Solutions Ltd",
        phone: "+92-21-2234567",
        email: "info@techsolutions.pk",
        address: "456 Tech Street, Lahore",
      },
    }),
    prisma.client.create({
      data: {
        name: "Global Enterprises",
        phone: "+92-21-3234567",
        email: "admin@globalenterprises.pk",
        address: "789 Enterprise Avenue, Islamabad",
      },
    }),
    prisma.client.create({
      data: {
        name: "Swift Trading Co",
        phone: "+92-21-4234567",
        email: "sales@swifttrading.pk",
        address: "321 Market Street, Multan",
      },
    }),
    prisma.client.create({
      data: {
        name: "Premier Services Inc",
        phone: "+92-21-5234567",
        email: "support@premierservices.pk",
        address: "654 Services Road, Peshawar",
      },
    }),
    prisma.client.create({
      data: {
        name: "Delta Logistics",
        phone: "+92-21-6234567",
        email: "logistics@delta.pk",
        address: "987 Logistics Park, Faisalabad",
      },
    }),
  ]);

  console.log("✓ Clients created");

  // Create trips with mix of statuses
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in2Days = new Date(today);
  in2Days.setDate(in2Days.getDate() + 2);
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);

  const tripData = [
    // Yesterday trips (mostly completed)
    {
      pickupAddress: "Airport Terminal 1, Karachi",
      dropoffAddress: "Pearl Continental Hotel, Karachi",
      scheduledTime: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
      completedTime: new Date(yesterday.getTime() + 8.5 * 60 * 60 * 1000),
      status: "COMPLETED" as const,
      fare: 2500,
    },
    {
      pickupAddress: "Ghulamali Station, Karachi",
      dropoffAddress: "Dolmen Mall, Karachi",
      scheduledTime: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
      completedTime: new Date(yesterday.getTime() + 10.75 * 60 * 60 * 1000),
      status: "COMPLETED" as const,
      fare: 1800,
    },
    {
      pickupAddress: "Clifton, Karachi",
      dropoffAddress: "DHA, Karachi",
      scheduledTime: new Date(yesterday.getTime() + 14 * 60 * 60 * 1000),
      completedTime: null,
      status: "CANCELLED" as const,
      fare: 3000,
    },
    // Today trips
    {
      pickupAddress: "Hotel Mehran, Karachi",
      dropoffAddress: "Port Trust Building, Karachi",
      scheduledTime: new Date(today.getTime() + 7 * 60 * 60 * 1000),
      completedTime: new Date(today.getTime() + 7.75 * 60 * 60 * 1000),
      status: "COMPLETED" as const,
      fare: 2200,
    },
    {
      pickupAddress: "MMDC Office, Karachi",
      dropoffAddress: "Jinnah Terminal, Karachi",
      scheduledTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
      completedTime: null,
      status: "IN_PROGRESS" as const,
      fare: 1900,
    },
    {
      pickupAddress: "Sea View, Karachi",
      dropoffAddress: "Karsaz Road, Karachi",
      scheduledTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),
      completedTime: null,
      status: "DISPATCHED" as const,
      fare: 2100,
    },
    {
      pickupAddress: "Saddar Bazaar, Karachi",
      dropoffAddress: "Korangi, Karachi",
      scheduledTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 1600,
    },
    {
      pickupAddress: "Gulshan-e-Iqbal, Karachi",
      dropoffAddress: "Malir Halt, Karachi",
      scheduledTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 2400,
    },
    // Tomorrow trips
    {
      pickupAddress: "New York Dream Hotel, Karachi",
      dropoffAddress: "Bahria Town, Karachi",
      scheduledTime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 3200,
    },
    {
      pickupAddress: "Jilani Park, Karachi",
      dropoffAddress: "Iqbal Park, Karachi",
      scheduledTime: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 1400,
    },
    // More trips for the week
    {
      pickupAddress: "Defence, Karachi",
      dropoffAddress: "Clifton, Karachi",
      scheduledTime: new Date(in2Days.getTime() + 9 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 2800,
    },
    {
      pickupAddress: "Shaheed-e-Millat Road, Karachi",
      dropoffAddress: "Fort Road, Karachi",
      scheduledTime: new Date(in2Days.getTime() + 11 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 1900,
    },
    {
      pickupAddress: "University Road, Karachi",
      dropoffAddress: "Tariq Road, Karachi",
      scheduledTime: new Date(in3Days.getTime() + 8 * 60 * 60 * 1000),
      completedTime: null,
      status: "SCHEDULED" as const,
      fare: 2300,
    },
  ];

  const trips = await Promise.all(
    tripData.map((data, idx) =>
      prisma.trip.create({
        data: {
          ...data,
          driverId: drivers[idx % drivers.length].id,
          vehicleId: vehicles[idx % vehicles.length].id,
          clientId: clients[idx % clients.length].id,
        },
      })
    )
  );

  console.log("✓ Trips created");

  // Create invoices for completed trips
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const invoices = await Promise.all(
    completedTrips.map((trip, idx) =>
      prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${String(1001 + idx).padStart(4, "0")}`,
          tripId: trip.id,
          clientId: trip.clientId,
          subtotal: trip.fare,
          tax: Math.round(trip.fare * 0.17 * 100) / 100, // 17% tax
          total: Math.round(trip.fare * 1.17 * 100) / 100,
          status: "SENT",
          issuedDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lineItems: {
            create: [
              {
                description: `Transportation: ${trip.pickupAddress} to ${trip.dropoffAddress}`,
                quantity: 1,
                unitPrice: trip.fare,
                total: trip.fare,
              },
            ],
          },
        },
      })
    )
  );

  console.log("✓ Invoices created");

  // Create payroll entries
  const payrollStart = new Date(today);
  payrollStart.setDate(payrollStart.getDate() - 7);
  const payrollEnd = new Date(payrollStart);
  payrollEnd.setDate(payrollEnd.getDate() + 7);

  const payrollEntries = await Promise.all(
    drivers.slice(0, 5).map((driver) =>
      prisma.payrollEntry.create({
        data: {
          driverId: driver.id,
          periodStart: payrollStart,
          periodEnd: payrollEnd,
          tripsCompleted: Math.floor(Math.random() * 15) + 5,
          hoursWorked: Math.floor(Math.random() * 40) + 20,
          grossPay: Math.floor(Math.random() * 50000) + 30000,
          status: "PENDING",
        },
      })
    )
  );

  console.log("✓ Payroll entries created");

  // Create calendar events
  const calendarEvents = await Promise.all([
    ...trips
      .filter((t) => t.status !== "CANCELLED")
      .slice(0, 10)
      .map((trip) =>
        prisma.calendarEvent.create({
          data: {
            title: `Trip: ${trip.pickupAddress} → ${trip.dropoffAddress}`,
            type: "TRIP",
            startTime: trip.scheduledTime,
            endTime: new Date(trip.scheduledTime.getTime() + 60 * 60 * 1000),
            relatedTripId: trip.id,
            relatedDriverId: trip.driverId,
          },
        })
      ),
    // Add some standalone shift events
    ...drivers.slice(0, 4).map((driver, idx) =>
      prisma.calendarEvent.create({
        data: {
          title: `Shift: ${driver.name}`,
          type: "SHIFT",
          startTime: new Date(today.getTime() + (6 + idx) * 60 * 60 * 1000),
          endTime: new Date(today.getTime() + (14 + idx) * 60 * 60 * 1000),
          relatedDriverId: driver.id,
        },
      })
    ),
  ]);

  console.log("✓ Calendar events created");

  console.log("✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
