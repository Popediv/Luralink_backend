export function successResponse(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

export function errorResponse(res, statusCode, message, code) {
  return res.status(statusCode).json({
    success: false,
    error: { message, code }
  });
}