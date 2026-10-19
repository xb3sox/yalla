import safetyCaseModel from '../../src/models/safety_case.model';
import userModel from '../../src/models/user.model';
import pool from '../../src/config/database';

describe('Safety Case Model', () => {
  let testReporterId: string;
  let testSafetyCaseId: string;

  beforeAll(async () => {
    // Create test user (reporter)
    const user = await userModel.create({
      phone: '+966506666666',
      password: 'password123',
      displayName: 'Safety Test User',
      language: 'en',
      adultDeclarationAccepted: true,
      termsAccepted: true,
    });
    testReporterId = user.id;
  });

  afterAll(async () => {
    // Clean up
    if (testSafetyCaseId) {
      await pool.query('DELETE FROM safety_cases WHERE id = $1', [testSafetyCaseId]);
    }
    await pool.query('DELETE FROM users WHERE id = $1', [testReporterId]);
  });

  describe('create', () => {
    it('should create a safety case', async () => {
      const safetyCase = await safetyCaseModel.create({
        reporterId: testReporterId,
        category: 'harassment',
        categoryAr: 'تحرش',
        narrative: 'User was harassed during the experience',
        narrativeAr: 'تعرض المستخدم للتحرش أثناء التجربة',
        evidence: ['screenshot1.png', 'screenshot2.png'],
      });

      expect(safetyCase).toBeDefined();
      expect(safetyCase.id).toBeDefined();
      expect(safetyCase.reporterId).toBe(testReporterId);
      expect(safetyCase.category).toBe('harassment');
      expect(safetyCase.categoryAr).toBe('تحرش');
      expect(safetyCase.narrative).toBe('User was harassed during the experience');
      expect(safetyCase.narrativeAr).toBe('تعرض المستخدم للتحرش أثناء التجربة');
      expect(safetyCase.state).toBe('submitted');
      expect(safetyCase.evidence).toEqual(['screenshot1.png', 'screenshot2.png']);
      expect(safetyCase.actions).toEqual([]);
      expect(safetyCase.restrictedAccess).toBe(true);

      testSafetyCaseId = safetyCase.id;
    });
  });

  describe('findById', () => {
    it('should find safety case by ID', async () => {
      const safetyCase = await safetyCaseModel.findById(testSafetyCaseId);

      expect(safetyCase).toBeDefined();
      expect(safetyCase?.id).toBe(testSafetyCaseId);
      expect(safetyCase?.reporterId).toBe(testReporterId);
    });

    it('should return null for non-existent ID', async () => {
      const safetyCase = await safetyCaseModel.findById(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(safetyCase).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all safety cases', async () => {
      const safetyCases = await safetyCaseModel.findAll();

      expect(safetyCases).toBeDefined();
      expect(Array.isArray(safetyCases)).toBe(true);
      expect(safetyCases.length).toBeGreaterThan(0);
    });

    it('should filter by state', async () => {
      const safetyCases = await safetyCaseModel.findAll({ state: 'submitted' });

      expect(safetyCases).toBeDefined();
      expect(safetyCases.every((sc) => sc.state === 'submitted')).toBe(true);
    });

    it('should filter by category', async () => {
      const safetyCases = await safetyCaseModel.findAll({ category: 'harassment' });

      expect(safetyCases).toBeDefined();
      expect(safetyCases.every((sc) => sc.category === 'harassment')).toBe(true);
    });

    it('should filter by reporter', async () => {
      const safetyCases = await safetyCaseModel.findAll({ reporterId: testReporterId });

      expect(safetyCases).toBeDefined();
      expect(safetyCases.every((sc) => sc.reporterId === testReporterId)).toBe(true);
    });

    it('should limit results', async () => {
      const safetyCases = await safetyCaseModel.findAll({ limit: 1 });

      expect(safetyCases).toBeDefined();
      expect(safetyCases.length).toBeLessThanOrEqual(1);
    });

    it('should offset results', async () => {
      const allCases = await safetyCaseModel.findAll();
      const offsetCases = await safetyCaseModel.findAll({ offset: 1 });

      expect(offsetCases.length).toBe(allCases.length - 1);
    });
  });

  describe('update', () => {
    it('should update safety case', async () => {
      const updated = await safetyCaseModel.update(testSafetyCaseId, {
        state: 'under_review',
        narrative: 'Updated narrative',
      });

      expect(updated).toBeDefined();
      expect(updated.state).toBe('under_review');
      expect(updated.narrative).toBe('Updated narrative');
    });

    it('should throw error for non-existent safety case', async () => {
      await expect(
        safetyCaseModel.update('00000000-0000-0000-0000-000000000000', {
          state: 'under_review',
        })
      ).rejects.toThrow('Safety case not found');
    });
  });

  describe('updateState', () => {
    it('should update state with valid transition', async () => {
      const updated = await safetyCaseModel.updateState(testSafetyCaseId, 'action_taken');

      expect(updated).toBeDefined();
      expect(updated.state).toBe('action_taken');
    });

    it('should reject invalid state transition', async () => {
      await expect(
        safetyCaseModel.updateState(testSafetyCaseId, 'submitted')
      ).rejects.toThrow('Invalid state transition');
    });

    it('should allow transition to closed', async () => {
      const updated = await safetyCaseModel.updateState(testSafetyCaseId, 'closed');

      expect(updated).toBeDefined();
      expect(updated.state).toBe('closed');
    });

    it('should allow transition to appealed', async () => {
      const updated = await safetyCaseModel.updateState(testSafetyCaseId, 'appealed');

      expect(updated).toBeDefined();
      expect(updated.state).toBe('appealed');
    });

    it('should allow transition to final', async () => {
      const updated = await safetyCaseModel.updateState(testSafetyCaseId, 'final');

      expect(updated).toBeDefined();
      expect(updated.state).toBe('final');
    });

    it('should reject transition from final state', async () => {
      await expect(
        safetyCaseModel.updateState(testSafetyCaseId, 'submitted')
      ).rejects.toThrow('Invalid state transition');
    });
  });

  describe('addAction', () => {
    it('should add action to safety case', async () => {
      const updated = await safetyCaseModel.addAction(testSafetyCaseId, {
        actionType: 'warning_issued',
        description: 'Warning issued to reported user',
        actorId: testReporterId,
        metadata: { warningLevel: 'severe' },
      });

      expect(updated).toBeDefined();
      expect(updated.actions).toBeDefined();
      expect(updated.actions.length).toBeGreaterThan(0);
      
      const lastAction = updated.actions[updated.actions.length - 1];
      expect(lastAction.actionType).toBe('warning_issued');
      expect(lastAction.description).toBe('Warning issued to reported user');
      expect(lastAction.actorId).toBe(testReporterId);
      expect(lastAction.metadata).toEqual({ warningLevel: 'severe' });
      expect(lastAction.timestamp).toBeDefined();
    });

    it('should throw error for non-existent safety case', async () => {
      await expect(
        safetyCaseModel.addAction('00000000-0000-0000-0000-000000000000', {
          actionType: 'test',
          description: 'Test action',
          actorId: testReporterId,
        })
      ).rejects.toThrow('Safety case not found');
    });
  });

  describe('findByReporter', () => {
    it('should find safety cases by reporter', async () => {
      const safetyCases = await safetyCaseModel.findByReporter(testReporterId);

      expect(safetyCases).toBeDefined();
      expect(Array.isArray(safetyCases)).toBe(true);
      expect(safetyCases.length).toBeGreaterThan(0);
      expect(safetyCases.every((sc) => sc.reporterId === testReporterId)).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should get safety case statistics', async () => {
      const stats = await safetyCaseModel.getStatistics();

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
      
      // Should have state and count
      stats.forEach((stat) => {
        expect(stat.state).toBeDefined();
        expect(stat.count).toBeDefined();
        expect(typeof stat.count).toBe('number');
      });
    });
  });

  describe('delete', () => {
    it('should delete safety case', async () => {
      const newCase = await safetyCaseModel.create({
        reporterId: testReporterId,
        category: 'test',
        categoryAr: 'اختبار',
        narrative: 'Test case to delete',
        narrativeAr: 'حالة اختبار للحذف',
      });

      await safetyCaseModel.delete(newCase.id);

      const deleted = await safetyCaseModel.findById(newCase.id);
      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent safety case', async () => {
      await expect(
        safetyCaseModel.delete('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Safety case not found');
    });
  });

  describe('State Machine', () => {
    it('should have correct initial state', async () => {
      const newCase = await safetyCaseModel.create({
        reporterId: testReporterId,
        category: 'test',
        categoryAr: 'اختبار',
        narrative: 'Test case',
        narrativeAr: 'حالة اختبار',
      });

      expect(newCase.state).toBe('submitted');

      await safetyCaseModel.delete(newCase.id);
    });

    it('should follow valid state transitions', async () => {
      const newCase = await safetyCaseModel.create({
        reporterId: testReporterId,
        category: 'test',
        categoryAr: 'اختبار',
        narrative: 'Test case',
        narrativeAr: 'حالة اختبار',
      });

      // submitted -> under_review
      let updated = await safetyCaseModel.updateState(newCase.id, 'under_review');
      expect(updated.state).toBe('under_review');

      // under_review -> action_taken
      updated = await safetyCaseModel.updateState(newCase.id, 'action_taken');
      expect(updated.state).toBe('action_taken');

      // action_taken -> closed
      updated = await safetyCaseModel.updateState(newCase.id, 'closed');
      expect(updated.state).toBe('closed');

      await safetyCaseModel.delete(newCase.id);
    });

    it('should reject invalid state transitions', async () => {
      const newCase = await safetyCaseModel.create({
        reporterId: testReporterId,
        category: 'test',
        categoryAr: 'اختبار',
        narrative: 'Test case',
        narrativeAr: 'حالة اختبار',
      });

      // submitted -> closed (invalid)
      await expect(
        safetyCaseModel.updateState(newCase.id, 'closed')
      ).rejects.toThrow('Invalid state transition');

      await safetyCaseModel.delete(newCase.id);
    });
  });
});
