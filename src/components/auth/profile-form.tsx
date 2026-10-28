"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" name="name" defaultValue={name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-phone">Phone</Label>
        <Input id="profile-phone" name="phone" type="tel" defaultValue={phone} required placeholder="+1 555 0100" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
