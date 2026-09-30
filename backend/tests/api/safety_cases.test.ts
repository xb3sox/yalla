import request from 'supertest';
import app from '../src/server';
import pool from '../src/config/database';

describe('Safety Cases API', () => {
  let participantToken: string;
  let trustSafetyToken: string;
  let adminToken: string;
  let testSafetyCaseId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create participant user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966501111111',
        password: 'password123',
        displayName: 'Safety Test Participant',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

    const participantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966501111111',
        password: 'password123',
      });

    participantToken = participantLogin.body.data.tokens.accessToken;

    const userResponse = await pool.query(
      "SELECT id FROM users WHERE phone = '+966501111111'"
    );
    testUserId = userResponse.rows[0].id;

    // Create trust & safety user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966509999999',
        password: 'password123',
        displayName: 'Trust & Safety Staff',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'trust_safety' WHERE phone = '+966509999999'"
    );

    const tsLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966509999999',
        password: 'password123',
      });

    trustSafetyToken = tsLogin.body.data.tokens.accessToken;

    // Create admin user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966508888888',
        password: 'password123',
        displayName: 'Admin User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'admin' WHERE phone = '+966508888888'"
    );

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966508888888',
        password: 'password123',
      });

    adminToken = adminLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up
    if (testSafetyCaseId) {
      await pool.query('DELETE FROM safety_cases WHERE id = $1', [testSafetyCaseId]);
    }
    await pool.query("DELETE FROM users WHERE phone = '+966501111111'");
    await pool.query("DELETE FROM users WHERE phone = '+966509999999'");
    await pool.query("DELETE FROM users WHERE phone = '+966508888888'");
  });

  describe('POST /api/v1/safety-cases', () => {
    it('should create a safety case', async () => {
      const response = await request(app)
        .post('/api/v1/safety-cases')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          category: 'harassment',
          category_ar: 'تحرش',
          narrative: 'User was harassed during the experience',
          narrative_ar: 'تعرض المستخدم للتحرش أثناء التجربة',
          evidence: ['screenshot1.png', 'screenshot2.png'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safetyCase).toBeDefined();
      expect(response.body.data.safetyCase.reporterId).toBe(testUserId);
      expect(response.body.data.safetyCase.category).toBe('harassment');
      expect(response.body.data.safetyCase.state).toBe('submitted');

      testSafetyCaseId = response.body.data.safetyCase.id;
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/v1/safety-cases').send({
        category: 'harassment',
        category_ar: 'تحرش',
        narrative: 'Test',
        narrative_ar: 'اختبار',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require category and narrative', async () => {
      const response = await request(app)
        .post('/api/v1/safety-cases')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/safety-cases', () => {
    it('should get all safety cases (trust & safety only)', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases')
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safetyCases).toBeDefined();
      expect(Array.isArray(response.body.data.safetyCases)).toBe(true);
    });

    it('should filter by state', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases')
        .query({ state: 'submitted' })
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.safetyCases.every((sc: any) => sc.state === 'submitted')
      ).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases')
        .query({ category: 'harassment' })
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.safetyCases.every((sc: any) => sc.category === 'harassment')
      ).toBe(true);
    });

    it('should require trust & safety or admin role', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/safety-cases/statistics', () => {
    it('should get safety case statistics', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases/statistics')
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(Array.isArray(response.body.data.statistics)).toBe(true);
    });

    it('should require trust & safety or admin role', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases/statistics')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/safety-cases/:id', () => {
    it('should get safety case by ID (reporter)', async () => {
      const response = await request(app)
        .get(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safetyCase).toBeDefined();
      expect(response.body.data.safetyCase.id).toBe(testSafetyCaseId);
    });

    it('should get safety case by ID (trust & safety)', async () => {
      const response = await request(app)
        .get(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent safety case', async () => {
      const response = await request(app)
        .get('/api/v1/safety-cases/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should restrict access to non-reporter participants', async () => {
      // Create another participant
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          phone: '+966507777777',
          password: 'password123',
          displayName: 'Another Participant',
          language: 'en',
          adultDeclarationAccepted: true,
          termsAccepted: true,
        });

      const otherLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+966507777777',
          password: 'password123',
        });

      const otherToken = otherLogin.body.data.tokens.accessToken;

      const response = await request(app)
        .get(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Clean up
      await pool.query("DELETE FROM users WHERE phone = '+966507777777'");
    });
  });

  describe('PUT /api/v1/safety-cases/:id', () => {
    it('should update safety case (trust & safety)', async () => {
      const response = await request(app)
        .put(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${trustSafetyToken}`)
        .send({
          state: 'under_review',
          narrative: 'Updated narrative by trust & safety',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safetyCase.state).toBe('under_review');
      expect(response.body.data.safetyCase.narrative).toBe(
        'Updated narrative by trust & safety'
      );
    });

    it('should reject invalid state transition', async () => {
      const response = await request(app)
        .put(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${trustSafetyToken}`)
        .send({ state: 'submitted' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require trust & safety or admin role', async () => {
      const response = await request(app)
        .put(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ state: 'action_taken' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/safety-cases/:id/actions', () => {
    it('should add action to safety case', async () => {
      const response = await request(app)
        .post(`/api/v1/safety-cases/${testSafetyCaseId}/actions`)
        .set('Authorization', `Bearer ${trustSafetyToken}`)
        .send({
          action_type: 'warning_issued',
          description: 'Warning issued to reported user',
          metadata: { warningLevel: 'severe' },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safetyCase.actions).toBeDefined();
      expect(response.body.data.safetyCase.actions.length).toBeGreaterThan(0);
    });

    it('should require action_type and description', async () => {
      const response = await request(app)
        .post(`/api/v1/safety-cases/${testSafetyCaseId}/actions`)
        .set('Authorization', `Bearer ${trustSafetyToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require trust & safety or admin role', async () => {
      const response = await request(app)
        .post(`/api/v1/safety-cases/${testSafetyCaseId}/actions`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          action_type: 'test',
          description: 'Test action',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/safety-cases/:id', () => {
    it('should delete safety case (admin only)', async () => {
      // Create a new safety case to delete
      const createResponse = await request(app)
        .post('/api/v1/safety-cases')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          category: 'test',
          category_ar: 'اختبار',
          narrative: 'Test case to delete',
          narrative_ar: 'حالة اختبار للحذف',
        });

      const caseIdToDelete = createResponse.body.data.safetyCase.id;

      const response = await request(app)
        .delete(`/api/v1/safety-cases/${caseIdToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete(`/api/v1/safety-cases/${testSafetyCaseId}`)
        .set('Authorization', `Bearer ${trustSafetyToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent safety case', async () => {
      const response = await request(app)
        .delete('/api/v1/safety-cases/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
