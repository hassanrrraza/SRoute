import { prisma } from "@/lib/db";

async function verifyTripsSetup() {
  console.log("========== TRIPS VERIFICATION ==========\n");

  // 1. Check total trips
  const allTrips = await prisma.trip.findMany({
    include: { client: true, driver: true, vehicle: true },
  });
  console.log(`✓ Total trips in database: ${allTrips.length}`);

  // 2. Check trips by status
  const statuses = {
    SCHEDULED: 0,
    DISPATCHED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  allTrips.forEach((trip) => {
    statuses[trip.status as keyof typeof statuses]++;
  });

  console.log("\nTrips by status:");
  Object.entries(statuses).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });

  // 3. Check driver statuses
  const drivers = await prisma.driver.findMany();
  console.log(`\n✓ Total drivers: ${drivers.length}`);
  drivers.forEach((driver) => {
    const trips = allTrips.filter((t) => t.driverId === driver.id);
    console.log(
      `  - ${driver.name}: status=${driver.status}, trips=${trips.length}`
    );
  });

  // 4. Check vehicle statuses
  const vehicles = await prisma.vehicle.findMany();
  console.log(`\n✓ Total vehicles: ${vehicles.length}`);
  vehicles.forEach((vehicle) => {
    const trips = allTrips.filter((t) => t.vehicleId === vehicle.id);
    console.log(
      `  - ${vehicle.plate}: status=${vehicle.status}, trips=${trips.length}`
    );
  });

  // 5. Check invoices linked to trips
  const invoices = await prisma.invoice.findMany();
  console.log(`\n✓ Total invoices: ${invoices.length}`);

  const completedTripsWithInvoices = allTrips.filter(
    (t) => t.status === "COMPLETED" && invoices.some((inv) => inv.tripId === t.id)
  );
  console.log(
    `  - Completed trips with invoices: ${completedTripsWithInvoices.length}`
  );

  // 6. Check today's trips
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTrips = allTrips.filter(
    (t) => t.scheduledTime >= today && t.scheduledTime < tomorrow
  );
  console.log(`\n✓ Today's trips: ${todayTrips.length}`);

  console.log("\n========== VERIFICATION COMPLETE ==========");
}

verifyTripsSetup().catch(console.error).finally(() => process.exit(0));
