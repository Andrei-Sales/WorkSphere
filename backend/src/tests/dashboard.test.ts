import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";
import { loginAsAdmin, loginAsUser } from "./helpers/auth.helper.js";

describe("Dashboard API", () => {
  it("should require authentication", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should return dashboard statistics and department counts to an admin", async () => {
    const admin = await loginAsAdmin();
    const response = await admin.get("/api/dashboard");
    const statistics = response.body.data?.statistics;
    const departments = response.body.data?.departments;

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(statistics).toMatchObject({
      totalEmployees: expect.any(Number),
      activeEmployees: expect.any(Number),
      inactiveEmployees: expect.any(Number),
      totalDepartments: expect.any(Number),
      totalUsers: expect.any(Number),
      activeUsers: expect.any(Number),
      inactiveUsers: expect.any(Number),
    });
    expect(statistics.totalEmployees).toBeGreaterThanOrEqual(0);
    expect(statistics.totalDepartments).toBeGreaterThanOrEqual(0);
    expect(statistics.totalUsers).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(departments)).toBe(true);
    expect(
      departments.every(
        (department: { id: number; name: string; employeeCount: number }) =>
          Number.isInteger(department.id) &&
          typeof department.name === "string" &&
          Number.isInteger(department.employeeCount) &&
          department.employeeCount >= 0,
      ),
    ).toBe(true);

    const departmentNames = departments.map(
      (department: { name: string }) => department.name,
    );
    expect(departmentNames).toEqual(
      [...departmentNames].sort((left, right) => left.localeCompare(right)),
    );
  });

  it("should allow authenticated normal users to read the dashboard", async () => {
    const user = await loginAsUser();
    const response = await user.get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("statistics");
    expect(response.body.data).toHaveProperty("departments");
    expect(Array.isArray(response.body.data.departments)).toBe(true);
  });
});
