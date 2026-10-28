import experienceModel from '../../src/models/experience.model';
import pool from '../../src/config/database';

describe('Experience Model', () => {
  let testExperienceId: string;

  const testExperience = {
    title: 'Test Experience',
    title_ar: 'تجربة اختبارية',
    description: 'Test description',
    description_ar: 'وصف اختباري',
    date: '2027-03-01',
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
  };

  beforeEach(async () => {
    // Clean up test experiences
    await pool.query("DELETE FROM experiences WHERE title LIKE 'Test Experience%'");
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('create', () => {
    it('should create a new experience', async () => {
      const experience = await experienceModel.create(testExperience);

      expect(experience).toBeDefined();
      expect(experience.id).toBeDefined();
      expect(experience.title).toBe(testExperience.title);
      expect(experience.title_ar).toBe(testExperience.title_ar);
      expect(experience.description).toBe(testExperience.description);
      expect(new Date(experience.date).toISOString().slice(0, 10)).toBe(testExperience.date);
      expect(experience.capacity).toBe(testExperience.capacity);
      expect(experience.booked).toBe(0);
      expect(experience.plan_state).toBe(testExperience.plan_state);

      testExperienceId = experience.id;
    });

    it('should set default values', async () => {
      const experience = await experienceModel.create({
        ...testExperience,
        currency: undefined,
        physical_demand: undefined,
        noise_level: undefined,
        min_attendance: undefined,
      });

      expect(experience.currency).toBe('SAR');
      expect(experience.physical_demand).toBe('moderate');
      expect(experience.noise_level).toBe('moderate');
      expect(experience.min_attendance).toBe(4);
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
        plan_state: 'published',
      });

      await experienceModel.create({
        ...testExperience,
        title: 'Draft Experience',
        plan_state: 'draft',
      });

      const experiences = await experienceModel.findAllPublished();

      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.plan_state === 'published')).toBe(true);
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

      // Earlier tests in this file also created published experiences,
      // so assert the offset relatively instead of an absolute count.
      const all = await experienceModel.findAllPublished(50, 0);
      const experiences = await experienceModel.findAllPublished(50, 2);
      expect(experiences.length).toBe(all.length - 2);
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

  describe('staffSearch', () => {
    beforeEach(async () => {
      await experienceModel.create({
        ...testExperience,
        title: 'VIP Tour',
        description: 'Exclusive tour',
        area: 'Jeddah',
        plan_state: 'published',
        capacity: 10,
        price: 500,
      });

      const drafted = await experienceModel.create({
        ...testExperience,
        title: 'Draft Tour',
        area: 'Riyadh',
        plan_state: 'draft',
        capacity: 5,
        price: 200,
      });
      // Mock booking to test minSpots
      await experienceModel.incrementBooked(drafted.id);
      await experienceModel.incrementBooked(drafted.id);
    });

    it('should search by searchQuery in title or description', async () => {
      const experiences = await experienceModel.staffSearch({ searchQuery: 'VIP' });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.some((e) => e.title.includes('VIP'))).toBe(true);

      const exp2 = await experienceModel.staffSearch({ searchQuery: 'Exclusive' });
      expect(exp2.length).toBeGreaterThan(0);
      expect(exp2.some((e) => e.description.includes('Exclusive'))).toBe(true);
    });

    it('should filter by city (area)', async () => {
      const experiences = await experienceModel.staffSearch({ city: 'Jeddah' });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.area === 'Jeddah')).toBe(true);
    });

    it('should filter by status (plan_state)', async () => {
      const draftExperiences = await experienceModel.staffSearch({ status: 'draft' });
      expect(draftExperiences.length).toBeGreaterThan(0);
      expect(draftExperiences.every((e) => e.plan_state === 'draft')).toBe(true);
    });

    it('should filter by minSpots', async () => {
      // Draft Tour has capacity 5, booked 2 -> 3 spots left. VIP Tour has 10 spots.
      // If we ask for minSpots: 5, Draft Tour shouldn't be included.
      const experiences = await experienceModel.staffSearch({ minSpots: 5 });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => (e.capacity - e.booked) >= 5)).toBe(true);
    });

    it('should filter by maxPrice', async () => {
      const experiences = await experienceModel.staffSearch({ maxPrice: 300 });
      expect(experiences.length).toBeGreaterThan(0);
      expect(experiences.every((e) => e.price <= 300)).toBe(true);
    });

    it('should combine multiple staff search filters', async () => {
      const experiences = await experienceModel.staffSearch({
        city: 'Jeddah',
        status: 'published',
        maxPrice: 600,
      });
      expect(experiences.length).toBeGreaterThan(0);
      expect(
        experiences.every(
          (e) => e.area === 'Jeddah' && e.plan_state === 'published' && e.price <= 600
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
        title_ar: 'عنوان محدث',
        description: 'Updated Description',
        price: 200,
        capacity: 10,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.title_ar).toBe('عنوان محدث');
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
