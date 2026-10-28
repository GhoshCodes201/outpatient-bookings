import { CalendarPlus, Clock3 } from "lucide-react";
import { deleteDoctorSlotAction } from "@/actions/slots";
import { AvailabilityForm } from "@/components/doctor/availability-form";
import { formatInTimeZone } from "date-fns-tz";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDoctorByUserId, getDoctorUpcomingSlots } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { CLINIC_TIMEZONE, groupSlotsByDate } from "@/lib/slots";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const session = await requireRole("doctor");
  const params = await searchParams;
  const doctor = await getDoctorByUserId(session.user.id);

  if (!doctor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doctor profile not linked</CardTitle>
          <CardDescription>Ask an admin to link a doctor record to this account.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const slots = await getDoctorUpcomingSlots(doctor.id);
  const grouped = groupSlotsByDate(slots);
  const defaultDate = formatInTimeZone(new Date(), CLINIC_TIMEZONE, "yyyy-MM-dd");

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Availability</p>
        <h1 className="text-3xl font-semibold">Manage your open slots</h1>
        <p className="text-muted-foreground">Add slots for a day and remove open slots you no longer need.</p>
      </div>

      {params.deleted ? (
        <Alert className="mb-6">
          <AlertDescription>Open slot removed.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4" /> Add availability
            </CardTitle>
            <CardDescription>Slots are generated from the start and end time.</CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityForm defaultDate={defaultDate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4" /> Upcoming slots
            </CardTitle>
            <CardDescription>{slots.length} slots in the next schedule window.</CardDescription>
          </CardHeader>
          <CardContent>
            {grouped.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming slots. Add availability on the left.</p>
            ) : (
              <div className="space-y-5">
                {grouped.map((group) => (
                  <div key={group.key}>
                    <h3 className="mb-2 text-sm font-semibold">{group.label}</h3>
                    <div className="space-y-2">
                      {group.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">
                              {formatInTimeZone(slot.startAt, CLINIC_TIMEZONE, "h:mm a")} -{" "}
                              {formatInTimeZone(slot.endAt, CLINIC_TIMEZONE, "h:mm a")}
                            </span>
                            <Badge variant={slot.status === "open" ? "success" : "secondary"}>
                              {slot.status === "open" ? "Open" : slot.status === "booked" ? "Booked" : "Held"}
                            </Badge>
                          </div>
                          {slot.status === "open" ? (
                            <form action={deleteDoctorSlotAction}>
                              <input type="hidden" name="slotId" value={slot.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                Remove
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
