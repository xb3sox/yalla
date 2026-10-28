import userModel from '../../src/models/user.model';
import pool from '../../src/config/database';

describe('User Model', () => {
  const testPhone = '+966501234567';
  const testPassword = 'password123';

  beforeEach(async () => {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE phone = $1', [testPhone]);
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.phone).toBe(testPhone);
      expect(user.display_name).toBe('Test User');
      expect(user.language).toBe('en');
      expect(user.role).toBe('participant');
      expect(user.is_active).toBe(true);
    });

    it('should hash password', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(testPassword);
      expect(user.password_hash.length).toBeGreaterThan(0);
    });

    it('should throw error for duplicate phone', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User 1',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      await expect(
        userModel.create({
          phone: testPhone,
          password: testPassword,
          display_name: 'Test User 2',
          language: 'en',
          adult_declaration_accepted: true,
          terms_accepted: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('findByPhone', () => {
    it('should find user by phone', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      const user = await userModel.findByPhone(testPhone);

      expect(user).toBeDefined();
      expect(user?.phone).toBe(testPhone);
      expect(user?.display_name).toBe('Test User');
    });

    it('should return null for non-existent phone', async () => {
      const user = await userModel.findByPhone('+999999999999');
      expect(user).toBeNull();
    });

    it('should not find inactive users', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      await userModel.delete(testPhone);

      const user = await userModel.findByPhone(testPhone);
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const created = await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      const user = await userModel.findById(created.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
      expect(user?.phone).toBe(testPhone);
    });

    it('should return null for non-existent ID', async () => {
      const user = await userModel.findById('00000000-0000-0000-0000-000000000000');
      expect(user).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      const updated = await userModel.updatePreferences(user.id, {
        preferred_area: 'Riyadh',
        experience_language: 'ar',
        budget_min: 200,
        budget_max: 500,
      });

      expect(updated.preferred_area).toBe('Riyadh');
      expect(updated.experience_language).toBe('ar');
      expect(updated.budget_min).toBe(200);
      expect(updated.budget_max).toBe(500);
    });
  });

  describe('delete', () => {
    it('should soft delete user', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      await userModel.delete(testPhone);

      const user = await userModel.findByPhone(testPhone);
      expect(user).toBeNull();
    });
  });

  describe('exportData', () => {
    it('should export user data', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        display_name: 'Test User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

      const exported = await userModel.exportData(user.id);

      expect(exported).toBeDefined();
      expect(exported.user).toBeDefined();
      expect(exported.user.phone).toBe(testPhone);
      expect(exported.reservations).toBeDefined();
      expect(exported.feedbacks).toBeDefined();
      expect(exported.favorites).toBeDefined();
      expect(exported.exported_at).toBeDefined();
    });
  });
});
