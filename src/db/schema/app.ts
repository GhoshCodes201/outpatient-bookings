import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const slotStatus = pgEnum("slot_status", ["open", "held", "booked"]);
export const appointmentStatus = pgEnum("appointment_status", ["booked", "cancelled", "completed"]);

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    specialization: text("specialization").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("doctors_specialization_idx").on(table.specialization)],
);

export const doctorSlots = pgTable(
  "doctor_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    status: slotStatus("status").default("open").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("doctor_slots_doctor_start_unique").on(table.doctorId, table.startAt),
    index("doctor_slots_status_start_idx").on(table.status, table.startAt),
    check("doctor_slots_time_check", sql`${table.endAt} > ${table.startAt}`),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "restrict" }),
    slotId: uuid("slot_id")
      .notNull()
      .references(() => doctorSlots.id, { onDelete: "restrict" }),
    status: appointmentStatus("status").default("booked").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("appointments_patient_idx").on(table.patientId),
    index("appointments_doctor_idx").on(table.doctorId),
    uniqueIndex("appointments_booked_slot_unique")
      .on(table.slotId)
      .where(sql`${table.status} = 'booked'`),
  ],
);
