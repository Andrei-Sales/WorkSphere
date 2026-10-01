import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNumber: z
    .string()
    .min(1, "Employee number is required")
    .max(50, "Employee number must not exceed 50 characters")
    .trim(),

  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters")
    .trim(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters")
    .trim(),

  position: z
    .string()
    .min(1, "Position is required")
    .max(100, "Position must not exceed 100 characters")
    .trim(),

  hireDate: z.coerce.date({
    message: "Valid hire date is required",
  }),

  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),

  userId: z.number().int().positive(),

  departmentId: z.number().int().positive(),
});

export const updateEmployeeSchema = z.object({
  employeeNumber: z
    .string()
    .min(1, "Employee number is required")
    .max(50, "Employee number must not exceed 50 characters")
    .trim()
    .optional(),

  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters")
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters")
    .trim()
    .optional(),

  position: z
    .string()
    .min(1, "Position is required")
    .max(100, "Position must not exceed 100 characters")
    .trim()
    .optional(),

  hireDate: z.coerce
    .date({
      message: "Valid hire date is required",
    })
    .optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),

  userId: z.number().int().positive().optional(),

  departmentId: z.number().int().positive().optional(),
});
