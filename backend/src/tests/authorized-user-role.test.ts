import { describe, expect, it } from "vitest";

import { loginAsUser } from "./helpers/auth.helper.js";

describe("Regular User Authorization", () => {
  it("should deny access to the user list", async () => {
    const agent = await loginAsUser();

    const response = await agent.get("/api/users");

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });

  it("should deny user creation", async () => {
    const agent = await loginAsUser();

    const response = await agent.post("/api/users").send({
      email: "unauthorized@worksphere.test",
      password: "TestPassword123!",
      firstName: "Unauthorized",
      lastName: "User",
      roleId: 2,
    });

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });

  it("should deny user update", async () => {
    const agent = await loginAsUser();

    const response = await agent.put("/api/users/1").send({
      firstName: "Unauthorized",
    });

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });

  it("should deny user deletion", async () => {
    const agent = await loginAsUser();

    const response = await agent.delete("/api/users/1");

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });
});
