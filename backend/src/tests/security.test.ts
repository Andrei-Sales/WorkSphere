import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";
import { AUTH_COOKIE_NAME, authCookieOptions } from "../config/cookie.js";
import { env } from "../config/env.js";
import { loginAsAdmin } from "./helpers/auth.helper.js";

describe("Security configuration and response data", () => {
  it("should set an httpOnly authentication cookie with the configured secure policy", async () => {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    const response = await request(app).post("/api/auth/login").send({
      email,
      password,
    });
    const rawSetCookie: unknown = response.headers["set-cookie"];
    const cookieHeaders: unknown[] = Array.isArray(rawSetCookie)
      ? rawSetCookie
      : [rawSetCookie];
    const authCookie =
      cookieHeaders.find(
        (cookie): cookie is string =>
          typeof cookie === "string" &&
          cookie.startsWith(`${AUTH_COOKIE_NAME}=`),
      ) ?? "";
    const cookieAttributes = authCookie
      .split(";")
      .slice(1)
      .map((attribute) => attribute.trim().toLowerCase());

    expect(response.status).toBe(200);
    expect(Boolean(authCookie)).toBe(true);
    expect(authCookie.split(";")[0].split("=")[0]).toBe(AUTH_COOKIE_NAME);
    expect(cookieAttributes).toContain("httponly");
    expect(cookieAttributes).toContain("samesite=lax");
    expect(cookieAttributes).toContain("path=/");
    expect(
      cookieAttributes.includes("secure"),
    ).toBe(authCookieOptions.secure);
  });

  it("should enable Helmet security headers and disable x-powered-by", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["content-security-policy"]).toBeTruthy();
  });

  it("should restrict credentialed CORS requests to FRONTEND_URL", async () => {
    const response = await request(app)
      .options("/api/health")
      .set("Origin", env.frontendUrl)
      .set("Access-Control-Request-Method", "GET");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      env.frontendUrl,
    );
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("should not return password hashes or JWTs in authenticated API bodies", async () => {
    const admin = await loginAsAdmin();
    const [profile, users] = await Promise.all([
      admin.get("/api/auth/me"),
      admin.get("/api/users"),
    ]);

    expect(profile.status).toBe(200);
    expect(profile.body.data).not.toHaveProperty("passwordHash");
    expect(profile.body.data).not.toHaveProperty("token");
    expect(users.status).toBe(200);
    expect(
      users.body.data.every(
        (user: Record<string, unknown>) =>
          !("passwordHash" in user) && !("token" in user),
      ),
    ).toBe(true);
  });

  it("should set the cookie Secure flag only when NODE_ENV is production", async () => {
    expect(authCookieOptions.secure).toBe(process.env.NODE_ENV === "production");
  });
});
