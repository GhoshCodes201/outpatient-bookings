import { adminAppointmentAction } from "@/actions/appointments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllAppointments } from "@/lib/queries";
import { formatClinicDateTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

function statusBadge(status: "booked" | "cancelled" | "completed") {
  if (status === "booked") return <Badge variant="success">Booked</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Completed</Badge>;
}

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const params = await searchParams;
  const appointments = await getAllAppointments();
  const now = new Date();

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Appointments</p>
        <h1 className="text-3xl font-semibold">All appointments</h1>
        <p className="text-muted-foreground">Review bookings and resolve scheduling issues.</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment list</CardTitle>
          <CardDescription>{appointments.length} recent appointments.</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <p className="font-medium">{appointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">{appointment.patientEmail}</p>
                      {appointment.patientPhone ? (
                        <p className="text-xs text-muted-foreground">{appointment.patientPhone}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{formatClinicDateTime(appointment.slotStart)}</TableCell>
                    <TableCell>{statusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      {appointment.status === "booked" ? (
                        <div className="flex justify-end gap-2">
                          <form action={adminAppointmentAction}>
                            <input type="hidden" name="appointmentId" value={appointment.id} />
                            <input type="hidden" name="intent" value="complete" />
                            <Button type="submit" variant="outline" size="sm">
                              Complete
                            </Button>
                          </form>
                          {appointment.slotStart > now ? (
                            <form action={adminAppointmentAction}>
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <input type="hidden" name="intent" value="cancel" />
                              <Button type="submit" variant="ghost" size="sm">
                                Cancel
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-right text-xs text-muted-foreground">No actions</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
