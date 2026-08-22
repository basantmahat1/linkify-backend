import { z } from "zod";
import { CATEGORIES } from "../models/Theme.js";

export const createThemeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    description: z.string().max(300).optional(),
    category: z.enum(CATEGORIES).optional(),
    thumbnail: z.string().optional(),
    fromThemeId: z.string().optional(),
  }),
});

export const updateThemeSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    description: z.string().max(300).optional(),
    category: z.enum(CATEGORIES).optional(),
    thumbnail: z.string().optional(),
    isPremium: z.boolean().optional(),
    config: z.any().optional(), // deep-validated/sanitized by utils/themeSchema.js
  }),
});

export const listThemesQuerySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: z.enum(["draft", "published", "archived", "all"]).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const applyThemeSchema = z.object({
  body: z.object({
    themeId: z.string().nullable(),
  }),
});
