import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getSession, homeForRole } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const session = await getSession();
  const role = session?.user.role ?? "patient";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight text-foreground">Outpatient Booking</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Find a doctor</Link>
          </Button>

          {session ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={homeForRole(role)}>
                  {role === "admin" ? "Admin" : role === "doctor" ? "Doctor studio" : "My appointments"}
                </Link>
              </Button>
              <span className="hidden px-2 text-muted-foreground sm:inline">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
