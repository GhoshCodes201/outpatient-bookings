import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, homeForRole } from "@/lib/session";

export const dynamic = "force-dynamic";

function safeNext(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; }>;
}) {
  const session = await getSession();
  if (session) {
    redirect(homeForRole(session.user.role));
  }

  const params = await searchParams;

  return (
    <div className="container mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="hidden lg:block">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold">Welcome back to Outpatient Booking</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Sign in to book appointments, manage your visits, or open your doctor and admin workspace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Use the account created for you or your patient account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={safeNext(params.next)} />
        </CardContent>
      </Card>
    </div>
  );
}
