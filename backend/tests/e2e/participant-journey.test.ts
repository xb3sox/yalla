import request from 'supertest';
import app from '../src/server';
import pool from '../src/config/database';

describe('Complete User Journey - Participant', () => {
  let participantToken: string;
  let participantId: string;
  let experienceId: string;
  let reservationId: string;
  let paymentId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await pool.query("DELETE FROM users WHERE phone = '+966509999991'");
    await pool.query("DELETE FROM experiences WHERE title = 'E2E Test Experience'");
  });

  afterAll(async () => {
    // Clean up test data
    if (paymentId) await pool.query('DELETE FROM payments WHERE id = $1', [paymentId]);
    if (reservationId) await pool.query('DELETE FROM reservations WHERE id = $1', [reservationId]);
    if (experienceId) await pool.query('DELETE FROM experiences WHERE id = $1', [experienceId]);
    await pool.query("DELETE FROM users WHERE phone = '+966509999991'");
  });

  describe('Step 1: Registration', () => {
    it('should register a new participant', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          phone: '+966509999991',
          password: 'password123',
          display_name: 'E2E Test Participant',
          language: 'en',
          preferred_area: 'Riyadh',
          experience_language: 'en',
          budget_min: 100,
          budget_max: 400,
          adult_declaration_accepted: true,
          terms_accepted: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.phone).toBe('+966509999991');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      
      participantToken = response.body.data.tokens.accessToken;
      participantId = response.body.data.user.id;
    });
  });

  describe('Step 2: Browse Experiences', () => {
    it('should create a test experience', async () => {
      // First, create an operations user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          phone: '+966509999992',
          password: 'password123',
          display_name: 'E2E Operations',
          language: 'en',
          adult_declaration_accepted: true,
          terms_accepted: true,
        });

      await pool.query(
        "UPDATE users SET role = 'operations' WHERE phone = '+966509999992'"
      );

      const opsLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+966509999992',
          password: 'password123',
        });

      const opsToken = opsLogin.body.data.tokens.accessToken;

      // Create experience
      const response = await request(app)
        .post('/api/v1/experiences')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          title: 'E2E Test Experience',
          title_ar: 'تجربة اختبار E2E',
          description: 'Test experience for E2E testing',
          description_ar: 'تجربة اختبار للاختبار الشامل',
          date: '2026-03-15',
          time: '10:00',
          duration: '2 hours',
          duration_minutes: 120,
          area: 'Riyadh',
          area_ar: 'الرياض',
          group_size_min: 4,
          group_size_max: 8,
          language: 'en',
          price: 150,
          capacity: 8,
          plan_state: 'published',
        });

      expect(response.status).toBe(201);
      experienceId = response.body.data.experience.id;
    });

    it('should browse experiences', async () => {
      const response = await request(app)
        .get('/api/v1/experiences')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experiences).toBeDefined();
      expect(response.body.data.experiences.length).toBeGreaterThan(0);
    });

    it('should search experiences', async () => {
      const response = await request(app)
        .get('/api/v1/experiences/search')
        .query({ query: 'E2E' })
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experiences.length).toBeGreaterThan(0);
    });
  });

  describe('Step 3: View Experience Details', () => {
    it('should get experience by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experience).toBeDefined();
      expect(response.body.data.experience.id).toBe(experienceId);
      expect(response.body.data.experience.title).toBe('E2E Test Experience');
    });
  });

  describe('Step 4: Book Experience', () => {
    it('should create a reservation', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          experience_id: experienceId,
          idempotency_key: `e2e-test-${Date.now()}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation).toBeDefined();
      expect(response.body.data.reservation.state).toBe('confirmed');
      
      reservationId = response.body.data.reservation.id;
    });

    it('should prevent duplicate reservations', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          experience_id: experienceId,
          idempotency_key: `e2e-test-duplicate-${Date.now()}`,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Step 5: Process Payment', () => {
    it('should create payment intent', async () => {
      const response = await request(app)
        .post('/api/v1/payments/intent')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          reservation_id: reservationId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.clientSecret).toBeDefined();
      
      paymentId = response.body.data.payment.id;
    });

    it('should get payment details', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/reservation/${reservationId}`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
    });
  });

  describe('Step 6: View My Reservations', () => {
    it('should get user reservations', async () => {
      const response = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservations).toBeDefined();
      expect(response.body.data.reservations.length).toBeGreaterThan(0);
    });

    it('should get reservation by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation).toBeDefined();
      expect(response.body.data.reservation.id).toBe(reservationId);
    });
  });

  describe('Step 7: Save to Favorites', () => {
    it('should add experience to favorites', async () => {
      const response = await request(app)
        .post('/api/v1/favorites')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          experience_id: experienceId,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should get user favorites', async () => {
      const response = await request(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.favorites).toBeDefined();
      expect(response.body.data.favorites.length).toBeGreaterThan(0);
    });
  });

  describe('Step 8: Update Preferences', () => {
    it('should update user preferences', async () => {
      const response = await request(app)
        .put('/api/v1/auth/preferences')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          preferred_area: 'Jeddah',
          budget_min: 200,
          budget_max: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.preferred_area).toBe('Jeddah');
    });
  });

  describe('Step 9: Get Notifications', () => {
    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
    });

    it('should get unread count', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBeDefined();
    });
  });

  describe('Step 10: Export User Data', () => {
    it('should export user data', async () => {
      const response = await request(app)
        .get('/api/v1/auth/export')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.reservations).toBeDefined();
    });
  });

  describe('Step 11: Cancel Reservation', () => {
    it('should cancel reservation', async () => {
      const response = await request(app)
        .post(`/api/v1/reservations/${reservationId}/cancel`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation.state).toBe('cancelled_by_participant');
    });
  });

  describe('Step 12: Request Support', () => {
    it('should create support request', async () => {
      const response = await request(app)
        .post('/api/v1/support-requests')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          type: 'operational',
          subject: 'Test support request',
          subject_ar: 'طلب دعم اختباري',
          description: 'This is a test support request',
          description_ar: 'هذا طلب دعم اختباري',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Step 13: Delete Account', () => {
    it('should delete user account', async () => {
      const response = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not be able to login after deletion', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+966509999991',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });
});
