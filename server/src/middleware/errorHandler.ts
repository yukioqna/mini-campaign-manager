import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Trust err.status / err.statusCode from lower-level middleware (e.g. body-parser)
  if (typeof (err as any).status === 'number') {
    res.status((err as any).status).json({ error: 'Invalid JSON body' });
    return;
  }
  if (typeof (err as any).statusCode === 'number') {
    res.status((err as any).statusCode).json({ error: 'Invalid JSON body' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
