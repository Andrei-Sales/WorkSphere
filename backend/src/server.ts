import prisma from "./config/database.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      const baseUrl = `http://localhost:${PORT}`;

      console.log("");
      console.log("==========================================");
      console.log("🚀 WorkSphere API is running!");
      console.log("==========================================");
      console.log(`🌐 API:      ${baseUrl}`);
      console.log(`❤️  Health:   ${baseUrl}/api/health`);
      console.log(`🗄️  Database: ${baseUrl}/api/health/database`);
      console.log("==========================================");
      console.log("");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();
