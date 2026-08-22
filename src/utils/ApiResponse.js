export function ApiResponse(res, statusCode, data, message = "Success", meta = undefined) {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}
