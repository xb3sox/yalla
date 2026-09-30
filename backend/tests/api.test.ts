import request from 'supertest';
import app from '../src/server';
import pool from '../src/config/database';

describe('Health Check API', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.data.environment).toBeDefined();
    expect(response.body.data.version).toBe('1.0.0');
  });
});

describe('Authentication API', () => {
  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE phone = $1', ['+1234567890']);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE phone = $1', ['+1234567890']);
    await pool.end();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+1234567890',
        password: 'password123',
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.phone).toBe('+1234567890');
    expect(response.body.data.user.display_name).toBe('Test User');
    expect(response.body.data.tokens).toBeDefined();
    expect(response.body.data.tokens.accessToken).toBeDefined();
    expect(response.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should not register duplicate user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+1234567890',
        password: 'password123',
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('USER_EXISTS');
  });

  it('should login user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.tokens).toBeDefined();
  });

  it('should not login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should get current user', async () => {
    // First login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'password123',
      });

    const token = loginResponse.body.data.tokens.accessToken;

    // Then get current user
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.phone).toBe('+1234567890');
  });

  it('should not get current user without token', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should refresh access token', async () => {
    // First login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'password123',
      });

    const refreshToken = loginResponse.body.data.tokens.refreshToken;

    // Then refresh token
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens).toBeDefined();
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });
});

describe('Experiences API', () => {
  let authToken: string;
  let experienceId: string;

  beforeAll(async () => {
    // Login as staff user
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'password123',
      });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Update user role to operations
    await pool.query(
      'UPDATE users SET role = $1 WHERE phone = $2',
      ['operations', '+1234567890']
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (experienceId) {
      await pool.query('DELETE FROM experiences WHERE id = $1', [experienceId]);
    }
    await pool.query('UPDATE users SET role = $1 WHERE phone = $2', [
      'participant',
      '+1234567890',
    ]);
  });

  it('should create an experience', async () => {
    const response = await request(app)
      .post('/api/v1/experiences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Experience',
        title_ar: 'تجربة اختبارية',
        description: 'Test description',
        description_ar: 'وصف اختباري',
        date: '2026-03-01',
        time: '10:00',
        duration: '2 hours',
        duration_minutes: 120,
        area: 'Riyadh',
        area_ar: 'الرياض',
        group_size_min: 4,
        group_size_max: 8,
        language: 'en',
        price: 100,
        capacity: 8,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.experience).toBeDefined();
    experienceId = response.body.data.experience.id;
  });

  it('should get all experiences', async () => {
    const response = await request(app).get('/api/v1/experiences');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.experiences).toBeDefined();
    expect(Array.isArray(response.body.data.experiences)).toBe(true);
  });

  it('should get experience by ID', async () => {
    const response = await request(app).get(`/api/v1/experiences/${experienceId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.experience).toBeDefined();
    expect(response.body.data.experience.id).toBe(experienceId);
  });

  it('should search experiences', async () => {
    const response = await request(app)
      .get('/api/v1/experiences/search')
      .query({ query: 'Test' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.experiences).toBeDefined();
  });

  it('should update experience', async () => {
    const response = await request(app)
      .put(`/api/v1/experiences/${experienceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Experience',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.experience.title).toBe('Updated Experience');
  });

  it('should delete experience', async () => {
    const response = await request(app)
      .delete(`/api/v1/experiences/${experienceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    experienceId = ''; // Clear to prevent cleanup error
  });
});

describe('Reservations API', () => {
  let authToken: string;
  let experienceId: string;
  let reservationId: string;

  beforeAll(async () => {
    // Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+1234567890',
        password: 'password123',
      });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Create test experience
    const expResponse = await request(app)
      .post('/api/v1/experiences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Experience',
        title_ar: 'تجربة اختبارية',
        description: 'Test description',
        description_ar: 'وصف اختباري',
        date: '2026-03-01',
        time: '10:00',
        duration: '2 hours',
        duration_minutes: 120,
        area: 'Riyadh',
        area_ar: 'الرياض',
        group_size_min: 4,
        group_size_max: 8,
        language: 'en',
        price: 100,
        capacity: 8,
        plan_state: 'published',
      });

    experienceId = expResponse.body.data.experience.id;
  });

  afterAll(async () => {
    // Clean up
    if (reservationId) {
      await pool.query('DELETE FROM reservations WHERE id = $1', [reservationId]);
    }
    if (experienceId) {
      await pool.query('DELETE FROM experiences WHERE id = $1', [experienceId]);
    }
  });

  it('should create a reservation', async () => {
    const response = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        experience_id: experienceId,
        idempotency_key: 'test-key-123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reservation).toBeDefined();
    reservationId = response.body.data.reservation.id;
  });

  it('should prevent duplicate reservations', async () => {
    const response = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        experience_id: experienceId,
        idempotency_key: 'test-key-123',
      });

    expect(response.status).toBe(201); // Should return existing reservation
    expect(response.body.success).toBe(true);
  });

  it('should get user reservations', async () => {
    const response = await request(app)
      .get('/api/v1/reservations')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reservations).toBeDefined();
    expect(Array.isArray(response.body.data.reservations)).toBe(true);
  });

  it('should get reservation by ID', async () => {
    const response = await request(app)
      .get(`/api/v1/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reservation).toBeDefined();
    expect(response.body.data.reservation.id).toBe(reservationId);
  });

  it('should cancel reservation', async () => {
    const response = await request(app)
      .post(`/api/v1/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reservation.state).toBe('cancelled_by_participant');
  });
});
