import { ApiError } from "../utils/ApiError.js"

const errorHandler = (err, req, res, next) => {
  let error = err

  
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500
    const message = error.message || "Something went wrong"
    error = new ApiError(statusCode, message, error?.errors || [], err.stack)
  }

  
  if (process.env.NODE_ENV === "development") {
    if (error.statusCode >= 500) {
      console.error("Error:", {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        errors: error.errors,
      });
    } else {
      console.warn(`[Client Warning] ${error.statusCode} - ${error.message} (${req.method} ${req.originalUrl})`);
    }
  }

 
  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    ...(error.errors.length > 0 && { errors: error.errors }),
  }

  res.status(error.statusCode).json(response)
}

export { errorHandler }
