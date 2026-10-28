import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(24)
    .regex(/^[+()\d\s-]+$/, "Enter a valid phone number"),
});

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  specialization: z.string().trim().min(2, "Specialization is required").max(80),
});

export const slotGenerationSchema = z.object({
  doctorId: z.string().uuid("Select a doctor"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid end time"),
  duration: z.coerce.number().int().refine((value) => [15, 20, 30, 45, 60].includes(value), "Choose a valid duration"),
});

export const singleDaySlotsSchema = slotGenerationSchema.omit({ doctorId: true, endDate: true });

export const bookAppointmentSchema = z.object({
  slotId: z.string().uuid("Invalid slot"),
  doctorId: z.string().uuid("Invalid doctor"),
});

export const appointmentIdSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment"),
});

export const doctorIdSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor"),
});

export const slotIdSchema = z.object({
  slotId: z.string().uuid("Invalid slot"),
});

export const toggleDoctorSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor"),
  isActive: z.enum(["true", "false"]),
});
