import request from 'supertest';
import app from '../../../src/server';
import smsLogModel from '../../../src/models/smsLog.model';

describe('SMS Status Webhook API (/api/v1/webhooks/sms/status)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update status for Twilio delivery reports (MessageSid, MessageStatus)', async () => {
    const mockRecord = {
      id: 'uuid-1',
      phone_number: '+966512345678',
      provider: 'twilio',
      message_type: '24h_reconfirmation',
      status: 'delivered' as const,
      provider_message_id: 'SM1234567890',
      created_at: new Date(),
    };

    jest.spyOn(smsLogModel, 'updateStatusByProviderMessageId').mockResolvedValue(mockRecord as any);

    const res = await request(app)
      .post('/api/v1/webhooks/sms/status')
      .send({
        MessageSid: 'SM1234567890',
        MessageStatus: 'delivered',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.providerMessageId).toBe('SM1234567890');
    expect(res.body.data.status).toBe('delivered');
    expect(smsLogModel.updateStatusByProviderMessageId).toHaveBeenCalledWith(
      'SM1234567890',
      'delivered',
      null
    );
  });

  it('should update status for Unifonic delivery reports (id, status)', async () => {
    const mockRecord = {
      id: 'uuid-2',
      phone_number: '+966512345678',
      provider: 'unifonic',
      message_type: 'arrival_pin_unlocked',
      status: 'delivered' as const,
      provider_message_id: 'unifonic-98765',
      created_at: new Date(),
    };

    jest.spyOn(smsLogModel, 'updateStatusByProviderMessageId').mockResolvedValue(mockRecord as any);

    const res = await request(app)
      .post('/api/v1/webhooks/sms/status')
      .send({
        id: 'unifonic-98765',
        status: 'Delivered',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.providerMessageId).toBe('unifonic-98765');
    expect(res.body.data.status).toBe('delivered');
  });

  it('should handle failed status updates with error message', async () => {
    jest.spyOn(smsLogModel, 'updateStatusByProviderMessageId').mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/webhooks/sms/status')
      .send({
        MessageSid: 'SM1234567890',
        MessageStatus: 'failed',
        ErrorMessage: 'Carrier undeliverable',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('failed');
    expect(smsLogModel.updateStatusByProviderMessageId).toHaveBeenCalledWith(
      'SM1234567890',
      'failed',
      'Carrier undeliverable'
    );
  });

  it('should return 400 when messageId is missing in webhook body', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/sms/status')
      .send({
        someOtherField: 'value',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_MESSAGE_ID');
  });
});
