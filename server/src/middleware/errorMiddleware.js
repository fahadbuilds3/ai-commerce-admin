const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  if (statusCode >= 500) {
    console.error("Unhandled server error:", err);

    return res.status(statusCode).json({
      message: "Internal server error",
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Request failed",
  });
};

export default errorMiddleware;
