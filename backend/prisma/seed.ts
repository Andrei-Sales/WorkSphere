import "dotenv/config";

import bcrypt from "bcrypt";
import prisma from "../src/config/database";

async function main() {
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const adminPassword = process.env.TEST_ADMIN_PASSWORD;

  const userEmail = process.env.TEST_USER_EMAIL;
  const userPassword = process.env.TEST_USER_PASSWORD;

  if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
    throw new Error(
      "TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_USER_EMAIL, and TEST_USER_PASSWORD are required.",
    );
  }

  console.log("Seeding WorkSphere CI database...");

  // --------------------------------------------------
  // Roles
  // --------------------------------------------------

  const adminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {
      name: "ADMIN",
    },
    create: {
      id: 1,
      name: "ADMIN",
    },
  });

  const userRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {
      name: "USER",
    },
    create: {
      id: 2,
      name: "USER",
    },
  });

  // --------------------------------------------------
  // Test admin
  // --------------------------------------------------

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      passwordHash: adminPasswordHash,
      firstName: "Test",
      lastName: "Admin",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: "Test",
      lastName: "Admin",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });

  // --------------------------------------------------
  // Test regular user
  // --------------------------------------------------

  const userPasswordHash = await bcrypt.hash(userPassword, 12);

  await prisma.user.upsert({
    where: {
      email: userEmail,
    },
    update: {
      passwordHash: userPasswordHash,
      firstName: "Test",
      lastName: "User",
      roleId: userRole.id,
      status: "ACTIVE",
    },
    create: {
      email: userEmail,
      passwordHash: userPasswordHash,
      firstName: "Test",
      lastName: "User",
      roleId: userRole.id,
      status: "ACTIVE",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
