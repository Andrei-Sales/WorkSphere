import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";
import { createAuthSessions } from "./helpers/auth.helper.js";
import {
  createTestDepartmentData,
  createTestEmployeeData,
} from "./helpers/test-data.helper.js";

const auth = createAuthSessions();

describe("Authorization API", () => {
  it("should require authentication for department, employee, and dashboard routes", async () => {
    const responses = await Promise.all([
      request(app).get("/api/departments"),
      request(app).get("/api/employees"),
      request(app).get("/api/dashboard"),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: "Authentication required",
      });
    }
  });

  it("should deny normal users all department and employee management actions", async () => {
    const user = await auth.loginAsUser();
    const department = createTestDepartmentData();
    const employee = createTestEmployeeData(1, 1);
    const responses = await Promise.all([
      user.get("/api/departments"),
      user.get("/api/departments/1"),
      user.post("/api/departments").send(department),
      user.put("/api/departments/1").send({ name: department.name }),
      user.delete("/api/departments/1"),
      user.get("/api/employees"),
      user.get("/api/employees/1"),
      user.post("/api/employees").send(employee),
      user.put("/api/employees/1").send({ position: "Unauthorized" }),
      user.delete("/api/employees/1"),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        message: "Access denied",
      });
    }
  });

  it("should allow an admin to read another user's record", async () => {
    const admin = await auth.loginAsAdmin();
    const user = await auth.loginAsUser();
    const adminProfile = await admin.get("/api/auth/me");
    const userProfile = await user.get("/api/auth/me");

    expect(adminProfile.status).toBe(200);
    expect(userProfile.status).toBe(200);

    const response = await admin.get(
      `/api/users/${userProfile.body.data.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(userProfile.body.data.id);
    expect(response.body.data.email).toBe(process.env.TEST_USER_EMAIL);
    expect(response.body.data).not.toHaveProperty("passwordHash");
  });

  it("should allow a normal user to access their own record only", async () => {
    const user = await auth.loginAsUser();
    const admin = await auth.loginAsAdmin();
    const [userProfile, adminProfile] = await Promise.all([
      user.get("/api/auth/me"),
      admin.get("/api/auth/me"),
    ]);

    const ownRecord = await user.get(
      `/api/users/${userProfile.body.data.id}`,
    );
    const otherRecord = await user.get(
      `/api/users/${adminProfile.body.data.id}`,
    );

    expect(ownRecord.status).toBe(200);
    expect(ownRecord.body.success).toBe(true);
    expect(ownRecord.body.data.id).toBe(userProfile.body.data.id);
    expect(ownRecord.body.data).not.toHaveProperty("passwordHash");
    expect(otherRecord.status).toBe(403);
    expect(otherRecord.body).toEqual({
      success: false,
      message: "Access denied",
    });
  });

  it("should reject invalid and nonexistent user IDs with their route contracts", async () => {
    const admin = await auth.loginAsAdmin();

    const invalid = await admin.get("/api/users/not-an-id");
    const nonexistent = await admin.get("/api/users/2147483647");

    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe("Invalid user ID");
    expect(nonexistent.status).toBe(404);
    expect(nonexistent.body.message).toBe("User not found");
  });

  it("should prevent an admin from deactivating or deleting their own account", async () => {
    const admin = await auth.loginAsAdmin();
    const profile = await admin.get("/api/auth/me");
    const ownId = profile.body.data.id as number;

    const deactivation = await admin
      .put(`/api/users/${ownId}`)
      .send({ status: "INACTIVE" });
    const deletion = await admin.delete(`/api/users/${ownId}`);

    expect(deactivation.status).toBe(400);
    expect(deactivation.body.message).toBe(
      "You cannot deactivate your own account",
    );
    expect(deletion.status).toBe(400);
    expect(deletion.body.message).toBe("You cannot delete your own account");

    const stillActive = await admin.get("/api/auth/me");
    expect(stillActive.status).toBe(200);
    expect(stillActive.body.data.status).toBe("ACTIVE");
  });

  it("should allow a normal user to access the authenticated dashboard", async () => {
    const user = await auth.loginAsUser();
    const response = await user.get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("statistics");
    expect(response.body.data).toHaveProperty("departments");
  });
});
