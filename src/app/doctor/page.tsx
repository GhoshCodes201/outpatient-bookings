import Link from "next/link";
import { CalendarClock, CalendarDays, Mail, Phone } from "lucide-react";
import { doctorAppointmentAction } from "@/actions/appointments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctorAppointments, getDoctorByUserId } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { clinicDateKey, formatClinicDateTime, formatClinicLongDate, formatClinicTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

function statusBadge(status: "booked" | "cancelled" | "completed") {
  if (status === "booked") return <Badge variant="success">Confirmed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Completed</Badge>;
}

export default async function DoctorPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const session = await requireRole("doctor");
  const params = await searchParams;
  const doctor = await getDoctorByUserId(session.user.id);

  if (!doctor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doctor profile not linked</CardTitle>
          <CardDescription>
            This account has the doctor role but no doctor record. Ask an admin to link or recreate your profile.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const appointments = await getDoctorAppointments(doctor.id);
  const now = new Date();
  const todayKey = clinicDateKey(now);
  const todayCount = appointments.filter(
    (appointment) => appointment.status === "booked" && clinicDateKey(appointment.slotStart) === todayKey,
  ).length;
  const upcoming = appointments.filter(
    (appointment) => appointment.status === "booked" && appointment.slotStart > now,
  );
  const history = appointments.filter(
    (appointment) => appointment.status !== "booked" || appointment.slotStart <= now,
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Doctor studio</p>
          <h1 className="text-3xl font-semibold">{doctor.name}</h1>
          <p className="text-muted-foreground">
            {doctor.specialization} · {doctor.isActive ? "Accepting appointments" : "Deactivated"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/doctor/availability">Manage availability</Link>
        </Button>
      </div>

      {params.updated ? (
        <Alert variant="success" className="mb-6">
          <AlertDescription>Appointment updated.</AlertDescription>
        </Alert>
      ) : null}
      {params.error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>That appointment could not be updated.</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl">{todayCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">confirmed appointments</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">{upcoming.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">future bookings</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>All appointments</CardDescription>
            <CardTitle className="text-3xl">{appointments.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">including history</CardContent>
        </Card>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Upcoming schedule</h2>
        </div>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No upcoming appointments. Add availability to open more slots.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{appointment.patientName}</p>
                      {statusBadge(appointment.status)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatClinicLongDate(appointment.slotStart)} · {formatClinicTime(appointment.slotStart)} -{" "}
                      {formatClinicTime(appointment.slotEnd)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {appointment.patientEmail}
                      </span>
                      {appointment.patientPhone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {appointment.patientPhone}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={doctorAppointmentAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="intent" value="complete" />
                      <Button type="submit" size="sm">
                        Mark completed
                      </Button>
                    </form>
                    <form action={doctorAppointmentAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="intent" value="cancel" />
                      <Button type="submit" variant="outline" size="sm">
                        Cancel
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Appointment history</h2>
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">No appointment history yet.</p>
        ) : (
          <div className="divide-y rounded-xl border bg-card">
            {history.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{appointment.patientName}</p>
                  <p className="text-sm text-muted-foreground">{formatClinicDateTime(appointment.slotStart)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(appointment.status)}
                  {appointment.status === "booked" ? (
                    <form action={doctorAppointmentAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="intent" value="complete" />
                      <Button type="submit" variant="outline" size="sm">
                        Complete
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
