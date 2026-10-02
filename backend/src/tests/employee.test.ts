import { describe, expect, it } from "vitest";

import { loginAsAdmin } from "./helpers/auth.helper.js";
import {
  cleanupTestRecords,
  createTestDepartmentData,
  createTestEmployeeData,
  createTestUserData,
} from "./helpers/test-data.helper.js";

describe("Employee Management API", () => {
  it("should create, list, retrieve, update, and delete an employee", async () => {
    const admin = await loginAsAdmin();
    const firstUserData = createTestUserData();
    const secondUserData = createTestUserData();
    const firstDepartmentData = createTestDepartmentData();
    const secondDepartmentData = createTestDepartmentData();
    const userIds: number[] = [];
    const departmentIds: number[] = [];
    let employeeId: number | undefined;

    try {
      const firstUser = await admin.post("/api/users").send(firstUserData);
      expect(firstUser.status).toBe(201);
      userIds.push(firstUser.body.data.id as number);
      const secondUser = await admin.post("/api/users").send(secondUserData);
      expect(secondUser.status).toBe(201);
      userIds.push(secondUser.body.data.id as number);
      const firstDepartment = await admin
        .post("/api/departments")
        .send(firstDepartmentData);
      expect(firstDepartment.status).toBe(201);
      departmentIds.push(firstDepartment.body.data.id as number);
      const secondDepartment = await admin
        .post("/api/departments")
        .send(secondDepartmentData);
      expect(secondDepartment.status).toBe(201);
      departmentIds.push(secondDepartment.body.data.id as number);

      const employeeData = createTestEmployeeData(userIds[0], departmentIds[0]);
      const created = await admin.post("/api/employees").send(employeeData);
      expect(created.status).toBe(201);
      expect(created.body.success).toBe(true);
      expect(created.body.data.employeeNumber).toBe(
        employeeData.employeeNumber,
      );
      expect(created.body.data.position).toBe(employeeData.position);
      expect(created.body.data.status).toBe("ACTIVE");
      expect(created.body.data.userId).toBe(userIds[0]);
      expect(created.body.data.departmentId).toBe(departmentIds[0]);
      expect(created.body.data.department.name).toBe(firstDepartmentData.name);
      expect(created.body.data.user.email).toBe(firstUserData.email);
      expect(created.body.data.user).not.toHaveProperty("passwordHash");
      employeeId = created.body.data.id as number;

      const list = await admin.get("/api/employees");
      expect(list.status).toBe(200);
      expect(list.body.success).toBe(true);
      expect(
        list.body.data.some(
          (employee: { id: number }) => employee.id === employeeId,
        ),
      ).toBe(true);
      expect(
        list.body.data.every(
          (employee: { user: Record<string, unknown> }) =>
            !("passwordHash" in employee.user),
        ),
      ).toBe(true);

      const detail = await admin.get(`/api/employees/${employeeId}`);
      expect(detail.status).toBe(200);
      expect(detail.body.success).toBe(true);
      expect(detail.body.data.id).toBe(employeeId);
      expect(detail.body.data.employeeNumber).toBe(employeeData.employeeNumber);

      const updated = await admin.put(`/api/employees/${employeeId}`).send({
        position: "Senior QA Engineer",
        userId: userIds[1],
        departmentId: departmentIds[1],
      });
      expect(updated.status).toBe(200);
      expect(updated.body.success).toBe(true);
      expect(updated.body.data.position).toBe("Senior QA Engineer");
      expect(updated.body.data.userId).toBe(userIds[1]);
      expect(updated.body.data.user.email).toBe(secondUserData.email);
      expect(updated.body.data.departmentId).toBe(departmentIds[1]);
      expect(updated.body.data.department.name).toBe(secondDepartmentData.name);

      const deleted = await admin.delete(`/api/employees/${employeeId}`);
      expect(deleted.status).toBe(204);
      employeeId = undefined;

      const missing = await admin.get(`/api/employees/${created.body.data.id}`);
      expect(missing.status).toBe(404);
      expect(missing.body.message).toBe("Employee not found");
    } finally {
      await cleanupTestRecords(admin, {
        employeeIds: employeeId === undefined ? [] : [employeeId],
        userIds,
        departmentIds,
      });
    }
  }, 15000);

  it("should reject invalid employee payloads including a missing employee number", async () => {
    const admin = await loginAsAdmin();
    const missingNumber = await admin.post("/api/employees").send({
      firstName: "Test",
      lastName: "Employee",
      position: "QA Engineer",
      hireDate: "2024-01-15",
      userId: 1,
      departmentId: 1,
    });
    const invalidPayload = await admin.post("/api/employees").send({
      ...createTestEmployeeData(1, 1),
      hireDate: "not-a-date",
    });
    const invalidUpdate = await admin
      .put("/api/employees/1")
      .send({ status: "PENDING" });

    for (const response of [missingNumber, invalidPayload, invalidUpdate]) {
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(Array.isArray(response.body.errors)).toBe(true);
    }
    expect(
      missingNumber.body.errors.some((issue: { path: string[] }) =>
        issue.path.includes("employeeNumber"),
      ),
    ).toBe(true);
  });

  it("should reject invalid IDs and nonexistent employees", async () => {
    const admin = await loginAsAdmin();
    const invalidGet = await admin.get("/api/employees/invalid");
    const missingGet = await admin.get("/api/employees/2147483647");
    const invalidUpdate = await admin
      .put("/api/employees/invalid")
      .send({ position: "Valid" });
    const missingUpdate = await admin
      .put("/api/employees/2147483647")
      .send({ position: "Valid" });
    const invalidDelete = await admin.delete("/api/employees/invalid");
    const missingDelete = await admin.delete("/api/employees/2147483647");

    expect(invalidGet.status).toBe(400);
    expect(invalidGet.body.message).toBe("Invalid employee ID");
    expect(missingGet.status).toBe(404);
    expect(missingGet.body.message).toBe("Employee not found");
    expect(invalidUpdate.status).toBe(400);
    expect(missingUpdate.status).toBe(404);
    expect(invalidDelete.status).toBe(400);
    expect(missingDelete.status).toBe(404);
  });

  it("should validate user and department references and enforce uniqueness rules", async () => {
    const admin = await loginAsAdmin();
    const firstUserData = createTestUserData();
    const secondUserData = createTestUserData();
    const unassignedUserData = createTestUserData();
    const departmentData = createTestDepartmentData();
    const userIds: number[] = [];
    let departmentId: number | undefined;
    const employeeIds: number[] = [];

    try {
      const firstUser = await admin.post("/api/users").send(firstUserData);
      expect(firstUser.status).toBe(201);
      userIds.push(firstUser.body.data.id as number);
      const secondUser = await admin.post("/api/users").send(secondUserData);
      expect(secondUser.status).toBe(201);
      userIds.push(secondUser.body.data.id as number);
      const unassignedUser = await admin
        .post("/api/users")
        .send(unassignedUserData);
      expect(unassignedUser.status).toBe(201);
      userIds.push(unassignedUser.body.data.id as number);

      const department = await admin
        .post("/api/departments")
        .send(departmentData);
      expect(department.status).toBe(201);
      departmentId = department.body.data.id as number;

      const firstEmployee = await admin
        .post("/api/employees")
        .send(createTestEmployeeData(userIds[0], departmentId));
      expect(firstEmployee.status).toBe(201);
      employeeIds.push(firstEmployee.body.data.id as number);
      const secondEmployee = await admin
        .post("/api/employees")
        .send(createTestEmployeeData(userIds[1], departmentId));
      expect(secondEmployee.status).toBe(201);
      employeeIds.push(secondEmployee.body.data.id as number);

      const duplicateNumber = await admin.post("/api/employees").send({
        ...createTestEmployeeData(2147483647, departmentId),
        employeeNumber: firstEmployee.body.data.employeeNumber,
      });
      const assignedUser = await admin
        .post("/api/employees")
        .send(createTestEmployeeData(userIds[0], departmentId));
      const nonexistentUser = await admin.post("/api/employees").send({
        ...createTestEmployeeData(2147483647, departmentId),
      });
      const invalidUserId = await admin.post("/api/employees").send({
        ...createTestEmployeeData(0, departmentId),
      });
      const nonexistentDepartment = await admin.post("/api/employees").send({
        ...createTestEmployeeData(userIds[2], 2147483647),
      });
      const invalidDepartmentId = await admin.post("/api/employees").send({
        ...createTestEmployeeData(userIds[2], 0),
      });
      const conflictingUserUpdate = await admin
        .put(`/api/employees/${employeeIds[0]}`)
        .send({ userId: userIds[1] });
      const nonexistentUserUpdate = await admin
        .put(`/api/employees/${employeeIds[0]}`)
        .send({ userId: 2147483647 });
      const nonexistentDepartmentUpdate = await admin
        .put(`/api/employees/${employeeIds[0]}`)
        .send({ departmentId: 2147483647 });

      expect(duplicateNumber.status).toBe(409);
      expect(duplicateNumber.body.message).toBe(
        "Employee number already exists",
      );
      expect(assignedUser.status).toBe(409);
      expect(assignedUser.body.message).toBe(
        "User is already assigned to an employee",
      );
      expect(nonexistentUser.status).toBe(404);
      expect(nonexistentUser.body.message).toBe("User not found");
      expect(invalidUserId.status).toBe(400);
      expect(nonexistentDepartment.status).toBe(404);
      expect(nonexistentDepartment.body.message).toBe("Department not found");
      expect(invalidDepartmentId.status).toBe(400);
      expect(conflictingUserUpdate.status).toBe(409);
      expect(conflictingUserUpdate.body.message).toBe(
        "User is already assigned to an employee",
      );
      expect(nonexistentUserUpdate.status).toBe(404);
      expect(nonexistentUserUpdate.body.message).toBe("User not found");
      expect(nonexistentDepartmentUpdate.status).toBe(404);
      expect(nonexistentDepartmentUpdate.body.message).toBe(
        "Department not found",
      );
    } finally {
      await cleanupTestRecords(admin, {
        employeeIds,
        userIds,
        departmentIds: departmentId === undefined ? [] : [departmentId],
      });
    }
  });
});
