export const AUTH_COOKIE_NAME = "worksphere_auth";

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  // httpOnly: true,
  // secure: false,
  // sameSite: "lax" as const,
  // path: "/",
  maxAge: 60 * 60 * 1000,
};
