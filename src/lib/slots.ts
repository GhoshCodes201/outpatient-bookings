import { addMinutes, eachDayOfInterval, format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE || "Asia/Kolkata";

export function formatClinicDate(date: Date | string) {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "EEE, MMM d");
}

export function formatClinicLongDate(date: Date | string) {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "EEEE, MMMM d, yyyy");
}

export function formatClinicTime(date: Date | string) {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "h:mm a");
}

export function formatClinicDateTime(date: Date | string) {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "MMM d, yyyy, h:mm a");
}

export function clinicDateKey(date: Date | string) {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "yyyy-MM-dd");
}

export function buildDaySlots(input: {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  timezone?: string;
}) {
  const timezone = input.timezone || CLINIC_TIMEZONE;
  const start = fromZonedTime(`${input.date} ${input.startTime}:00`, timezone);
  const end = fromZonedTime(`${input.date} ${input.endTime}:00`, timezone);
  const now = new Date();
  const slots: { startAt: Date; endAt: Date }[] = [];

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return slots;
  }

  let cursor = start;
  while (addMinutes(cursor, input.duration) <= end && slots.length < 100) {
    const endAt = addMinutes(cursor, input.duration);
    if (cursor > now) {
      slots.push({ startAt: cursor, endAt });
    }
    cursor = endAt;
  }

  return slots;
}

export function buildRangeSlots(input: {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: number;
}) {
  const days = eachDayOfInterval({
    start: parseISO(input.startDate),
    end: parseISO(input.endDate),
  }).slice(0, 31);

  return days.flatMap((day) =>
    buildDaySlots({
      date: format(day, "yyyy-MM-dd"),
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
    }),
  ).slice(0, 500);
}

export function groupSlotsByDate<T extends { startAt: Date }>(slots: T[]) {
  const groups = new Map<string, { key: string; label: string; slots: T[] }>();

  for (const slot of slots) {
    const key = clinicDateKey(slot.startAt);
    const existing = groups.get(key);
    if (existing) {
      existing.slots.push(slot);
    } else {
      groups.set(key, {
        key,
        label: formatInTimeZone(slot.startAt, CLINIC_TIMEZONE, "EEEE, MMM d"),
        slots: [slot],
      });
    }
  }

  return Array.from(groups.values());
}
