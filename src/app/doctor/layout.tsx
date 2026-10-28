import type { ReactNode } from "react";
import { RoleNav } from "@/components/layout/role-nav";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DoctorLayout({ children }: { children: ReactNode }) {
  await requireRole("doctor");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <RoleNav
        links={[
          { href: "/doctor", label: "Schedule" },
          { href: "/doctor/availability", label: "Availability" },
        ]}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
