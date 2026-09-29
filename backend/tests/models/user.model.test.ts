import userModel from '../src/models/user.model';
import pool from '../src/config/database';

describe('User Model', () => {
  const testPhone = '+966501234567';
  const testPassword = 'password123';

  beforeEach(async () => {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE phone = $1', [testPhone]);
  });

  afterAll(async () => {
    // Final cleanup
    await pool.query('DELETE FROM users WHERE phone = $1', [testPhone]);
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.phone).toBe(testPhone);
      expect(user.displayName).toBe('Test User');
      expect(user.language).toBe('en');
      expect(user.role).toBe('participant');
      expect(user.isActive).toBe(true);
    });

    it('should hash password', async () => {
      const user = await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(testPassword);
      expect(user.passwordHash.length).toBeGreaterThan(0);
    });

    it('should throw error for duplicate phone', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User 1',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      await expect(
        userModel.create({
          phone: testPhone,
          password: testPassword,
          displayName: 'Test User 2',
          language: 'en',
          adultDeclarationAccepted: true,
          termsAccepted: true,
        })
      ).rejects.toThrow();
    });
  });

  describe('findByPhone', () => {
    it('should find user by phone', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      const user = await userModel.findByPhone(testPhone);

      expect(user).toBeDefined();
      expect(user?.phone).toBe(testPhone);
      expect(user?.displayName).toBe('Test User');
    });

    it('should return null for non-existent phone', async () => {
      const user = await userModel.findByPhone('+999999999999');
      expect(user).toBeNull();
    });

    it('should not find inactive users', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
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
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
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
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      const updated = await userModel.updatePreferences(user.id, {
        preferredArea: 'Riyadh',
        experienceLanguage: 'ar',
        budgetMin: 200,
        budgetMax: 500,
      });

      expect(updated.preferredArea).toBe('Riyadh');
      expect(updated.experienceLanguage).toBe('ar');
      expect(updated.budgetMin).toBe(200);
      expect(updated.budgetMax).toBe(500);
    });
  });

  describe('delete', () => {
    it('should soft delete user', async () => {
      await userModel.create({
        phone: testPhone,
        password: testPassword,
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
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
        displayName: 'Test User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      const exported = await userModel.exportData(user.id);

      expect(exported).toBeDefined();
      expect(exported.user).toBeDefined();
      expect(exported.user.phone).toBe(testPhone);
      expect(exported.reservations).toBeDefined();
      expect(exported.feedbacks).toBeDefined();
      expect(exported.favorites).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
    });
  });
});
