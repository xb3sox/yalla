import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validate } from '../../src/middleware/validation.middleware';

// Schemas follow the codebase convention: z.object({ body: z.object({...}) }).
// Regression test: validateBody previously parsed the raw body against the
// wrapped schema, so every request failed with 400 "body: Required" and
// register/login/refresh/preferences were unreachable.
const schema = z.object({
  body: z.object({
    phone: z.string().min(3),
    language: z.string().optional().default('en'),
  }),
});

function mockRes(): Response & { statusCode?: number; payload?: any } {
  const res: any = {};
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload: any) => {
    res.payload = payload;
    return res;
  });
  return res;
}

describe('validateBody', () => {
  it('accepts a flat request body and stores stripped/defaulted values', () => {
    const req = { body: { phone: '+966500000000', role: 'admin' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    validateBody(schema as any)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ phone: '+966500000000', language: 'en' });
  });

  it('rejects an invalid body with 400 VALIDATION_ERROR', () => {
    const req = { body: { phone: 'x' } } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    validateBody(schema as any)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.payload.error.code).toBe('VALIDATION_ERROR');
    expect(res.payload.error.details[0].field).toBe('body.phone');
  });
});

describe('validate (full request)', () => {
  it('still accepts wrapped body/query/params schemas', () => {
    const req = {
      body: { phone: '+966500000000' },
      query: {},
      params: {},
    } as unknown as Request;
    const res = mockRes();
    const next = jest.fn() as NextFunction;

    validate(schema as any)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
