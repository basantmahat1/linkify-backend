import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    reason: z.enum(["spam", "scam", "adult_content", "impersonation", "malware", "other"]),
    details: z.string().max(500).optional(),
    reporterEmail: z.string().email().optional().or(z.literal("")),
  }),
});
