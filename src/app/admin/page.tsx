import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarPlus, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Active doctors", value: stats.doctors, icon: Users, href: "/admin/doctors" },
    { label: "Open future slots", value: stats.openSlots, icon: CalendarPlus, href: "/admin/slots" },
    { label: "Booked appointments", value: stats.bookedAppointments, icon: CalendarCheck, href: "/admin/appointments" },
  ];

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Admin overview</p>
        <h1 className="text-3xl font-semibold">Clinic at a glance</h1>
        <p className="text-muted-foreground">Manage doctors, availability, and appointments from one workspace.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{card.label}</CardDescription>
              <card.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{card.value}</p>
              <Button asChild variant="link" className="mt-1 h-auto p-0 text-sm">
                <Link href={card.href}>
                  Manage <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4" /> Doctor accounts
            </CardTitle>
            <CardDescription>Create a doctor login and keep the public directory up to date.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/doctors">Manage doctors</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" /> Availability
            </CardTitle>
            <CardDescription>Generate appointment slots for a date range in a few clicks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/slots">Manage slots</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
