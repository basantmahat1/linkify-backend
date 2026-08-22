import { z } from "zod";
import { scheduleSchema } from "./schedule.validator.js";

export const createLinkSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(25),
    url: z.string().url(),
    icon: z.string().optional(),
    platform: z.string().optional(),
    description: z.string().max(160).optional(),
    openInNewTab: z.boolean().optional(),
    schedule: scheduleSchema,
  }),
});

export const updateLinkSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(25).optional(),
    url: z.string().url().optional(),
    icon: z.string().optional(),
    platform: z.string().optional(),
    description: z.string().max(160).optional(),
    isEnabled: z.boolean().optional(),
    openInNewTab: z.boolean().optional(),
    schedule: scheduleSchema,
  }),
});

export const reorderLinksSchema = z.object({
  body: z.object({
    order: z.array(z.string()).min(1),
  }),
});
