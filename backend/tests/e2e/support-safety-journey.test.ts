import request from 'supertest';
import app from '../../src/server';
import pool from '../../src/config/database';

describe('Complete User Journey - Support & Safety', () => {
  let participantToken: string;
  let supportToken: string;
  let trustSafetyToken: string;
  let supportCaseId: string;
  let safetyCaseId: string;

  beforeAll(async () => {
    // Clean up
    await pool.query("DELETE FROM users WHERE phone IN ('+966507777771', '+966507777772', '+966507777773')");

    // Create participant
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966507777771',
        password: 'password123',
        display_name: 'Support Test Participant',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    const partLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966507777771',
        password: 'password123',
      });

    participantToken = partLogin.body.data.tokens.accessToken;

    // Create support staff
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966507777772',
        password: 'password123',
        display_name: 'Support Staff',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'support' WHERE phone = '+966507777772'"
    );

    const supportLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966507777772',
        password: 'password123',
      });

    supportToken = supportLogin.body.data.tokens.accessToken;

    // Create trust & safety staff
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966507777773',
        password: 'password123',
        display_name: 'Trust & Safety Staff',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'trust_safety' WHERE phone = '+966507777773'"
    );

    const tsLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966507777773',
        password: 'password123',
      });

    trustSafetyToken = tsLogin.body.data.tokens.accessToken;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('Part 1: Support Requests', () => {
    describe('Step 1: Participant Creates Support Request', () => {
      it('should create operational support request', async () => {
        const response = await request(app)
          .post('/api/v1/support-requests')
          .set('Authorization', `Bearer ${participantToken}`)
          .send({
            type: 'operational',
            subject: 'Need help with booking',
            subject_ar: 'أحتاج مساعدة في الحجز',
            description: 'I cannot complete my booking',
            description_ar: 'لا يمكنني إكمال حجزي',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        supportCaseId = response.body.data.supportRequest.id;
      });

      it('should create safety report', async () => {
        const response = await request(app)
          .post('/api/v1/support-requests')
          .set('Authorization', `Bearer ${participantToken}`)
          .send({
            type: 'report',
            subject: 'Safety concern',
            subject_ar: 'مخاوف تتعلق بالسلامة',
            description: 'Felt unsafe during experience',
            description_ar: 'شعرت بعدم الأمان أثناء التجربة',
            target_entity_type: 'host',
            target_entity_id: 'host-123',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Step 2: Support Staff Views Requests', () => {
      it('should get all support requests', async () => {
        const response = await request(app)
          .get('/api/v1/support-requests')
          .set('Authorization', `Bearer ${supportToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requests).toBeDefined();
        expect(response.body.data.requests.length).toBeGreaterThan(0);
      });

      it('should filter by type', async () => {
        const response = await request(app)
          .get('/api/v1/support-requests')
          .query({ type: 'operational' })
          .set('Authorization', `Bearer ${supportToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(
          response.body.data.requests.every((r: any) => r.type === 'operational')
        ).toBe(true);
      });

      it('should filter by state', async () => {
        const response = await request(app)
          .get('/api/v1/support-requests')
          .query({ state: 'submitted' })
          .set('Authorization', `Bearer ${supportToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(
          response.body.data.requests.every((r: any) => r.state === 'submitted')
        ).toBe(true);
      });
    });

    describe('Step 3: Support Staff Updates Request', () => {
      it('should update request state to in_progress', async () => {
        const response = await request(app)
          .put(`/api/v1/support-requests/${supportCaseId}`)
          .set('Authorization', `Bearer ${supportToken}`)
          .send({ state: 'in_progress' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.request.state).toBe('in_progress');
      });

      it('should add response to request', async () => {
        const response = await request(app)
          .post(`/api/v1/support-requests/${supportCaseId}/responses`)
          .set('Authorization', `Bearer ${supportToken}`)
          .send({
            message: 'We are looking into your issue',
            message_ar: 'نحن ننظر في مشكلتك',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should update request state to resolved', async () => {
        const response = await request(app)
          .put(`/api/v1/support-requests/${supportCaseId}`)
          .set('Authorization', `Bearer ${supportToken}`)
          .send({ state: 'resolved' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.request.state).toBe('resolved');
      });
    });

    describe('Step 4: Participant Views Support History', () => {
      it('should get user support requests', async () => {
        const response = await request(app)
          .get('/api/v1/support-requests/my-requests')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requests).toBeDefined();
        expect(response.body.data.requests.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Part 2: Safety Cases', () => {
    describe('Step 1: Participant Reports Safety Issue', () => {
      it('should create safety case', async () => {
        const response = await request(app)
          .post('/api/v1/safety-cases')
          .set('Authorization', `Bearer ${participantToken}`)
          .send({
            category: 'harassment',
            category_ar: 'تحرش',
            narrative: 'Experienced harassment during the event',
            narrative_ar: 'تعرضت للتحرش أثناء الحدث',
            severity: 'high',
            evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        safetyCaseId = response.body.data.safetyCase.id;
        expect(response.body.data.safetyCase.state).toBe('submitted');
      });
    });

    describe('Step 2: Trust & Safety Views Cases', () => {
      it('should get all safety cases', async () => {
        const response = await request(app)
          .get('/api/v1/safety-cases')
          .set('Authorization', `Bearer ${trustSafetyToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCases).toBeDefined();
        expect(response.body.data.safetyCases.length).toBeGreaterThan(0);
      });

      it('should filter by state', async () => {
        // Safety cases have no severity field; state is the filterable axis.
        const response = await request(app)
          .get('/api/v1/safety-cases')
          .query({ state: 'submitted' })
          .set('Authorization', `Bearer ${trustSafetyToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCases.length).toBeGreaterThan(0);
        expect(
          response.body.data.safetyCases.every((c: any) => c.state === 'submitted')
        ).toBe(true);
      });

      it('should get safety case by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/safety-cases/${safetyCaseId}`)
          .set('Authorization', `Bearer ${trustSafetyToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCase.id).toBe(safetyCaseId);
      });
    });

    describe('Step 3: Trust & Safety Investigates', () => {
      it('should update state to under_review', async () => {
        const response = await request(app)
          .put(`/api/v1/safety-cases/${safetyCaseId}`)
          .set('Authorization', `Bearer ${trustSafetyToken}`)
          .send({ state: 'under_review' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCase.state).toBe('under_review');
      });

      it('should add investigation action', async () => {
        // Investigation notes are recorded as case actions (no /notes route).
        const response = await request(app)
          .post(`/api/v1/safety-cases/${safetyCaseId}/actions`)
          .set('Authorization', `Bearer ${trustSafetyToken}`)
          .send({
            action_type: 'warn',
            description: 'Investigation started. Contacting involved parties.',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCase.actions.length).toBeGreaterThan(0);
      });

      it('should update state to action_taken', async () => {
        const response = await request(app)
          .put(`/api/v1/safety-cases/${safetyCaseId}`)
          .set('Authorization', `Bearer ${trustSafetyToken}`)
          .send({
            state: 'action_taken',
            action_taken: 'Host suspended pending investigation',
            action_taken_ar: 'تم إيقاف المضيف قيد التحقيق',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safetyCase.state).toBe('action_taken');
      });
    });

    describe('Step 4: Trust & Safety Gets Statistics', () => {
      it('should get safety case statistics', async () => {
        const response = await request(app)
          .get('/api/v1/safety-cases/statistics')
          .set('Authorization', `Bearer ${trustSafetyToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Statistics are per-state counts: [{ state, count }].
        expect(Array.isArray(response.body.data.statistics)).toBe(true);
        expect(response.body.data.statistics.length).toBeGreaterThan(0);
        expect(
          response.body.data.statistics.every(
            (row: any) => typeof row.state === 'string' && typeof row.count === 'number'
          )
        ).toBe(true);
      });
    });

    describe('Step 5: Participant Blocks User', () => {
      it('should block another user', async () => {
        const response = await request(app)
          .post('/api/v1/blocks')
          .set('Authorization', `Bearer ${participantToken}`)
          .send({
            blocked_user_id: 'user-123',
            reason: 'Inappropriate behavior',
            reason_ar: 'سلوك غير لائق',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should get blocked users', async () => {
        const response = await request(app)
          .get('/api/v1/blocks')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.blocks).toBeDefined();
        expect(response.body.data.blocks.length).toBeGreaterThan(0);
      });

      it('should unblock user', async () => {
        // First get the block ID
        const getResponse = await request(app)
          .get('/api/v1/blocks')
          .set('Authorization', `Bearer ${participantToken}`);

        const blockId = getResponse.body.data.blocks[0].id;

        const response = await request(app)
          .delete(`/api/v1/blocks/${blockId}`)
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Step 6: Access Control', () => {
      it('should prevent participant from viewing all safety cases', async () => {
        const response = await request(app)
          .get('/api/v1/safety-cases')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(403);
      });

      it('should prevent participant from viewing all support requests', async () => {
        const response = await request(app)
          .get('/api/v1/support-requests')
          .set('Authorization', `Bearer ${participantToken}`);

        expect(response.status).toBe(403);
      });

      it('should prevent support staff from viewing safety cases', async () => {
        const response = await request(app)
          .get('/api/v1/safety-cases')
          .set('Authorization', `Bearer ${supportToken}`);

        expect(response.status).toBe(403);
      });
    });
  });
});
