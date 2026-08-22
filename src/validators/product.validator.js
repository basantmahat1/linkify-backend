import { z } from "zod";
import { scheduleSchema } from "./schedule.validator.js";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    price: z.coerce.number().min(0).max(1000000),
    image: z.string().max(500).optional(),
    description: z.string().max(160).optional(),
    checkoutUrl: z.string().url(),
    isEnabled: z.boolean().optional(),
    schedule: scheduleSchema,
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    price: z.coerce.number().min(0).max(1000000).optional(),
    image: z.string().max(500).optional(),
    description: z.string().max(160).optional(),
    checkoutUrl: z.string().url().optional(),
    isEnabled: z.boolean().optional(),
    schedule: scheduleSchema,
  }),
});

export const reorderProductsSchema = z.object({
  body: z.object({
    order: z.array(z.string()).min(1),
  }),
});
