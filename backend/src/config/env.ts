import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not configured");
}

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const env = {
  jwtSecret,
  frontendUrl,
};
