import { and, asc, count, desc, eq, gt, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { appointments, doctorSlots, doctors, user } from "@/db/schema";

export async function getActiveDoctors(options?: { q?: string; specialization?: string }) {
  const conditions = [eq(doctors.isActive, true)];

  if (options?.q) {
    const term = `%${options.q}%`;
    conditions.push(or(ilike(doctors.name, term), ilike(doctors.specialization, term))!);
  }

  if (options?.specialization) {
    conditions.push(eq(doctors.specialization, options.specialization));
  }

  return db
    .select()
    .from(doctors)
    .where(and(...conditions))
    .orderBy(asc(doctors.name));
}

export async function getSpecializations() {
  return db
    .selectDistinct({ specialization: doctors.specialization })
    .from(doctors)
    .where(eq(doctors.isActive, true))
    .orderBy(asc(doctors.specialization));
}

export async function getDoctorById(doctorId: string) {
  const [doctor] = await db
    .select()
    .from(doctors)
    .where(and(eq(doctors.id, doctorId), eq(doctors.isActive, true)))
    .limit(1);

  return doctor ?? null;
}

export async function getAvailableSlots(doctorId: string) {
  return db
    .select({
      id: doctorSlots.id,
      startAt: doctorSlots.startAt,
      endAt: doctorSlots.endAt,
    })
    .from(doctorSlots)
    .innerJoin(doctors, eq(doctors.id, doctorSlots.doctorId))
    .where(
      and(
        eq(doctorSlots.doctorId, doctorId),
        eq(doctorSlots.status, "open"),
        gt(doctorSlots.startAt, new Date()),
        eq(doctors.isActive, true),
      ),
    )
    .orderBy(asc(doctorSlots.startAt))
    .limit(200);
}

export async function getDoctorByUserId(userId: string) {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
  return doctor ?? null;
}

export async function getDoctorUpcomingSlots(doctorId: string) {
  return db
    .select()
    .from(doctorSlots)
    .where(and(eq(doctorSlots.doctorId, doctorId), gt(doctorSlots.startAt, new Date())))
    .orderBy(asc(doctorSlots.startAt))
    .limit(300);
}

export async function getPatientAppointments(patientId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      createdAt: appointments.createdAt,
      slotStart: doctorSlots.startAt,
      slotEnd: doctorSlots.endAt,
      doctorName: doctors.name,
      specialization: doctors.specialization,
      doctorId: doctors.id,
    })
    .from(appointments)
    .innerJoin(doctorSlots, eq(doctorSlots.id, appointments.slotId))
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(doctorSlots.startAt));
}

export async function getDoctorAppointments(doctorId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      slotStart: doctorSlots.startAt,
      slotEnd: doctorSlots.endAt,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
    })
    .from(appointments)
    .innerJoin(doctorSlots, eq(doctorSlots.id, appointments.slotId))
    .innerJoin(user, eq(user.id, appointments.patientId))
    .where(eq(appointments.doctorId, doctorId))
    .orderBy(asc(doctorSlots.startAt));
}

export async function getAllDoctors() {
  return db
    .select({
      id: doctors.id,
      name: doctors.name,
      specialization: doctors.specialization,
      isActive: doctors.isActive,
      email: user.email,
    })
    .from(doctors)
    .leftJoin(user, eq(user.id, doctors.userId))
    .orderBy(asc(doctors.name));
}

export async function getUpcomingSlotsForAdmin() {
  return db
    .select({
      id: doctorSlots.id,
      doctorName: doctors.name,
      startAt: doctorSlots.startAt,
      endAt: doctorSlots.endAt,
      status: doctorSlots.status,
    })
    .from(doctorSlots)
    .innerJoin(doctors, eq(doctors.id, doctorSlots.doctorId))
    .where(gt(doctorSlots.startAt, new Date()))
    .orderBy(asc(doctorSlots.startAt))
    .limit(200);
}

export async function getAllAppointments() {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      createdAt: appointments.createdAt,
      slotStart: doctorSlots.startAt,
      doctorName: doctors.name,
      patientName: user.name,
      patientEmail: user.email,
      patientPhone: user.phone,
    })
    .from(appointments)
    .innerJoin(doctorSlots, eq(doctorSlots.id, appointments.slotId))
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .innerJoin(user, eq(user.id, appointments.patientId))
    .orderBy(desc(doctorSlots.startAt))
    .limit(200);
}

export async function getAdminStats() {
  const [[doctorCount], [slotCount], [appointmentCount]] = await Promise.all([
    db.select({ value: count() }).from(doctors).where(eq(doctors.isActive, true)),
    db.select({ value: count() }).from(doctorSlots).where(and(eq(doctorSlots.status, "open"), gt(doctorSlots.startAt, new Date()))),
    db.select({ value: count() }).from(appointments).where(eq(appointments.status, "booked")),
  ]);

  return {
    doctors: Number(doctorCount?.value ?? 0),
    openSlots: Number(slotCount?.value ?? 0),
    bookedAppointments: Number(appointmentCount?.value ?? 0),
  };
}
