"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors, user } from "@/db/schema";
import { requireRole } from "@/lib/session";
import type { ActionState } from "@/lib/types";
import { createDoctorSchema, toggleDoctorSchema } from "@/lib/validations";

export async function createDoctorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  const parsed = createDoctorSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    specialization: formData.get("specialization"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the doctor details." };
  }

  try {
    const result = await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });

    const userId = result.user.id;

    await db.update(user).set({ role: "doctor", updatedAt: new Date() }).where(eq(user.id, userId));
    await db.insert(doctors).values({
      userId,
      name: parsed.data.name,
      specialization: parsed.data.specialization,
      isActive: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("exist")) {
      return { error: "An account with that email already exists." };
    }
    return { error: "Could not create the doctor account." };
  }

  revalidatePath("/admin/doctors");
  revalidatePath("/admin");
  revalidatePath("/");

  return { success: `${parsed.data.name} can now sign in as a doctor.` };
}

export async function toggleDoctorActiveAction(formData: FormData) {
  await requireRole("admin");
  const parsed = toggleDoctorSchema.safeParse({
    doctorId: formData.get("doctorId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    redirect("/admin/doctors");
  }

  await db
    .update(doctors)
    .set({ isActive: parsed.data.isActive === "true", updatedAt: new Date() })
    .where(eq(doctors.id, parsed.data.doctorId));

  revalidatePath("/admin/doctors");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/doctors?updated=1");
}
