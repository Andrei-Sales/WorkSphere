import { describe, expect, it } from "vitest";

import { loginAsAdmin } from "./helpers/auth.helper.js";

describe("Authenticated User Management API", () => {
  it("should allow an admin to access the user list", async () => {
    const agent = await loginAsAdmin();

    const response = await agent.get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should allow an admin to access the department list", async () => {
    const agent = await loginAsAdmin();

    const response = await agent.get("/api/departments");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should allow an admin to access the employee list", async () => {
    const agent = await loginAsAdmin();

    const response = await agent.get("/api/employees");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should allow an admin to access the dashboard", async () => {
    const agent = await loginAsAdmin();

    const response = await agent.get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
