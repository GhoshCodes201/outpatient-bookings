"use server";

import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { appointments, doctorSlots, doctors } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { buildDaySlots, buildRangeSlots } from "@/lib/slots";
import type { ActionState } from "@/lib/types";
import { singleDaySlotsSchema, slotGenerationSchema, slotIdSchema } from "@/lib/validations";

function revalidateSlotViews(doctorId?: string) {
  revalidatePath("/");
  revalidatePath("/doctor/availability");
  revalidatePath("/admin/slots");
  revalidatePath("/admin");
  if (doctorId) {
    revalidatePath(`/doctors/${doctorId}`);
  }
}

export async function addDoctorSlotsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("doctor");
  const parsed = singleDaySlotsSchema.safeParse({
    startDate: formData.get("startDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    duration: formData.get("duration"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the availability details." };
  }

  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, session.user.id)).limit(1);
  if (!doctor) {
    return { error: "Your doctor profile is not linked to this account." };
  }

  const rows = buildDaySlots({
    date: parsed.data.startDate,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    duration: parsed.data.duration,
  }).map((slot) => ({
    doctorId: doctor.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
  }));

  if (rows.length === 0) {
    return { error: "No future slots were generated. Check the times and try again." };
  }

  const inserted = await db.insert(doctorSlots).values(rows).onConflictDoNothing().returning({ id: doctorSlots.id });
  revalidateSlotViews(doctor.id);

  return { success: `${inserted.length} slot${inserted.length === 1 ? "" : "s"} added.` };
}

export async function generateAdminSlotsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const parsed = slotGenerationSchema.safeParse({
    doctorId: formData.get("doctorId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    duration: formData.get("duration"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the availability details." };
  }

  if (parsed.data.endDate < parsed.data.startDate) {
    return { error: "End date must be on or after the start date." };
  }

  const [doctor] = await db.select().from(doctors).where(eq(doctors.id, parsed.data.doctorId)).limit(1);
  if (!doctor) {
    return { error: "Doctor not found." };
  }

  const rows = buildRangeSlots({
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    duration: parsed.data.duration,
  }).map((slot) => ({
    doctorId: doctor.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
  }));

  if (rows.length === 0) {
    return { error: "No future slots were generated. Check the dates and times." };
  }

  const inserted = await db.insert(doctorSlots).values(rows).onConflictDoNothing().returning({ id: doctorSlots.id });
  revalidateSlotViews(doctor.id);

  return { success: `${inserted.length} slot${inserted.length === 1 ? "" : "s"} added for ${doctor.name}.` };
}

export async function deleteDoctorSlotAction(formData: FormData) {
  const session = await requireRole("doctor");
  const parsed = slotIdSchema.safeParse({ slotId: formData.get("slotId") });
  if (!parsed.success) {
    redirect("/doctor/availability");
  }

  const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, session.user.id)).limit(1);
  if (!doctor) {
    redirect("/doctor/availability");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(appointments)
      .where(and(eq(appointments.slotId, parsed.data.slotId), eq(appointments.status, "cancelled")));

    await tx
      .delete(doctorSlots)
      .where(
        and(
          eq(doctorSlots.id, parsed.data.slotId),
          eq(doctorSlots.doctorId, doctor.id),
          eq(doctorSlots.status, "open"),
          gt(doctorSlots.startAt, new Date()),
        ),
      );
  });

  revalidateSlotViews(doctor.id);
  redirect("/doctor/availability?deleted=1");
}

export async function deleteAdminSlotAction(formData: FormData) {
  await requireRole("admin");
  const parsed = slotIdSchema.safeParse({ slotId: formData.get("slotId") });
  if (!parsed.success) {
    redirect("/admin/slots");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(appointments)
      .where(and(eq(appointments.slotId, parsed.data.slotId), eq(appointments.status, "cancelled")));

    await tx
      .delete(doctorSlots)
      .where(
        and(eq(doctorSlots.id, parsed.data.slotId), eq(doctorSlots.status, "open"), gt(doctorSlots.startAt, new Date())),
      );
  });

  revalidateSlotViews();
  redirect("/admin/slots?deleted=1");
}
