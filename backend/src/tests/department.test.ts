import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";
import { loginAsAdmin, loginAsUser } from "./helpers/auth.helper.js";
import {
  cleanupTestRecords,
  createTestDepartmentData,
  createTestEmployeeData,
  createTestUserData,
} from "./helpers/test-data.helper.js";

describe("Department Management API", () => {
  it("should allow an admin to list, retrieve, create, update, and delete a department", async () => {
    const admin = await loginAsAdmin();
    const data = createTestDepartmentData();
    let departmentId: number | undefined;

    try {
      const list = await admin.get("/api/departments");
      expect(list.status).toBe(200);
      expect(list.body.success).toBe(true);
      expect(Array.isArray(list.body.data)).toBe(true);

      const created = await admin.post("/api/departments").send(data);
      expect(created.status).toBe(201);
      expect(created.body.success).toBe(true);
      expect(created.body.data.name).toBe(data.name);
      expect(created.body.data.employeeCount).toBe(0);
      departmentId = created.body.data.id as number;

      const detail = await admin.get(`/api/departments/${departmentId}`);
      expect(detail.status).toBe(200);
      expect(detail.body.success).toBe(true);
      expect(detail.body.data.id).toBe(departmentId);
      expect(detail.body.data.name).toBe(data.name);
      expect(detail.body.data.employeeCount).toBe(0);

      const updatedName = `${data.name} Updated`;
      const updated = await admin
        .put(`/api/departments/${departmentId}`)
        .send({ name: updatedName });
      expect(updated.status).toBe(200);
      expect(updated.body.success).toBe(true);
      expect(updated.body.data.name).toBe(updatedName);

      const deleted = await admin.delete(`/api/departments/${departmentId}`);
      expect(deleted.status).toBe(204);
      departmentId = undefined;

      const missing = await admin.get(
        `/api/departments/${created.body.data.id}`,
      );
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe("Department not found");
    } finally {
      if (departmentId !== undefined) {
        await cleanupTestRecords(admin, { departmentIds: [departmentId] });
      }
    }
  });

  it("should reject unauthenticated and normal-user department access", async () => {
    const user = await loginAsUser();
    const unauthenticated = await request(app).get("/api/departments");
    const list = await user.get("/api/departments");
    const create = await user
      .post("/api/departments")
      .send(createTestDepartmentData());

    expect(unauthenticated.status).toBe(401);
    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
  });

  it("should reject invalid IDs, missing names, and invalid names", async () => {
    const admin = await loginAsAdmin();
    const invalidGet = await admin.get("/api/departments/invalid");
    const missingGet = await admin.get("/api/departments/2147483647");
    const invalidDelete = await admin.delete("/api/departments/invalid");
    const missingDelete = await admin.delete("/api/departments/2147483647");
    const missingName = await admin.post("/api/departments").send({});
    const emptyName = await admin.post("/api/departments").send({ name: " " });
    const invalidUpdate = await admin
      .put("/api/departments/1")
      .send({ name: "" });

    expect(invalidGet.status).toBe(400);
    expect(invalidGet.body.message).toBe("Invalid department ID");
    expect(missingGet.status).toBe(404);
    expect(missingGet.body.message).toBe("Department not found");
    expect(invalidDelete.status).toBe(400);
    expect(missingDelete.status).toBe(404);

    expect(missingName.status).toBe(400);
    expect(missingName.body).toMatchObject({
      success: false,
      message: "Validation failed",
    });
    expect(emptyName.status).toBe(400);
    expect(emptyName.body).toEqual({
      success: false,
      message: "Department name is required",
    });
    expect(invalidUpdate.status).toBe(400);
    expect(invalidUpdate.body.message).toBe("Validation failed");
  });

  it("should reject duplicate department names on create and update", async () => {
    const admin = await loginAsAdmin();
    const firstData = createTestDepartmentData();
    const secondData = createTestDepartmentData();
    const ids: number[] = [];

    try {
      const first = await admin.post("/api/departments").send(firstData);
      expect(first.status).toBe(201);
      ids.push(first.body.data.id as number);
      const second = await admin.post("/api/departments").send(secondData);
      expect(second.status).toBe(201);
      ids.push(second.body.data.id as number);

      const duplicateCreate = await admin
        .post("/api/departments")
        .send(firstData);
      const duplicateUpdate = await admin
        .put(`/api/departments/${ids[1]}`)
        .send({ name: firstData.name });

      expect(duplicateCreate.status).toBe(409);
      expect(duplicateCreate.body.message).toBe("Department already exists");
      expect(duplicateUpdate.status).toBe(409);
      expect(duplicateUpdate.body.message).toBe("Department already exists");
    } finally {
      if (ids.length > 0) {
        await cleanupTestRecords(admin, { departmentIds: ids });
      }
    }
  });

  it("should prevent deletion of a department that has an assigned employee", async () => {
    const admin = await loginAsAdmin();
    const userData = createTestUserData();
    const departmentData = createTestDepartmentData();
    let userId: number | undefined;
    let departmentId: number | undefined;
    let employeeId: number | undefined;

    try {
      const user = await admin.post("/api/users").send(userData);
      expect(user.status).toBe(201);
      userId = user.body.data.id as number;

      const department = await admin
        .post("/api/departments")
        .send(departmentData);
      expect(department.status).toBe(201);
      departmentId = department.body.data.id as number;

      const employee = await admin
        .post("/api/employees")
        .send(createTestEmployeeData(userId, departmentId));
      expect(employee.status).toBe(201);
      employeeId = employee.body.data.id as number;

      const deletion = await admin.delete(
        `/api/departments/${departmentId}`,
      );
      expect(deletion.status).toBe(409);
      expect(deletion.body.message).toBe(
        "Cannot delete a department with assigned employees",
      );
    } finally {
      await cleanupTestRecords(admin, {
        employeeIds: employeeId === undefined ? [] : [employeeId],
        userIds: userId === undefined ? [] : [userId],
        departmentIds: departmentId === undefined ? [] : [departmentId],
      });
    }
  });
});
