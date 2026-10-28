import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { format, addDays } = await import("date-fns");
  const { formatInTimeZone } = await import("date-fns-tz");
  const { and, eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { appointments, doctorSlots, doctors, user } = await import("../src/db/schema");
  const { auth } = await import("../src/lib/auth");
  const { buildRangeSlots, CLINIC_TIMEZONE } = await import("../src/lib/slots");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@outpatientbooking.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const patientEmail = process.env.SEED_PATIENT_EMAIL ?? "patient@outpatientbooking.test";
  const patientPassword = process.env.SEED_PATIENT_PASSWORD ?? "Patient123!";
  const doctorPassword = process.env.SEED_DOCTOR_PASSWORD ?? "Doctor123!";

  const demoDoctors = [
    { name: "Dr. Asha Rao", email: process.env.SEED_DOCTOR_EMAIL ?? "doctor@outpatientbooking.test", specialization: "Cardiology" },
    { name: "Dr. Vikram Sen", email: "vikram.sen@outpatientbooking.test", specialization: "Dermatology" },
    { name: "Dr. Meera Iyer", email: "meera.iyer@outpatientbooking.test", specialization: "Pediatrics" },
    { name: "Dr. Arjun Patel", email: "arjun.patel@outpatientbooking.test", specialization: "General Medicine" },
  ];

  async function ensureUser(input: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "doctor" | "patient";
    phone?: string;
  }) {
    let existing = await db.select().from(user).where(eq(user.email, input.email)).limit(1);

    if (existing.length === 0) {
      try {
        await auth.api.signUpEmail({
          body: {
            name: input.name,
            email: input.email,
            password: input.password,
          },
        });
      } catch (error) {
        console.warn(`Sign-up failed for ${input.email}, checking for an existing account.`, error);
      }
      existing = await db.select().from(user).where(eq(user.email, input.email)).limit(1);
    }

    const record = existing[0];
    if (!record) {
      throw new Error(`Could not create seed user ${input.email}`);
    }

    await db
      .update(user)
      .set({
        name: input.name,
        role: input.role,
        phone: input.phone ?? record.phone,
        updatedAt: new Date(),
      })
      .where(eq(user.id, record.id));

    return { ...record, name: input.name, role: input.role, phone: input.phone ?? record.phone };
  }

  console.log("Seeding accounts...");
  const admin = await ensureUser({
    name: "Outpatient Booking Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });

  const patient = await ensureUser({
    name: "Demo Patient",
    email: patientEmail,
    password: patientPassword,
    role: "patient",
    phone: "+1 555 0100",
  });

  for (const entry of demoDoctors) {
    const doctorUser = await ensureUser({
      name: entry.name,
      email: entry.email,
      password: doctorPassword,
      role: "doctor",
      phone: "+1 555 0199",
    });

    const existingDoctor = await db.select().from(doctors).where(eq(doctors.userId, doctorUser.id)).limit(1);

    if (existingDoctor.length === 0) {
      await db.insert(doctors).values({
        userId: doctorUser.id,
        name: entry.name,
        specialization: entry.specialization,
        isActive: true,
      });
    } else {
      await db
        .update(doctors)
        .set({ name: entry.name, specialization: entry.specialization, isActive: true, updatedAt: new Date() })
        .where(eq(doctors.id, existingDoctor[0].id));
    }
  }

  console.log("Generating slots for the next 14 days...");
  const allDoctors = await db.select().from(doctors);
  const today = formatInTimeZone(new Date(), CLINIC_TIMEZONE, "yyyy-MM-dd");
  const endDate = format(addDays(new Date(`${today}T00:00:00`), 13), "yyyy-MM-dd");

  for (const doctor of allDoctors) {
    const rows = buildRangeSlots({
      startDate: today,
      endDate,
      startTime: "09:00",
      endTime: "13:00",
      duration: 30,
    }).map((slot) => ({
      doctorId: doctor.id,
      startAt: slot.startAt,
      endAt: slot.endAt,
    }));

    if (rows.length > 0) {
      await db.insert(doctorSlots).values(rows).onConflictDoNothing();
    }
  }

  console.log("Creating a demo appointment...");
  const existingAppointment = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patient.id))
    .limit(1);

  if (existingAppointment.length === 0) {
    const firstDoctor = allDoctors[0];
    if (firstDoctor) {
      const [slot] = await db
        .select()
        .from(doctorSlots)
        .where(and(eq(doctorSlots.doctorId, firstDoctor.id), eq(doctorSlots.status, "open")))
        .orderBy(doctorSlots.startAt)
        .limit(1);

      if (slot) {
        await db.update(doctorSlots).set({ status: "booked" }).where(eq(doctorSlots.id, slot.id));
        await db.insert(appointments).values({
          patientId: patient.id,
          doctorId: firstDoctor.id,
          slotId: slot.id,
          status: "booked",
        });
      }
    }
  }

  console.log("");
  console.log("Seed complete.");
  console.log(`Admin:    ${admin.email} / ${adminPassword}`);
  console.log(`Doctor:   ${demoDoctors[0]?.email} / ${doctorPassword}`);
  console.log(`Patient:  ${patient.email} / ${patientPassword}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
