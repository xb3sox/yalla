import { Request, Response } from 'express';
import { handleStripeWebhook } from '../../../src/controllers/payment.controller';
import { stripe } from '../../../src/models/payment.model';

jest.mock('../../../src/models/payment.model', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  handleWebhook: jest.fn(),
}));

describe('Payment Controller - handleStripeWebhook', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockReq = {
      headers: { 'stripe-signature': 'sig_123' },
      body: 'raw_payload',
    };
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
    jest.clearAllMocks();
  });

  it('should return 400 with a generic error message when webhook signature verification fails, without leaking detailed raw error messages', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Secret key stripe_sk_live_12345 invalid or signature mismatch');
    });

    await handleStripeWebhook(mockReq as Request, mockRes as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'WEBHOOK_FAILED',
        message: 'Webhook verification failed',
      },
    });
  });
});
