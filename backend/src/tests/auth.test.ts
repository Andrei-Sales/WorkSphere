import request from "supertest";
import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

import app from "../app.js";
import { env } from "../config/env.js";
import { AUTH_COOKIE_NAME } from "../config/cookie.js";
import { loginAsAdmin, loginAsUser } from "./helpers/auth.helper.js";
import {
  cleanupTestRecords,
  createTestUserData,
} from "./helpers/test-data.helper.js";

describe("Authentication API", () => {
  it("should reject login with invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "nonexistent-user@worksphere.test",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("should reject /me when not authenticated", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should reject logout when not authenticated", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      success: false,
      message: "Authentication required",
    });
  });

  it("should continue responding after an invalid login attempt", async () => {
    const failedLogin = await request(app).post("/api/auth/login").send({
      email: "nonexistent-user@worksphere.test",
      password: "WrongPassword123!",
    });

    expect(failedLogin.status).toBe(401);

    const healthResponse = await request(app).get("/api/health");

    expect(healthResponse.status).toBe(200);

    expect(healthResponse.body).toEqual({
      success: true,
      message: "WorkSphere API is running",
    });
  });

  it("should log in the configured admin and return a safe user object", async () => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    expect(email && password).toBeTruthy();

    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.user.roleId).toBe(1);
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("token");
  });

  it("should log in the configured normal user and return a safe user object", async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    expect(email && password).toBeTruthy();

    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(email);
    expect(response.body.data.user.roleId).toBe(2);
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.body).not.toHaveProperty("token");
  });

  it("should reject an invalid email format and missing login fields", async () => {
    const invalidEmail = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "does-not-matter",
    });
    const missingEmail = await request(app).post("/api/auth/login").send({
      password: "does-not-matter",
    });
    const missingPassword = await request(app).post("/api/auth/login").send({
      email: process.env.TEST_ADMIN_EMAIL,
    });

    expect(invalidEmail.status).toBe(401);
    expect(invalidEmail.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });

    for (const response of [missingEmail, missingPassword]) {
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: "Internal server error.",
      });
    }
  });

  it("should reject an invalid password for an existing account", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: process.env.TEST_ADMIN_EMAIL,
      password: "IncorrectTestPassword!",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid email or password",
    });
  });

  it("should set the authentication cookie and serve /me for both configured roles", async () => {
    const admin = await loginAsAdmin();
    const adminMe = await admin.get("/api/auth/me");

    expect(adminMe.status).toBe(200);
    expect(adminMe.body.success).toBe(true);
    expect(adminMe.body.data.email).toBe(process.env.TEST_ADMIN_EMAIL);
    expect(adminMe.body.data).not.toHaveProperty("passwordHash");

    const user = await loginAsUser();
    const userMe = await user.get("/api/auth/me");

    expect(userMe.status).toBe(200);
    expect(userMe.body.success).toBe(true);
    expect(userMe.body.data.email).toBe(process.env.TEST_USER_EMAIL);
    expect(userMe.body.data).not.toHaveProperty("passwordHash");
  });

  it("should clear the authentication cookie on authenticated logout", async () => {
    const admin = await loginAsAdmin();
    const logout = await admin.post("/api/auth/logout");
    const rawSetCookie: unknown = logout.headers["set-cookie"];
    const cookieHeaders: unknown[] = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : [rawSetCookie];
    const clearedCookie =
      cookieHeaders.find(
        (cookie): cookie is string =>
          typeof cookie === "string" &&
          cookie.startsWith(`${AUTH_COOKIE_NAME}=`),
      ) ?? "";
    const cookieAttributes = clearedCookie.toLowerCase();

    expect(logout.status).toBe(200);
    expect(logout.body).toEqual({
      success: true,
      message: "Logged out successfully",
    });
    expect(Boolean(clearedCookie)).toBe(true);
    expect(cookieAttributes).toContain("httponly");
    expect(cookieAttributes).toContain(
      "expires=thu, 01 jan 1970 00:00:00 gmt",
    );

    const me = await admin.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("should reject an invalid JWT", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=not-a-valid-jwt`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid or expired authentication token",
    });
  });

  it("should reject an expired JWT without waiting for a timing boundary", async () => {
    const token = jwt.sign(
      { userId: 1, roleId: 1 },
      env.jwtSecret,
      { expiresIn: "-1s" },
    );
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid or expired authentication token",
    );
  });

  it("should reject a valid JWT referring to a nonexistent user", async () => {
    const token = jwt.sign(
      { userId: 2147483647, roleId: 2 },
      env.jwtSecret,
      { expiresIn: "1h" },
    );
    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: "User account no longer exists",
    });
  });

  it("should reject inactive-user login and an existing inactive-user session", async () => {
    const admin = await loginAsAdmin();
    const testUser = createTestUserData();
    let userId: number | undefined;

    try {
      const created = await admin.post("/api/users").send(testUser);
      expect(created.status).toBe(201);
      userId = created.body.data.id as number;

      const activeAgent = request.agent(app);
      const login = await activeAgent.post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(login.status).toBe(200);

      const deactivated = await admin
        .put(`/api/users/${userId}`)
        .send({ status: "INACTIVE" });
      expect(deactivated.status).toBe(200);
      expect(deactivated.body.data.status).toBe("INACTIVE");

      const activeSession = await activeAgent.get("/api/auth/me");
      expect(activeSession.status).toBe(403);
      expect(activeSession.body.message).toBe(
        "Your account is inactive. Please contact an administrator.",
      );

      const inactiveLogin = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(inactiveLogin.status).toBe(403);
      expect(inactiveLogin.body.message).toBe(
        "Your account is inactive. Please contact an administrator.",
      );
    } finally {
      if (userId !== undefined) {
        await cleanupTestRecords(admin, { userIds: [userId] });
      }
    }
  });
});
