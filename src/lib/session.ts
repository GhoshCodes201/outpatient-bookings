import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type AppRole = "patient" | "doctor" | "admin";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function homeForRole(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  return "/dashboard";
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireSession();
  if (session.user.role !== role) {
    redirect(homeForRole(session.user.role));
  }
  return session;
}
