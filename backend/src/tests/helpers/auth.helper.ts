import request from "supertest";

import app from "../../app.js";

async function login(emailVariable: string, passwordVariable: string) {
  const email = process.env[emailVariable];
  const password = process.env[passwordVariable];

  if (!email || !password) {
    throw new Error(
      `${emailVariable} and ${passwordVariable} must be configured`,
    );
  }

  const agent = request.agent(app);

  const response = await agent.post("/api/auth/login").send({
    email,
    password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Test login failed with status ${response.status}: ${JSON.stringify(
        response.body,
      )}`,
    );
  }

  return agent;
}

export function createAuthSessions() {
  let adminSession: Promise<ReturnType<typeof request.agent>> | undefined;
  let userSession: Promise<ReturnType<typeof request.agent>> | undefined;

  return {
    loginAsAdmin() {
      if (!adminSession) {
        adminSession = login(
          "TEST_ADMIN_EMAIL",
          "TEST_ADMIN_PASSWORD",
        ).catch((error: unknown) => {
          adminSession = undefined;
          throw error;
        });
      }

      return adminSession;
    },
    loginAsUser() {
      if (!userSession) {
        userSession = login(
          "TEST_USER_EMAIL",
          "TEST_USER_PASSWORD",
        ).catch((error: unknown) => {
          userSession = undefined;
          throw error;
        });
      }

      return userSession;
    },
  };
}

export async function loginAsAdmin() {
  return login("TEST_ADMIN_EMAIL", "TEST_ADMIN_PASSWORD");
}

export async function loginAsUser() {
  return login("TEST_USER_EMAIL", "TEST_USER_PASSWORD");
}
