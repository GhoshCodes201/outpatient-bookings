import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Info, Stethoscope } from "lucide-react";
import { bookAppointmentAction } from "@/actions/appointments";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailableSlots, getDoctorById } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { CLINIC_TIMEZONE, formatClinicTime, groupSlotsByDate } from "@/lib/slots";
import { doctorIdSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ doctorId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { doctorId } = await params;
  const parsedId = doctorIdSchema.safeParse({ doctorId });

  if (!parsedId.success) {
    notFound();
  }

  const query = await searchParams;
  const [doctor, slots, session] = await Promise.all([
    getDoctorById(doctorId),
    getAvailableSlots(doctorId),
    getSession(),
  ]);

  if (!doctor) {
    notFound();
  }

  const groupedSlots = groupSlotsByDate(slots);
  const canBook = session?.user.role === "patient";
  const loginHref = `/login?next=${encodeURIComponent(`/doctors/${doctor.id}`)}`;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to doctors
        </Link>
      </Button>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {initials(doctor.name)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{doctor.name}</h1>
              <Badge variant="success">Accepting appointments</Badge>
            </div>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="h-4 w-4" /> {doctor.specialization}
            </p>
          </div>
        </CardContent>
      </Card>

      {query.error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            That slot was just taken or is no longer available. Please choose another time.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Available appointments</h2>
          <p className="text-sm text-muted-foreground">
            Times shown in {CLINIC_TIMEZONE.replace("_", " ")}.
          </p>
        </div>
        <Badge variant="outline">
          <CalendarDays className="mr-1 h-3.5 w-3.5" /> {slots.length} open slots
        </Badge>
      </div>

      {slots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Clock3 className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No open slots right now</p>
              <p className="text-sm text-muted-foreground">Please check back later or choose another doctor.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">Browse other doctors</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {!session ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <Link href={loginHref} className="font-medium text-primary hover:underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link
                  href={`/register?next=${encodeURIComponent(`/doctors/${doctor.id}`)}`}
                  className="font-medium text-primary hover:underline"
                >
                  create a patient account
                </Link>{" "}
                to book an appointment.
              </AlertDescription>
            </Alert>
          ) : !canBook ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Only patient accounts can book appointments.</AlertDescription>
            </Alert>
          ) : null}

          {groupedSlots.map((group) => (
            <Card key={group.key}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{group.label}</CardTitle>
                <CardDescription>{group.slots.length} slots available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.slots.map((slot) =>
                    canBook ? (
                      <form key={slot.id} action={bookAppointmentAction}>
                        <input type="hidden" name="slotId" value={slot.id} />
                        <input type="hidden" name="doctorId" value={doctor.id} />
                        <Button type="submit" variant="outline" size="sm">
                          {formatClinicTime(slot.startAt)}
                        </Button>
                      </form>
                    ) : (
                      <Button key={slot.id} asChild variant="outline" size="sm">
                        <Link href={session ? "/" : loginHref}>{formatClinicTime(slot.startAt)}</Link>
                      </Button>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
