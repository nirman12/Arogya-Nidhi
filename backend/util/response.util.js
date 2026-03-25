export function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, message = 'Internal Server Error', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}
