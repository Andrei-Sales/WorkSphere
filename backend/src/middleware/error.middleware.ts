import type { ErrorRequestHandler, RequestHandler } from "express";

type ErrorWithCode = Error & {
  code?: string;
  status?: number;
  statusCode?: number;
};

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error("Unhandled application error:", error);

  const typedError = error as ErrorWithCode;

  /*
   * Invalid JSON request body.
   */
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON request body.",
    });
    return;
  }

  /*
   * Prisma unique constraint violation.
   */
  if (typedError.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists.",
    });
    return;
  }

  /*
   * Prisma record-not-found error.
   */
  if (typedError.code === "P2025") {
    res.status(404).json({
      success: false,
      message: "The requested record was not found.",
    });
    return;
  }

  /*
   * Application errors.
   */
  if (
    typeof typedError.statusCode === "number" &&
    typedError.statusCode >= 400 &&
    typedError.statusCode < 500
  ) {
    res.status(typedError.statusCode).json({
      success: false,
      message: typedError.message,
    });
    return;
  }

  /*
   * Unexpected errors.
   *
   * Do not expose database/server implementation details.
   */
  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};
