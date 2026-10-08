import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('API Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Something went wrong while processing the image. Please try again.';

  res.status(status).json({
    success: false,
    error: message
  });
}
