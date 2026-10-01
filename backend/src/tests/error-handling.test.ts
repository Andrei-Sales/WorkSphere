import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { AppError } from "../errors/app.error.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "../middleware/error.middleware.js";

const errorTestApp = express();

errorTestApp.get("/app-error/:status", (req, _res, next) => {
  next(new AppError("Contract error", Number(req.params.status)));
});
errorTestApp.get("/prisma/unique", (_req, _res, next) => {
  next(Object.assign(new Error("Unique constraint detail"), { code: "P2002" }));
});
errorTestApp.get("/prisma/not-found", (_req, _res, next) => {
  next(Object.assign(new Error("Record detail"), { code: "P2025" }));
});
errorTestApp.get("/unexpected", (_req, _res, next) => {
  next(new Error("Internal implementation detail"));
});
errorTestApp.use(notFoundMiddleware);
errorTestApp.use(errorMiddleware);

describe("Error middleware", () => {
  it.each([
    [400, "Contract error"],
    [401, "Contract error"],
    [403, "Contract error"],
    [404, "Contract error"],
    [409, "Contract error"],
  ])("should map AppError status %i and preserve its contract message", async (status, message) => {
    const response = await request(errorTestApp).get(`/app-error/${status}`);

    expect(response.status).toBe(status);
    expect(response.body).toEqual({
      success: false,
      message,
    });
  });

  it("should map Prisma unique violations to HTTP 409", async () => {
    const response = await request(errorTestApp).get("/prisma/unique");

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "A record with the same unique value already exists.",
    });
  });

  it("should map Prisma record-not-found errors to HTTP 404", async () => {
    const response = await request(errorTestApp).get("/prisma/not-found");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "The requested record was not found.",
    });
  });

  it("should return a generic HTTP 500 without exposing unexpected error details", async () => {
    const response = await request(errorTestApp).get("/unexpected");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Internal server error.",
    });
    expect(JSON.stringify(response.body)).not.toContain(
      "Internal implementation detail",
    );
  });

  it("should return the actual unknown-route response", async () => {
    const response = await request(errorTestApp).get("/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route not found: GET /unknown",
    });
  });
});
