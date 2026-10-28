import Link from "next/link";
import { CalendarPlus, Clock3, History, UserRound } from "lucide-react";
import { cancelPatientAppointmentAction } from "@/actions/appointments";
import { ProfileForm } from "@/components/auth/profile-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientAppointments } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { formatClinicDateTime, formatClinicLongDate, formatClinicTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

function statusBadge(status: "booked" | "cancelled" | "completed") {
  if (status === "booked") return <Badge variant="success">Confirmed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Completed</Badge>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; cancelled?: string; error?: string }>;
}) {
  const session = await requireRole("patient");
  const params = await searchParams;
  const appointments = await getPatientAppointments(session.user.id);
  const now = new Date();

  const upcoming = appointments
    .filter((appointment) => appointment.status === "booked" && appointment.slotStart > now)
    .sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
  const history = appointments.filter(
    (appointment) => appointment.status !== "booked" || appointment.slotStart <= now,
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Patient dashboard</p>
          <h1 className="text-3xl font-semibold">Hello, {session.user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Manage your upcoming visits and profile.</p>
        </div>
        <Button asChild>
          <Link href="/">
            <CalendarPlus className="h-4 w-4" /> Book an appointment
          </Link>
        </Button>
      </div>

      {params.booked ? (
        <Alert variant="success" className="mb-6">
          <AlertDescription>Your appointment is confirmed.</AlertDescription>
        </Alert>
      ) : null}
      {params.cancelled ? (
        <Alert className="mb-6">
          <AlertDescription>Your appointment was cancelled and the slot is open again.</AlertDescription>
        </Alert>
      ) : null}
      {params.error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>The appointment could not be updated. It may be a past visit.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Upcoming appointments</h2>
            </div>

            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="font-medium">No upcoming appointments</p>
                  <p className="text-sm text-muted-foreground">Find a doctor and choose an available slot.</p>
                  <Button asChild variant="outline">
                    <Link href="/">Find a doctor</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{appointment.doctorName}</p>
                          {statusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.specialization}</p>
                        <p className="mt-2 text-sm">
                          {formatClinicLongDate(appointment.slotStart)} · {formatClinicTime(appointment.slotStart)} -{" "}
                          {formatClinicTime(appointment.slotEnd)}
                        </p>
                      </div>
                      <form action={cancelPatientAppointmentAction}>
                        <input type="hidden" name="appointmentId" value={appointment.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Cancel appointment
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Appointment history</h2>
            </div>

            {history.length === 0 ? (
              <p className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
                No past or cancelled appointments yet.
              </p>
            ) : (
              <div className="divide-y rounded-xl border bg-card">
                {history.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{appointment.doctorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatClinicDateTime(appointment.slotStart)} · {appointment.specialization}
                      </p>
                    </div>
                    {statusBadge(appointment.status)}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4" /> Your profile
              </CardTitle>
              <CardDescription>Contact details used for appointments.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm name={session.user.name} phone={session.user.phone ?? ""} />
              <p className="mt-4 text-xs text-muted-foreground">Signed in as {session.user.email}</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
