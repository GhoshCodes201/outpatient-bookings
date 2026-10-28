import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock3, Search, ShieldCheck, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getActiveDoctors, getSpecializations } from "@/lib/queries";
import { getSession, homeForRole } from "@/lib/session";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ q?: string; specialization?: string; error?: string }>;
};

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const specialization = params.specialization?.trim() ?? "";

  const [doctors, specialties, session] = await Promise.all([
    getActiveDoctors({ q, specialization }),
    getSpecializations(),
    getSession(),
  ]);

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Outpatient appointments made simple
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Find the right doctor and book your visit.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Browse specialties, pick an open slot, and confirm your appointment in seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <a href="#doctors">Browse doctors</a>
              </Button>
              {session ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={homeForRole(session.user.role)}>Go to my dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/register">Create an account</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <Card>
          <CardContent className="pt-6">
            <form className="grid gap-3 md:grid-cols-[1fr_240px_auto]" action="/">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by doctor or specialty"
                  className="pl-9"
                  aria-label="Search doctors"
                />
              </div>
              <select
                name="specialization"
                defaultValue={specialization}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filter by specialty"
              >
                <option value="">All specialties</option>
                {specialties.map((item) => (
                  <option key={item.specialization} value={item.specialization}>
                    {item.specialization}
                  </option>
                ))}
              </select>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {params.error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>That booking could not be completed. Please choose another slot.</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section id="doctors" className="container mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-semibold">Available doctors</h2>
            <p className="text-sm text-muted-foreground">
              {doctors.length} doctor{doctors.length === 1 ? "" : "s"} accepting appointments.
            </p>
          </div>
          {(q || specialization) && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Clear filters</Link>
            </Button>
          )}
        </div>

        {doctors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Stethoscope className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">No doctors match your search</p>
                <p className="text-sm text-muted-foreground">Try another name or specialty.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials(doctor.name)}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{doctor.name}</CardTitle>
                    <CardDescription>{doctor.specialization}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/doctors/${doctor.id}`}>
                      View availability <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="border-t bg-card/50">
        <div className="container mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3">
          {[
            { icon: Search, title: "Choose a doctor", text: "Search by name or specialty and compare available times." },
            { icon: CalendarCheck, title: "Book a slot", text: "Confirm an open appointment instantly with one click." },
            { icon: Clock3, title: "Manage your visit", text: "View or cancel upcoming appointments from your dashboard." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-background p-5">
              <item.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Slots are protected against double booking.
        </div>
      </section>
    </div>
  );
}
