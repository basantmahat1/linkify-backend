import { z } from "zod";

/** Accept ISO datetime strings, or null/empty → null */
const nullableDate = z
  .preprocess(
    (v) => (v === undefined || v === "" || v === null ? null : v),
    z.union([z.string().datetime({ offset: true }), z.null()])
  )
  .optional()
  .nullable();

export const scheduleSchema = z
  .object({
    mode: z.enum(["none", "schedule", "expiration"]).optional().default("none"),
    startAt: nullableDate,
    endAt: nullableDate,
    expireAfter: z.enum(["1d", "3d", "7d", "30d", "custom"]).nullable().optional(),
  })
  .optional()
  .nullable()
  .transform((s) => {
    if (!s || s.mode === "none") {
      return { mode: "none", startAt: null, endAt: null, expireAfter: null };
    }
    return {
      mode: s.mode,
      startAt: s.startAt ?? null,
      endAt: s.endAt ?? null,
      expireAfter: s.mode === "expiration" ? s.expireAfter ?? null : null,
    };
  })
  .refine(
    (s) => {
      if (!s || s.mode === "none") return true;
      if (s.startAt && s.endAt && new Date(s.startAt) > new Date(s.endAt)) return false;
      return true;
    },
    { message: "Start must be before end" }
  )
  .refine(
    (s) => {
      if (!s || s.mode !== "expiration") return true;
      return Boolean(s.endAt);
    },
    { message: "Expiration requires an end date" }
  )
  .refine(
    (s) => {
      if (!s || s.mode !== "schedule") return true;
      return Boolean(s.startAt || s.endAt);
    },
    { message: "Schedule requires a start or end date" }
  );
