import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";

describe("Health API", () => {
  it("should return API health status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "WorkSphere API is running",
    });
  });

  it("should return 404 for an unknown route", async () => {
    const response = await request(app).get("/api/does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Route not found: GET /api/does-not-exist",
    });
  });

  it("should return a successful database health response without database details", async () => {
    const response = await request(app).get("/api/health/database");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Database connection successful",
    });
    expect(response.body).not.toHaveProperty("host");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("connectionString");
    expect(response.body).not.toHaveProperty("query");
  });

  it("should reject malformed JSON and remain operational afterward", async () => {
    const malformed = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({
      success: false,
      message: "Invalid JSON request body.",
    });

    const health = await request(app).get("/api/health");

    expect(health.status).toBe(200);
    expect(health.body.success).toBe(true);
  });
});
