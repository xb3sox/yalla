import { Request, Response, NextFunction } from 'express';
import { sanitizeInput } from '../../src/middleware/security.middleware';

describe('Security Middleware - sanitizeInput', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should trim string inputs and strip HTML tags < and >', () => {
    mockReq.body = {
      title: '  <script>alert("xss")</script> Test Title  ',
      description: '<b>Safe text</b>',
    };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body).toEqual({
      title: 'scriptalert("xss")/script Test Title',
      description: 'bSafe text/b',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should prevent prototype pollution via __proto__ payloads', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "title": "Normal Title"}');
    mockReq.body = maliciousPayload;

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(mockReq.body).toEqual({ title: 'Normal Title' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should prevent prototype pollution via constructor and prototype keys', () => {
    mockReq.body = {
      constructor: { prototype: { polluted: true } },
      prototype: { polluted: true },
      safeField: 'Hello',
    };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(mockReq.body).toEqual({ safeField: 'Hello' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should correctly process nested objects and arrays', () => {
    mockReq.body = {
      user: {
        name: '  John Doe  ',
        tags: [' <tag1> ', ' <tag2> '],
      },
    };

    sanitizeInput(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.body).toEqual({
      user: {
        name: 'John Doe',
        tags: ['tag1', 'tag2'],
      },
    });
    expect(mockNext).toHaveBeenCalled();
  });
});
