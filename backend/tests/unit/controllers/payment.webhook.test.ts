import { Request, Response } from 'express';
import { handleStripeWebhook } from '../../../src/controllers/payment.controller';
import { stripe } from '../../../src/models/payment.model';
import config from '../../../src/config';

jest.mock('../../../src/models/payment.model', () => ({
  __esModule: true,
  default: { handleWebhook: jest.fn() },
  stripe: { webhooks: { constructEvent: jest.fn() } },
}));
jest.mock('../../../src/models/reservation.model', () => ({ __esModule: true, default: {} }));
jest.mock('../../../src/models/experience.model', () => ({ __esModule: true, default: {} }));

import paymentModel from '../../../src/models/payment.model';

describe('Stripe webhook handler', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    req = {
      headers: { 'stripe-signature': 'sig_test_123' },
      body: { id: 'evt_1', type: 'payment_intent.succeeded' },
    } as unknown as Partial<Request>;
    (config.stripe as any).webhookSecret = 'whsec_test';
  });

  it('verifies the signature against the RAW body, not the parsed object', async () => {
    const rawBody = Buffer.from('{"id":"evt_1","type":"payment_intent.succeeded"}');
    (req as any).rawBody = rawBody;
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
    });

    await handleStripeWebhook(req as Request, res as Response);

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      rawBody,
      'sig_test_123',
      'whsec_test'
    );
    expect(paymentModel.handleWebhook).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(400);
  });

  it('rejects the request when no signature header is present', async () => {
    req.headers = {};
    await handleStripeWebhook(req as Request, res as Response);

    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'MISSING_SIGNATURE' }),
      })
    );
  });

  it('fails closed when the webhook secret is not configured', async () => {
    (config.stripe as any).webhookSecret = '';
    await handleStripeWebhook(req as Request, res as Response);

    expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('does not leak verification internals to the caller on failure', async () => {
    (req as any).rawBody = Buffer.from('{}');
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    await handleStripeWebhook(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.error.message).toBe('Webhook signature verification failed');
    expect(JSON.stringify(payload)).not.toContain('No signatures found');
  });
});
