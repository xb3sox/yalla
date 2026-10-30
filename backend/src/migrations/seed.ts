import pool from '../config/database';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';
import config from '../config';

async function seed() {
  // Demo accounts use a published shared password and include admin/staff
  // roles — never seed them into a production database.
  if (config.env === 'production' && process.env.ALLOW_PROD_SEED !== '1') {
    throw new Error(
      'Refusing to seed demo data in production (set ALLOW_PROD_SEED=1 to override).'
    );
  }

  const client = await pool.connect();
  
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Create demo users
    const users = [
      {
        phone: '+966501234567',
        displayName: 'Ahmed Al-Rashid',
        password: 'password123',
        language: 'en',
        preferredArea: 'Riyadh',
        experienceLanguage: 'en',
        budgetMin: 100,
        budgetMax: 400,
        role: 'participant',
      },
      {
        phone: '+966502345678',
        displayName: 'Fatima Hassan',
        password: 'password123',
        language: 'ar',
        preferredArea: 'Jeddah',
        experienceLanguage: 'ar',
        budgetMin: 150,
        budgetMax: 350,
        role: 'participant',
      },
      {
        phone: '+966503456789',
        displayName: 'Operations Staff',
        password: 'password123',
        language: 'en',
        role: 'operations',
      },
      {
        phone: '+966504567890',
        displayName: 'Support Staff',
        password: 'password123',
        language: 'en',
        role: 'support',
      },
      {
        phone: '+966505678901',
        displayName: 'Trust & Safety Staff',
        password: 'password123',
        language: 'en',
        role: 'trust_safety',
      },
      {
        phone: '+966506789012',
        displayName: 'Admin User',
        password: 'password123',
        language: 'en',
        role: 'admin',
      },
    ];

    logger.info('Creating demo users...');
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, config.security.bcryptRounds);
      
      await client.query(
        `INSERT INTO users (
          phone, display_name, password_hash, language, preferred_area,
          experience_language, budget_min, budget_max, role,
          adult_declaration_accepted, terms_accepted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (phone) DO NOTHING`,
        [
          user.phone,
          user.displayName,
          passwordHash,
          user.language,
          user.preferredArea || null,
          user.experienceLanguage || 'en',
          user.budgetMin || 100,
          user.budgetMax || 400,
          user.role,
          true,
          true,
        ]
      );
    }

    // Create demo experiences
    const experiences = [
      {
        title: 'Sunset Art Walk',
        titleAr: 'جولة فنية عند الغروب',
        description: 'A guided evening walk through local galleries and street art, ending at a rooftop café with views of the city at golden hour.',
        descriptionAr: 'جولة مسائية إرشادية عبر المعارض المحلية والفن الشعبي، تنتهي في مقهى على سطح المنزل مع إطلالات على المدينة في الساعة الذهبية.',
        date: '2026-02-15',
        time: '17:00',
        duration: '3 hours',
        durationMinutes: 180,
        area: 'Al Khobar',
        areaAr: 'الخبر',
        groupSizeMin: 4,
        groupSizeMax: 8,
        language: 'en',
        price: 175,
        capacity: 8,
        booked: 5,
        planState: 'published',
      },
      {
        title: 'Arabic Coffee Ceremony',
        titleAr: 'جلسة القهوة العربية',
        description: 'Learn the art of traditional Arabic coffee preparation in an intimate group setting. Includes tasting of three regional varieties and pairing with local dates.',
        descriptionAr: 'تعلم فن تحضير القهوة العربية التقليدية في مجموعة صغيرة. يشمل تذوق ثلاثة أنواع إقليمية مع التمور المحلية.',
        date: '2026-02-18',
        time: '10:00',
        duration: '2.5 hours',
        durationMinutes: 150,
        area: 'Riyadh — Al Malqa',
        areaAr: 'الرياض — الملقا',
        groupSizeMin: 3,
        groupSizeMax: 6,
        language: 'ar',
        price: 220,
        capacity: 6,
        booked: 4,
        planState: 'published',
      },
      {
        title: 'Desert Stargazing Evening',
        titleAr: 'أمسية تأمل النجوم في الصحراء',
        description: 'A serene evening at a desert camp, learning constellations with an astronomer guide, traditional dinner under the stars.',
        descriptionAr: 'أمسية هادئة في مخيم صحراوي، تعلم الأبراج مع مرشد فلكي، وعشاء تقليدي تحت النجوم.',
        date: '2026-02-22',
        time: '18:00',
        duration: '4.5 hours',
        durationMinutes: 270,
        area: 'Riyadh — Desert outskirts',
        areaAr: 'الرياض — أطراف الصحراء',
        groupSizeMin: 6,
        groupSizeMax: 12,
        language: 'en',
        price: 350,
        capacity: 12,
        booked: 10,
        planState: 'published',
      },
      {
        title: 'Traditional Cooking Workshop',
        titleAr: 'ورشة طبخ تقليدي',
        description: 'Learn to cook authentic Saudi dishes with a local chef. Includes hands-on preparation of Kabsa, Mutabak, and traditional desserts.',
        descriptionAr: 'تعلم طهي الأطباق السعودية الأصيلة مع طاهٍ محلي. يشمل التحضير العملي للكبة والمطبق والحلويات التقليدية.',
        date: '2026-02-25',
        time: '16:00',
        duration: '3.5 hours',
        durationMinutes: 210,
        area: 'Jeddah — Al Balad',
        areaAr: 'جدة — البلد',
        groupSizeMin: 4,
        groupSizeMax: 8,
        language: 'ar',
        price: 280,
        capacity: 8,
        booked: 6,
        planState: 'published',
      },
      {
        title: 'Historical Old Town Walking Tour',
        titleAr: 'جولة مشي في البلدة القديمة',
        description: 'Explore the UNESCO World Heritage site of Al Balad in Jeddah. Discover centuries-old architecture, traditional markets, and hidden gems.',
        descriptionAr: 'استكشف موقع التراث العالمي لليونسكو في جدة. اكتشف العمارة القديمة والأسواق التقليدية والكنوز المخفية.',
        date: '2026-03-01',
        time: '09:00',
        duration: '3 hours',
        durationMinutes: 180,
        area: 'Jeddah — Al Balad',
        areaAr: 'جدة — البلد',
        groupSizeMin: 6,
        groupSizeMax: 15,
        language: 'en',
        price: 150,
        capacity: 15,
        booked: 8,
        planState: 'published',
      },
      {
        title: 'Calligraphy Workshop',
        titleAr: 'ورشة خط عربي',
        description: 'Learn the art of Arabic calligraphy from a master calligrapher. Create your own piece to take home.',
        descriptionAr: 'تعلم فن الخط العربي من خطاط محترف. أنشئ قطعتك الخاصة لتأخذها معك.',
        date: '2026-03-05',
        time: '15:00',
        duration: '3 hours',
        durationMinutes: 180,
        area: 'Riyadh — Al Olaya',
        areaAr: 'الرياض — العليا',
        groupSizeMin: 3,
        groupSizeMax: 6,
        language: 'ar',
        price: 320,
        capacity: 6,
        booked: 2,
        planState: 'published',
      },
    ];

    logger.info('Creating demo experiences...');
    for (const exp of experiences) {
      await client.query(
        `INSERT INTO experiences (
          title, title_ar, description, description_ar, date, time, duration,
          duration_minutes, area, area_ar, group_size_min, group_size_max,
          language, price, capacity, booked, plan_state
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT DO NOTHING`,
        [
          exp.title,
          exp.titleAr,
          exp.description,
          exp.descriptionAr,
          exp.date,
          exp.time,
          exp.duration,
          exp.durationMinutes,
          exp.area,
          exp.areaAr,
          exp.groupSizeMin,
          exp.groupSizeMax,
          exp.language,
          exp.price,
          exp.capacity,
          exp.booked,
          exp.planState,
        ]
      );
    }

    // Get user IDs for creating reservations
    const participantResult = await client.query(
      "SELECT id FROM users WHERE phone = '+966501234567'"
    );
    const participantId = participantResult.rows[0]?.id;

    const experienceResult = await client.query(
      'SELECT id FROM experiences LIMIT 3'
    );
    const experienceIds = experienceResult.rows.map((r: any) => r.id);

    // Create demo reservations
    if (participantId && experienceIds.length > 0) {
      logger.info('Creating demo reservations...');
      
      const reservations = [
        {
          participantId,
          experienceId: experienceIds[0],
          state: 'confirmed',
          paymentState: 'captured',
        },
        {
          participantId,
          experienceId: experienceIds[1],
          state: 'reconfirmation_required',
          paymentState: 'captured',
          expiryAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          participantId,
          experienceId: experienceIds[2],
          state: 'waitlisted',
          paymentState: 'initiated',
        },
      ];

      for (const res of reservations) {
        await client.query(
          `INSERT INTO reservations (
            participant_id, experience_id, state, payment_state, expiry_at, idempotency_key
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING`,
          [
            res.participantId,
            res.experienceId,
            res.state,
            res.paymentState,
            res.expiryAt || null,
            `seed-${Date.now()}-${Math.random()}`,
          ]
        );
      }
    }

    logger.info('✅ Database seeding completed successfully');
    logger.info('📊 Demo data created:');
    logger.info(`   - ${users.length} users (participants + staff)`);
    logger.info(`   - ${experiences.length} experiences`);
    logger.info(`   - 3 reservations`);
    logger.info('');
    logger.info('🔐 Demo credentials:');
    logger.info('   Participant: +966501234567 / password123');
    logger.info('   Operations:  +966503456789 / password123');
    logger.info('   Support:     +966504567890 / password123');
    logger.info('   Trust&Safety:+966505678901 / password123');
    logger.info('   Admin:       +966506789012 / password123');
    
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;
