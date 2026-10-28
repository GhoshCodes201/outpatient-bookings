"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/session";
import type { ActionState } from "@/lib/types";
import { profileSchema } from "@/lib/validations";

export async function updateProfileAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your profile details." };
  }

  await db
    .update(user)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/doctor");
  revalidatePath("/admin");

  return { success: "Profile updated." };
}
