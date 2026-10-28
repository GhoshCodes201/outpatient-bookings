"use server";

import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, doctorSlots, doctors } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";
import { appointmentIdSchema, bookAppointmentSchema } from "@/lib/validations";

class BookingError extends Error {}

export async function bookAppointmentAction(formData: FormData) {
  const parsed = bookAppointmentSchema.safeParse({
    slotId: formData.get("slotId"),
    doctorId: formData.get("doctorId"),
  });

  if (!parsed.success) {
    redirect("/?error=invalid-booking");
  }

  const { slotId, doctorId } = parsed.data;
  const session = await getSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/doctors/${doctorId}`)}`);
  }

  if (session.user.role !== "patient") {
    redirect("/");
  }

  let bookingFailed = false;

  try {
    await db.transaction(async (tx) => {
      const [slot] = await tx
        .select()
        .from(doctorSlots)
        .where(eq(doctorSlots.id, slotId))
        .for("update");

      if (!slot || slot.doctorId !== doctorId || slot.status !== "open" || slot.startAt <= new Date()) {
        throw new BookingError("This slot is no longer available.");
      }

      const [doctor] = await tx
        .select({ isActive: doctors.isActive })
        .from(doctors)
        .where(eq(doctors.id, slot.doctorId))
        .limit(1);

      if (!doctor?.isActive) {
        throw new BookingError("This doctor is not accepting appointments.");
      }

      await tx
        .update(doctorSlots)
        .set({ status: "booked" })
        .where(and(eq(doctorSlots.id, slotId), eq(doctorSlots.status, "open")));

      await tx.insert(appointments).values({
        patientId: session.user.id,
        doctorId: slot.doctorId,
        slotId: slot.id,
        status: "booked",
      });
    });
  } catch {
    bookingFailed = true;
  }

  if (bookingFailed) {
    redirect(`/doctors/${doctorId}?error=slot-unavailable`);
  }

  revalidatePath("/");
  revalidatePath(`/doctors/${doctorId}`);
  revalidatePath("/dashboard");
  redirect("/dashboard?booked=1");
}

export async function cancelPatientAppointmentAction(formData: FormData) {
  const session = await requireRole("patient");
  const parsed = appointmentIdSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid");
  }

  let failed = false;

  try {
    await db.transaction(async (tx) => {
      const [appointment] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, parsed.data.appointmentId))
        .for("update");

      if (!appointment || appointment.patientId !== session.user.id || appointment.status !== "booked") {
        throw new BookingError("Appointment cannot be cancelled.");
      }

      const [slot] = await tx
        .select()
        .from(doctorSlots)
        .where(eq(doctorSlots.id, appointment.slotId))
        .for("update");

      if (!slot || slot.startAt <= new Date()) {
        throw new BookingError("Past appointments cannot be cancelled.");
      }

      await tx
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));

      await tx.update(doctorSlots).set({ status: "open" }).where(eq(doctorSlots.id, appointment.slotId));
    });
  } catch {
    failed = true;
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(failed ? "/dashboard?error=cancel" : "/dashboard?cancelled=1");
}

export async function doctorAppointmentAction(formData: FormData) {
  const session = await requireRole("doctor");
  const intent = formData.get("intent");
  const parsed = appointmentIdSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
  });

  if (!parsed.success || (intent !== "complete" && intent !== "cancel")) {
    redirect("/doctor");
  }

  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, session.user.id)).limit(1);
  if (!doctor) {
    redirect("/doctor");
  }

  let failed = false;

  try {
    await db.transaction(async (tx) => {
      const [appointment] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, parsed.data.appointmentId))
        .for("update");

      if (!appointment || appointment.doctorId !== doctor.id || appointment.status !== "booked") {
        throw new BookingError("Appointment cannot be updated.");
      }

      if (intent === "complete") {
        await tx
          .update(appointments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(appointments.id, appointment.id));
        return;
      }

      const [slot] = await tx
        .select()
        .from(doctorSlots)
        .where(eq(doctorSlots.id, appointment.slotId))
        .for("update");

      if (!slot || slot.startAt <= new Date()) {
        throw new BookingError("Past appointments cannot be cancelled.");
      }

      await tx
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));

      await tx.update(doctorSlots).set({ status: "open" }).where(eq(doctorSlots.id, appointment.slotId));
    });
  } catch {
    failed = true;
  }

  revalidatePath("/doctor");
  revalidatePath("/dashboard");
  redirect(failed ? "/doctor?error=update" : "/doctor?updated=1");
}

export async function adminAppointmentAction(formData: FormData) {
  await requireRole("admin");
  const intent = formData.get("intent");
  const parsed = appointmentIdSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
  });

  if (!parsed.success || (intent !== "complete" && intent !== "cancel")) {
    redirect("/admin/appointments");
  }

  let failed = false;

  try {
    await db.transaction(async (tx) => {
      const [appointment] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, parsed.data.appointmentId))
        .for("update");

      if (!appointment || appointment.status !== "booked") {
        throw new BookingError("Appointment cannot be updated.");
      }

      if (intent === "complete") {
        await tx
          .update(appointments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(appointments.id, appointment.id));
        return;
      }

      const [slot] = await tx
        .select()
        .from(doctorSlots)
        .where(and(eq(doctorSlots.id, appointment.slotId), gt(doctorSlots.startAt, new Date())))
        .for("update");

      if (!slot) {
        throw new BookingError("Past appointments cannot be cancelled.");
      }

      await tx
        .update(appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(appointments.id, appointment.id));

      await tx.update(doctorSlots).set({ status: "open" }).where(eq(doctorSlots.id, appointment.slotId));
    });
  } catch {
    failed = true;
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  revalidatePath("/doctor");
  revalidatePath("/dashboard");
  redirect(failed ? "/admin/appointments?error=update" : "/admin/appointments?updated=1");
}
