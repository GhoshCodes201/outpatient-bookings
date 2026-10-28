"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateAdminSlotsAction } from "@/actions/slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export function GenerateSlotsForm({
  doctors,
  defaultStart,
  defaultEnd,
}: {
  doctors: { id: string; name: string; isActive: boolean }[];
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(generateAdminSlotsAction, initialState);

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
        <Label htmlFor="doctorId">Doctor</Label>
        <select
          id="doctorId"
          name="doctorId"
          required
          defaultValue=""
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Select a doctor
          </option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} {doctor.isActive ? "" : "(inactive)"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={defaultStart} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={defaultEnd} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Daily start</Label>
          <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Daily end</Label>
          <Input id="endTime" name="endTime" type="time" defaultValue="13:00" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Slot length</Label>
        <select
          id="duration"
          name="duration"
          defaultValue="30"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Generating..." : "Generate slots"}
      </Button>
    </form>
  );
}
