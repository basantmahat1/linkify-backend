import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  if (err.name === "ValidationError") {
    statusCode = 422;
    const msgs = Object.values(err.errors || {}).map((e) => e.message);
    message = msgs[0] || "Validation failed";
    details = Object.entries(err.errors || {}).map(([path, e]) => ({
      path,
      message: e.message,
    }));
  }
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyPattern || {}).join(", ")}`;
  }
  if (!statusCode) statusCode = 500;
  if (!message) message = "Internal server error";

  if (statusCode >= 500) logger.error(`${req.method} ${req.originalUrl} - ${err.stack || err.message}`);
  else logger.warn(`${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV !== "production" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
