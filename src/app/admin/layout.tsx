import type { ReactNode } from "react";
import { RoleNav } from "@/components/layout/role-nav";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <RoleNav
        links={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/doctors", label: "Doctors" },
          { href: "/admin/slots", label: "Slots" },
          { href: "/admin/appointments", label: "Appointments" },
        ]}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
