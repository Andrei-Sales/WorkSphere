import { randomUUID } from "node:crypto";
import request from "supertest";

const uniqueId = () => `${Date.now()}-${randomUUID().slice(0, 8)}`;

export function createTestUserData(roleId = 2) {
  const id = uniqueId();

  return {
    email: `test-${id}@worksphere.test`,
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "User",
    roleId,
  };
}

export function createTestDepartmentData() {
  return {
    name: `Test Department ${uniqueId()}`,
  };
}

export function createTestEmployeeData(userId: number, departmentId: number) {
  return {
    employeeNumber: `TEST-${uniqueId()}`,
    firstName: "Test",
    lastName: "Employee",
    position: "QA Engineer",
    hireDate: "2024-01-15",
    userId,
    departmentId,
  };
}

type TestAgent = ReturnType<typeof request.agent>;

export async function cleanupTestRecords(
  admin: TestAgent,
  records: {
    employeeIds?: number[];
    userIds?: number[];
    departmentIds?: number[];
  },
) {
  const failures: string[] = [];
  const cleanupSteps = [
    ...(records.employeeIds ?? []).map((id) => ({
      type: "employee",
      id,
      remove: () => admin.delete(`/api/employees/${id}`),
    })),
    ...(records.userIds ?? []).map((id) => ({
      type: "user",
      id,
      remove: () => admin.delete(`/api/users/${id}`),
    })),
    ...(records.departmentIds ?? []).map((id) => ({
      type: "department",
      id,
      remove: () => admin.delete(`/api/departments/${id}`),
    })),
  ];

  let employeeCleanupFailed = false;

  for (const step of cleanupSteps) {
    if (step.type !== "employee" && employeeCleanupFailed) {
      break;
    }

    try {
      const response = await step.remove();

      if (response.status !== 204) {
        failures.push(`${step.type} ${step.id}: HTTP ${response.status}`);
        if (step.type === "employee") {
          employeeCleanupFailed = true;
        }
      }
    } catch {
      failures.push(`${step.type} ${step.id}: request failed`);
      if (step.type === "employee") {
        employeeCleanupFailed = true;
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Test data cleanup failed (${failures.join(", ")})`);
  }
}
