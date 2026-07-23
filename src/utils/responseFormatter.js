function successResponse(res, statusCode = 200, data = {}) {
  return res.status(statusCode).json({ success: true, data });
}

function errorResponse(res, statusCode = 400, message = 'Request failed') {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { successResponse, errorResponse };
