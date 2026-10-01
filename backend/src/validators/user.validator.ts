import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),

  password: z.string().min(8, "Password must be at least 8 characters"),

  firstName: z.string().min(1, "First name is required").max(100).trim(),

  lastName: z.string().min(1, "Last name is required").max(100).trim(),

  roleId: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .trim()
    .toLowerCase()
    .optional(),

  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100)
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100)
    .trim()
    .optional(),

  roleId: z.number().int().positive().optional(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
