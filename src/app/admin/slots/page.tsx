import { addDays, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarPlus } from "lucide-react";
import { deleteAdminSlotAction } from "@/actions/slots";
import { GenerateSlotsForm } from "@/components/admin/generate-slots-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllDoctors, getUpcomingSlotsForAdmin } from "@/lib/queries";
import { CLINIC_TIMEZONE, formatClinicDateTime } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function AdminSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const [doctors, slots] = await Promise.all([getAllDoctors(), getUpcomingSlotsForAdmin()]);
  const today = formatInTimeZone(new Date(), CLINIC_TIMEZONE, "yyyy-MM-dd");
  const defaultEnd = format(addDays(new Date(`${today}T00:00:00`), 6), "yyyy-MM-dd");

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Availability</p>
        <h1 className="text-3xl font-semibold">Slot management</h1>
        <p className="text-muted-foreground">Generate future slots for a doctor and remove open slots when needed.</p>
      </div>

      {params.deleted ? (
        <Alert className="mb-6">
          <AlertDescription>Open slot removed.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" /> Generate slots
            </CardTitle>
            <CardDescription>Up to 31 days per batch. Past times are skipped automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Create a doctor first.</p>
            ) : (
              <GenerateSlotsForm doctors={doctors} defaultStart={today} defaultEnd={defaultEnd} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming slots</CardTitle>
            <CardDescription>{slots.length} future slots shown.</CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming slots.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">{slot.doctorName}</TableCell>
                      <TableCell>{formatClinicDateTime(slot.startAt)}</TableCell>
                      <TableCell>
                        <Badge variant={slot.status === "open" ? "success" : "secondary"}>
                          {slot.status === "open" ? "Open" : slot.status === "booked" ? "Booked" : "Held"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {slot.status === "open" ? (
                          <form action={deleteAdminSlotAction}>
                            <input type="hidden" name="slotId" value={slot.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              Remove
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
