import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');

  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status === 500 ? 'Unexpected server error' : err.message;

  res.status(status).json({
    status: 'error',
    message,
    details: err.details ?? undefined
  });
};
