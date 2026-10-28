"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createDoctorAction } from "@/actions/doctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export function CreateDoctorForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createDoctorAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      formRef.current?.reset();
      router.refresh();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="doctor-name">Full name</Label>
        <Input id="doctor-name" name="name" required placeholder="Dr. Asha Rao" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doctor-specialization">Specialization</Label>
        <Input id="doctor-specialization" name="specialization" required placeholder="Cardiology" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doctor-email">Email</Label>
        <Input id="doctor-email" name="email" type="email" required placeholder="doctor@clinic.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doctor-password">Temporary password</Label>
        <Input
          id="doctor-password"
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
        <p className="text-xs text-muted-foreground">Share this password with the doctor so they can sign in.</p>
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Creating account..." : "Create doctor"}
      </Button>
    </form>
  );
}
