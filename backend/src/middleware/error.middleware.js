import { ApiError } from "../utils/api-error.js";

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const isOperational = error instanceof ApiError;

  if (!isOperational) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: isOperational ? error.message : "Internal server error",
    details: error.details || null
  });
};
