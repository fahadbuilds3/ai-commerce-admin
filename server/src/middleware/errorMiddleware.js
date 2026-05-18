const errorMiddleware = (err, req, res, next) => {
  // Ensure status code fallback and hide stacktrace in production
  const statusCode = err.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  let message = err.message || "Internal Server Error";

  // Optionally add additional details or log the error here
  // For production, never leak stack traces or sensitive info to client.

  res.status(statusCode).json({
    success: false,
    message,
    // details: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

export default errorMiddleware;