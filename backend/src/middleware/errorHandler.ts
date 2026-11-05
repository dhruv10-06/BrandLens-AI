import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { isDev } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error] [${req.method} ${req.path}]:`, err.message || err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      error: 'Input validation failed.',
      validationErrors: formatted,
    });
    return;
  }

  // 2. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `A record with this ${key} already exists.`,
    });
    return;
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: `Invalid identifier format for parameter: ${err.path}.`,
    });
    return;
  }

  // 4. Multer Upload Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'Uploaded file exceeds the maximum allowed size limit (10MB).',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
    return;
  }

  // 5. Generic / Unhandled Internal Errors
  const statusCode = err.statusCode && typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = statusCode === 500 && !isDev
    ? 'An unexpected internal server error occurred. Please contact support.'
    : err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  });
}
