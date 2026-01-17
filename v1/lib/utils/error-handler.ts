import { ZodError } from "zod";
import { isHttpError } from "./errors";
import { logger } from "./logger";

export type RequestHandler<TRequest> = (request: TRequest) => Promise<Response>;

export function makeErrorHandler<TRequest = Request>() {
  return (handler: RequestHandler<TRequest>): RequestHandler<TRequest> => {
    return async (request: TRequest): Promise<Response | any> => {
      try {
        return await handler(request);
      } catch (error) {
        if (error instanceof ZodError) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Invalid request payload",
                details: error.issues.map(
                  (item: { path: PropertyKey[]; message: string }) => ({
                    path: String(item.path.join(".")),
                    message: item.message,
                  }),
                ),
              },
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (isHttpError(error)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: {
                code: String(error.statusCode),
                message: error.message,
                details: error.details,
              },
            }),
            {
              status: error.statusCode,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        logger.error("Unhandled route error", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "An unexpected error occurred",
            },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    };
  };
}
