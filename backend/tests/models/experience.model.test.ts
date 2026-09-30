import experienceModel from '../src/models/experience.model';
import pool from '../src/config/database';

describe('Experience Model', () => {
  let testExperienceId: string;

  const testExperience = {
    title: 'Test Experience',
    titleAr: 'تجربة اختبارية',
    description: 'Test description',
    descriptionAr: 'وصف اختباري',
    date: '2026-03-01',
    time: '10:00',
    duration: '2 hours',
    durationMinutes: 120,
    area: 'Riyadh',
    areaAr: 'الرياض',
    groupSizeMin: 4,
    groupSizeMax: 8,
    language: 'en',
    price: 100,
    capacity: 8,
    planState: 'published',
  };

  beforeEach(async () => {
    // Clean up test experiences
    await pool.query("DELETE FROM experiences WHERE title LIKE 'Test Experience%'");
  });

  afterAll(async () => {
    // Final cleanup
    await pool.query("DELETE FROM experiences WHERE title LIKE 'Test Experience%'");
  });

  describe('create', () => {
    it('should create a new experience', async () => {
      const experience = await experienceModel.create(testExperience);

      expect(experience).toBeDefined();
      expect(experience.id).toBeDefined();
      expect(experience.title).toBe(testExperience.title);
      expect(experience.titleAr).toBe(testExperience.titleAr);
      expect(experience.description).toBe(testExperience.description);
      expect(experience.date).toBe(testExperience.date);
      expect(experience.capacity).toBe(testExperience.capacity);
      expect(experience.booked).toBe(0);
      expect(experience.planState).toBe(testExperience.planState);

      testExperienceId = experience.id;
    });

    it('should set default values', async () => {
      const experience = await experienceModel.create({
        ...testExperience,
        currency: undefined,
        physicalDemand: undefined,
        noiseLevel: undefined,
        minAttendance: undefined,
      });

      expect(experience.currency).toBe('SAR');
      expect(experience.physicalDemand).toBe('moderate');
      expect(experience.noiseLevel).toBe('moderate');
      expect(experience.minAttendance).toBe(4);
    });
  });

  describe('findById', () => {
    it('should find experience by ID', async () => {
      const created = await experienceModel.create(testExperience);
      const experience = await experienceModel.findById(created.id);

      expect(experience).toBeDefined();
      expect(experience?.id).toBe(created.id);
      expect(experience?.title).toBe(testExperience.title);
    });

    it('should return null for non-existent ID', async () => {
      const experience = await experienceModel.findById(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(experience).toBeNull();
    });
  });

  describe('findAllPublished', () => {
    it('should return only published experiences', async () => {
      await experienceModel.create({
        ...testExperience,
        title: 'Published Experience',
        planState: 'published',
      });

      await experienceModel.create({
        ...testExperience,
        title: 'Draft Experience',
        planState: 'draft',
      });

      const experiences = await experienceModel.findAllPublished();

      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.planState === 'published')).toBe(true);
    });

    it('should limit results', async () => {
      // Create 5 experiences
      for (let i = 0; i < 5; i++) {
        await experienceModel.create({
          ...testExperience,
          title: `Experience ${i}`,
        });
      }

      const experiences = await experienceModel.findAllPublished(3);
      expect(experiences.length).toBe(3);
    });

    it('should offset results', async () => {
      // Create 5 experiences
      for (let i = 0; i < 5; i++) {
        await experienceModel.create({
          ...testExperience,
          title: `Experience ${i}`,
        });
      }

      const experiences = await experienceModel.findAllPublished(10, 2);
      expect(experiences.length).toBe(3); // 5 - 2 offset
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await experienceModel.create({
        ...testExperience,
        title: 'Art Workshop',
        area: 'Riyadh',
        price: 100,
        language: 'en',
      });

      await experienceModel.create({
        ...testExperience,
        title: 'Cooking Class',
        area: 'Jeddah',
        price: 200,
        language: 'ar',
      });
    });

    it('should search by title', async () => {
      const experiences = await experienceModel.search({ query: 'Art' });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.some((e) => e.title.includes('Art'))).toBe(true);
    });

    it('should search by area', async () => {
      const experiences = await experienceModel.search({ area: 'Riyadh' });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.area === 'Riyadh')).toBe(true);
    });

    it('should filter by price range', async () => {
      const experiences = await experienceModel.search({
        minPrice: 150,
        maxPrice: 250,
      });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.price >= 150 && e.price <= 250)).toBe(true);
    });

    it('should filter by language', async () => {
      const experiences = await experienceModel.search({ language: 'ar' });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.language === 'ar')).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const experiences = await experienceModel.search({
        query: 'Cooking',
        area: 'Jeddah',
        language: 'ar',
      });
      expect(experiences.length).toBeGreaterThan(0);
      expect(
        experiences.every(
          (e) =>
            e.title.includes('Cooking') && e.area === 'Jeddah' && e.language === 'ar'
        )
      ).toBe(true);
    });
  });

  describe('update', () => {
    it('should update experience', async () => {
      const created = await experienceModel.create(testExperience);
      const updated = await experienceModel.update(created.id, {
        title: 'Updated Experience',
        price: 150,
      });

      expect(updated.title).toBe('Updated Experience');
      expect(updated.price).toBe(150);
    });

    it('should update multiple fields', async () => {
      const created = await experienceModel.create(testExperience);
      const updated = await experienceModel.update(created.id, {
        title: 'Updated Title',
        titleAr: 'عنوان محدث',
        description: 'Updated Description',
        price: 200,
        capacity: 10,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.titleAr).toBe('عنوان محدث');
      expect(updated.description).toBe('Updated Description');
      expect(updated.price).toBe(200);
      expect(updated.capacity).toBe(10);
    });
  });

  describe('delete', () => {
    it('should delete experience', async () => {
      const created = await experienceModel.create(testExperience);
      await experienceModel.delete(created.id);

      const experience = await experienceModel.findById(created.id);
      expect(experience).toBeNull();
    });
  });

  describe('incrementBooked', () => {
    it('should increment booked count', async () => {
      const created = await experienceModel.create(testExperience);
      expect(created.booked).toBe(0);

      await experienceModel.incrementBooked(created.id);
      const updated = await experienceModel.findById(created.id);
      expect(updated?.booked).toBe(1);

      await experienceModel.incrementBooked(created.id);
      const updated2 = await experienceModel.findById(created.id);
      expect(updated2?.booked).toBe(2);
    });
  });

  describe('decrementBooked', () => {
    it('should decrement booked count', async () => {
      const created = await experienceModel.create(testExperience);
      
      // Increment first
      await experienceModel.incrementBooked(created.id);
      await experienceModel.incrementBooked(created.id);
      
      let updated = await experienceModel.findById(created.id);
      expect(updated?.booked).toBe(2);

      // Then decrement
      await experienceModel.decrementBooked(created.id);
      updated = await experienceModel.findById(created.id);
      expect(updated?.booked).toBe(1);
    });

    it('should not go below zero', async () => {
      const created = await experienceModel.create(testExperience);
      expect(created.booked).toBe(0);

      await experienceModel.decrementBooked(created.id);
      const updated = await experienceModel.findById(created.id);
      expect(updated?.booked).toBe(0); // Should stay at 0
    });
  });
});
