import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";
import { loginAsAdmin } from "./helpers/auth.helper.js";
import {
  cleanupTestRecords,
  createTestUserData,
} from "./helpers/test-data.helper.js";

describe("User Management API", () => {
  it("should reject unauthenticated access to users", async () => {
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject unauthenticated user creation", async () => {
    const response = await request(app).post("/api/users").send({
      email: "test@worksphere.test",
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "User",
      roleId: 2,
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject unauthenticated user lookup", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject unauthenticated user update", async () => {
    const response = await request(app).put("/api/users/1").send({
      firstName: "Updated",
      lastName: "User",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject unauthenticated user deletion", async () => {
    const response = await request(app).delete("/api/users/1");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject invalid user ID without authentication", async () => {
    const response = await request(app).get("/api/users/invalid");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should let an admin list and retrieve users without exposing password hashes", async () => {
    const admin = await loginAsAdmin();
    const list = await admin.get("/api/users");
    const profile = await admin.get("/api/auth/me");
    const detail = await admin.get(`/api/users/${profile.body.data.id}`);

    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThan(0);
    expect(
      list.body.data.every(
        (user: Record<string, unknown>) => !("passwordHash" in user),
      ),
    ).toBe(true);

    expect(detail.status).toBe(200);
    expect(detail.body.success).toBe(true);
    expect(detail.body.data.id).toBe(profile.body.data.id);
    expect(detail.body.data).not.toHaveProperty("passwordHash");
  });

  it("should create, update, and delete a test user using supported values", async () => {
    const admin = await loginAsAdmin();
    const userData = createTestUserData(2);
    let userId: number | undefined;

    try {
      const created = await admin.post("/api/users").send(userData);
      expect(created.status).toBe(201);
      expect(created.body.success).toBe(true);
      expect(created.body.data.email).toBe(userData.email);
      expect(created.body.data.firstName).toBe(userData.firstName);
      expect(created.body.data.lastName).toBe(userData.lastName);
      expect(created.body.data.roleId).toBe(2);
      expect(created.body.data.status).toBe("ACTIVE");
      expect(created.body.data).not.toHaveProperty("passwordHash");
      userId = created.body.data.id as number;

      const promoted = await admin.put(`/api/users/${userId}`).send({
        firstName: "Updated",
        roleId: 1,
        status: "INACTIVE",
      });
      expect(promoted.status).toBe(200);
      expect(promoted.body.success).toBe(true);
      expect(promoted.body.data.firstName).toBe("Updated");
      expect(promoted.body.data.roleId).toBe(1);
      expect(promoted.body.data.status).toBe("INACTIVE");
      expect(promoted.body.data).not.toHaveProperty("passwordHash");

      const restored = await admin.put(`/api/users/${userId}`).send({
        roleId: 2,
        status: "ACTIVE",
      });
      expect(restored.status).toBe(200);
      expect(restored.body.data.roleId).toBe(2);
      expect(restored.body.data.status).toBe("ACTIVE");

      const deleted = await admin.delete(`/api/users/${userId}`);
      expect(deleted.status).toBe(204);
      userId = undefined;

      const missing = await admin.get(
        `/api/users/${created.body.data.id}`,
      );
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe("User not found");
    } finally {
      if (userId !== undefined) {
        await cleanupTestRecords(admin, { userIds: [userId] });
      }
    }
  });

  it("should reject invalid user create and update payloads", async () => {
    const admin = await loginAsAdmin();
    const invalidCreate = await admin.post("/api/users").send({
      email: "invalid-email",
      password: "short",
      firstName: "",
      lastName: "User",
      roleId: 0,
    });
    const invalidCreateRole = await admin
      .post("/api/users")
      .send({ ...createTestUserData(), roleId: "USER" });
    const invalidUpdate = await admin
      .put("/api/users/1")
      .send({ firstName: "", status: "SUSPENDED" });

    for (const response of [invalidCreate, invalidCreateRole, invalidUpdate]) {
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(Array.isArray(response.body.errors)).toBe(true);
    }
  });

  it("should reject duplicate emails on create and update", async () => {
    const admin = await loginAsAdmin();
    const ownProfile = await admin.get("/api/auth/me");
    const userData = createTestUserData();
    let userId: number | undefined;

    try {
      const created = await admin.post("/api/users").send(userData);
      expect(created.status).toBe(201);
      userId = created.body.data.id as number;

      const duplicateCreate = await admin.post("/api/users").send({
        ...createTestUserData(),
        email: ownProfile.body.data.email,
      });
      const duplicateUpdate = await admin
        .put(`/api/users/${userId}`)
        .send({ email: ownProfile.body.data.email });

      expect(duplicateCreate.status).toBe(409);
      expect(duplicateCreate.body.message).toBe("Email already exists");
      expect(duplicateUpdate.status).toBe(409);
      expect(duplicateUpdate.body.message).toBe("Email already exists");
    } finally {
      if (userId !== undefined) {
        await cleanupTestRecords(admin, { userIds: [userId] });
      }
    }
  });

  it("should reject invalid and nonexistent user IDs on admin writes", async () => {
    const admin = await loginAsAdmin();
    const invalidUpdate = await admin
      .put("/api/users/invalid")
      .send({ firstName: "Valid" });
    const nonexistentUpdate = await admin
      .put("/api/users/2147483647")
      .send({ firstName: "Valid" });
    const invalidDelete = await admin.delete("/api/users/invalid");
    const nonexistentDelete = await admin.delete("/api/users/2147483647");

    expect(invalidUpdate.status).toBe(400);
    expect(invalidUpdate.body.message).toBe("Invalid user ID");
    expect(nonexistentUpdate.status).toBe(404);
    expect(nonexistentUpdate.body.message).toBe("User not found");
    expect(invalidDelete.status).toBe(400);
    expect(invalidDelete.body.message).toBe("Invalid user ID");
    expect(nonexistentDelete.status).toBe(404);
    expect(nonexistentDelete.body.message).toBe("User not found");
  });
});
