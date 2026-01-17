import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { isHttpError, HttpError } from "./errors";
import { logger } from "./logger";

/**
 * Express-compatible error handler wrapper
 * Wraps async route handlers and provides consistent error responses
 */
export function withErrors<T extends Request = Request>(
  handler: (req: T, res: Response) => Promise<{ status: number; data: any }>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await handler(req as T, res);
      return res.status(result.status).json(result.data);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request payload",
            details: error.issues.map((item) => ({
              path: String(item.path.join(".")),
              message: item.message,
            })),
          },
        });
      }

      if (isHttpError(error)) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: String(error.statusCode),
            message: error.message,
            details: error.details,
          },
        });
      }

      logger.error("Unhandled route error", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      });
    }
  };
}

/**
 * Helper to create JSON response
 */
export function json(status: number, data: any) {
  return { status, data };
}
