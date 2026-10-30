import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';

type AnySchema = z.ZodType;

/**
 * Shared 400 shape for all validation failures. Zod 4 reports issues
 * (ZodError.issues); field paths keep the {body|query|params} prefix so
 * clients can map errors back to request locations.
 */
function validationError(res: Response, error: z.ZodError, message: string) {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

  logger.warn('Validation failed', { errors });

  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details: errors,
    },
  });
}

/**
 * Validate the full request against a schema shaped
 * z.object({ body?, query?, params? }).
 */
export const validate = (schema: AnySchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError(res, error, 'Invalid input data');
      }
      next(error);
    }
  };
};

/**
 * Validate only the request body. Schemas are shaped
 * z.object({ body: z.object({...}) }) to match validate(), so wrap the raw
 * body for parsing and store back the parsed (stripped + defaulted) inner
 * object.
 */
export const validateBody = (schema: AnySchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body }) as { body: unknown };
      req.body = parsed.body;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationError(res, error, 'Invalid request body');
      }
      next(error);
    }
  };
};
