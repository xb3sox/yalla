import { Response } from 'express';
import pool from '../config/database';
import ReservationModel from '../models/reservation.model';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';
import { EXPERIENCE_TRANSITIONS } from '../models/experience.model';

const PLATFORM_COMMISSION_RATE = 0.15; // 15% platform commission

/**
 * GET /api/v1/host/dashboard/summary
 * Summary metrics for the logged-in host
 */
export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    // 1. Fetch rating average
    const ratingQuery = `
      SELECT COALESCE(AVG(f.worth_time), 5.0) as avg_rating, COUNT(f.id) as review_count
      FROM feedbacks f
      JOIN experiences e ON f.experience_id = e.id
      WHERE e.primary_host_id = $1 OR e.backup_host_id = $1
    `;
    const ratingRes = await pool.query(ratingQuery, [userId]);
    const overallRating = parseFloat(parseFloat(ratingRes.rows[0]?.avg_rating || '5.0').toFixed(1));

    // 2. Fetch upcoming sessions count
    const upcomingQuery = `
      SELECT COUNT(*)::int as count
      FROM experiences
      WHERE (primary_host_id = $1 OR backup_host_id = $1)
        AND date >= CURRENT_DATE
        AND plan_state != 'cancelled'
    `;
    const upcomingRes = await pool.query(upcomingQuery, [userId]);
    const upcomingSessions = upcomingRes.rows[0]?.count || 0;

    // 3. Fetch total attendees served
    const attendeesQuery = `
      SELECT COUNT(*)::int as count
      FROM reservations r
      JOIN experiences e ON r.experience_id = e.id
      WHERE (e.primary_host_id = $1 OR e.backup_host_id = $1)
        AND r.state IN ('confirmed', 'reconfirmed', 'checked_in', 'attended', 'completed')
    `;
    const attendeesRes = await pool.query(attendeesQuery, [userId]);
    const totalAttendeesServed = attendeesRes.rows[0]?.count || 0;

    // 4. Calculate total earnings (completed sessions gross minus platform commission)
    const earningsQuery = `
      SELECT COALESCE(SUM(e.price * e.booked), 0)::int as gross_earnings
      FROM experiences e
      WHERE (e.primary_host_id = $1 OR e.backup_host_id = $1)
        AND e.plan_state = 'completed'
    `;
    const earningsRes = await pool.query(earningsQuery, [userId]);
    const grossEarnings = parseInt(earningsRes.rows[0]?.gross_earnings || '0', 10);
    const totalEarnings = Math.round(grossEarnings * (1 - PLATFORM_COMMISSION_RATE));

    res.json({
      success: true,
      data: {
        overallRating,
        totalEarnings,
        upcomingSessions,
        totalAttendeesServed,
        platformCommissionRate: PLATFORM_COMMISSION_RATE,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching host dashboard summary:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch host summary' } });
  }
};

/**
 * GET /api/v1/host/experiences
 * List experiences hosted by the authenticated host
 */
export const getHostExperiences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    const query = `
      SELECT * FROM experiences
      WHERE primary_host_id = $1 OR backup_host_id = $1
      ORDER BY date DESC, time DESC
    `;
    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error fetching host experiences:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch host experiences' } });
  }
};

/**
 * POST /api/v1/host/sessions
 * Schedule new date/time instance for an experience
 */
export const scheduleSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    const {
      title,
      title_ar,
      description,
      description_ar,
      date,
      time,
      duration,
      duration_minutes,
      area,
      area_ar,
      price,
      capacity,
      group_size_min,
      group_size_max,
      language,
    } = req.body;

    if (!title || !date || !time || !price || !capacity) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required session parameters (title, date, time, price, capacity)' },
      });
      return;
    }

    const query = `
      INSERT INTO experiences (
        title, title_ar, description, description_ar,
        date, time, duration, duration_minutes,
        area, area_ar, group_size_min, group_size_max,
        language, price, capacity, booked,
        primary_host_id, plan_state
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, $16, 'published')
      RETURNING *
    `;

    const values = [
      title,
      title_ar || title,
      description || 'Host scheduled experience',
      description_ar || description || 'تجربة جديدة',
      date,
      time,
      duration || '2 hours',
      duration_minutes || 120,
      area || 'Riyadh',
      area_ar || 'الرياض',
      group_size_min || 2,
      group_size_max || capacity,
      language || 'en',
      price,
      capacity,
      userId,
    ];

    const result = await pool.query(query, values);
    const session = result.rows[0];

    logger.info(`Host ${userId} scheduled new experience session ${session.id}`);

    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Error scheduling host session:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to schedule session' } });
  }
};

/**
 * PATCH /api/v1/host/sessions/:id
 * Modify session start time, max capacity, or cancellation status
 */
export const updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    // 1. Enforce Data Isolation & Ownership
    const checkQuery = `
      SELECT * FROM experiences
      WHERE id = $1 AND (primary_host_id = $2 OR backup_host_id = $2)
    `;
    const checkRes = await pool.query(checkQuery, [id, userId]);
    if (checkRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Experience session not found or permission denied' },
      });
      return;
    }

    const currentSession = checkRes.rows[0];

    // Get current confirmed count for Business Safety Lock 1
    const countQuery = `
      SELECT COUNT(*)::int as confirmed_count
      FROM reservations
      WHERE experience_id = $1 AND state IN ('confirmed', 'reconfirmed', 'checked_in', 'attended', 'completed')
    `;
    const countRes = await pool.query(countQuery, [id]);
    const currentConfirmedCount = Math.max(countRes.rows[0]?.confirmed_count || 0, currentSession.booked || 0);

    const { capacity, time, plan_state, date } = req.body;

    // Hosts move sessions through the same lifecycle as staff — arbitrary
    // plan_state values (or jumps like draft -> completed) are rejected.
    if (
      plan_state !== undefined &&
      plan_state !== currentSession.plan_state &&
      !EXPERIENCE_TRANSITIONS[currentSession.plan_state]?.includes(plan_state)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot transition from ${currentSession.plan_state} to ${plan_state}`,
        },
      });
      return;
    }

    // Safety Lock 1: Cannot reduce capacity below currently confirmed count
    if (capacity !== undefined && Number(capacity) < currentConfirmedCount) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CAPACITY_TOO_LOW',
          message: `Cannot reduce session capacity (${capacity}) below currently confirmed bookings count (${currentConfirmedCount}).`,
          current_confirmed_count: currentConfirmedCount,
        },
      });
      return;
    }

    // Safety Lock 2: Cannot cancel within 24 hours without staff alert
    let staffAlertTriggered = false;
    if (plan_state === 'cancelled' && currentSession.plan_state !== 'cancelled') {
      // pg returns DATE columns as Date objects; interpolate them raw and
      // this becomes an Invalid Date, silently disabling the alert.
      const datePart =
        currentSession.date instanceof Date
          ? currentSession.date.toISOString().slice(0, 10)
          : String(currentSession.date).slice(0, 10);
      const sessionStart = new Date(`${datePart}T${currentSession.time}`);
      const now = new Date();
      const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilSession <= 24) {
        staffAlertTriggered = true;
        logger.warn(`Host ${userId} cancelled session ${id} within 24 hours! Triggering staff operations alert.`);

        // Create operational audit alert
        await pool.query(
          `INSERT INTO audit_events (actor_id, actor_role, action, resource_type, resource_id, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            req.user?.role || 'host',
            'HOST_LATE_CANCELLATION_ALERT',
            'experience',
            id,
            JSON.stringify({
              message: 'Host cancelled experience session within 24 hours window.',
              hoursUntilSession,
              confirmedBookings: currentConfirmedCount,
            }),
          ]
        );
      }
    }

    // Perform updates
    const newCapacity = capacity !== undefined ? Number(capacity) : currentSession.capacity;
    const newTime = time || currentSession.time;
    const newDate = date || currentSession.date;
    const newPlanState = plan_state || currentSession.plan_state;

    const updateQuery = `
      UPDATE experiences
      SET capacity = $1, time = $2, date = $3, plan_state = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const updateRes = await pool.query(updateQuery, [newCapacity, newTime, newDate, newPlanState, id]);

    res.json({
      success: true,
      data: updateRes.rows[0],
      staffAlertTriggered,
    });
  } catch (error: any) {
    logger.error('Error updating host session:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update session' } });
  }
};

/**
 * GET /api/v1/host/payouts
 * List historical payouts and pending revenue balance
 */
export const getPayouts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    // 1. Completed sessions (payout history)
    const completedQuery = `
      SELECT id, title, title_ar, date, time, price, capacity, booked,
             (price * booked) as gross_revenue,
             ROUND((price * booked) * (1 - $2::numeric), 2) as net_payout,
             ROUND((price * booked) * $2::numeric, 2) as platform_fee,
             'completed' as stripe_transfer_status,
             updated_at as payout_date
      FROM experiences
      WHERE (primary_host_id = $1 OR backup_host_id = $1)
        AND plan_state = 'completed'
      ORDER BY date DESC
    `;
    const completedRes = await pool.query(completedQuery, [userId, PLATFORM_COMMISSION_RATE]);

    // 2. Pending upcoming/published sessions balance
    const pendingQuery = `
      SELECT COALESCE(SUM(price * booked), 0) as gross_pending
      FROM experiences
      WHERE (primary_host_id = $1 OR backup_host_id = $1)
        AND plan_state IN ('published', 'in_progress')
    `;
    const pendingRes = await pool.query(pendingQuery, [userId]);
    const grossPending = parseFloat(pendingRes.rows[0]?.gross_pending || '0');
    const pendingBalance = Math.round(grossPending * (1 - PLATFORM_COMMISSION_RATE));

    const payouts = completedRes.rows.map(row => ({
      id: row.id,
      sessionTitle: row.title,
      sessionTitleAr: row.title_ar,
      date: row.date,
      attendees: row.booked,
      grossRevenue: parseFloat(row.gross_revenue || '0'),
      platformFee: parseFloat(row.platform_fee || '0'),
      netPayout: parseFloat(row.net_payout || '0'),
      stripeTransferStatus: 'transferred',
      payoutDate: row.payout_date,
    }));

    const totalPaidOut = payouts.reduce((acc, p) => acc + p.netPayout, 0);

    res.json({
      success: true,
      data: {
        pendingBalance,
        totalPaidOut,
        commissionPercentage: PLATFORM_COMMISSION_RATE * 100,
        payouts,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching host payouts:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payouts' } });
  }
};

/**
 * GET /api/v1/host/experiences/:id/roster
 * Roster for attendee check-in
 */
export const getExperienceRoster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    const checkQuery = `
      SELECT id FROM experiences
      WHERE id = $1 AND (primary_host_id = $2 OR backup_host_id = $2)
    `;
    const checkRes = await pool.query(checkQuery, [id, userId]);
    if (checkRes.rows.length === 0) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    const roster = await ReservationModel.findByExperience(id);
    res.json({ success: true, data: roster });
  } catch (error: any) {
    logger.error('Error fetching roster:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roster' } });
  }
};

/**
 * POST /api/v1/host/experiences/:id/verify-pin
 * Check-in attendee using PIN
 */
export const verifyPin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      return;
    }

    if (!pin) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'PIN is required' } });
      return;
    }

    if (typeof pin !== 'string' || pin.trim().length < 4) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'PIN must be at least 4 characters' } });
      return;
    }

    const checkQuery = `
      SELECT id FROM experiences
      WHERE id = $1 AND (primary_host_id = $2 OR backup_host_id = $2)
    `;
    const checkRes = await pool.query(checkQuery, [id, userId]);
    if (checkRes.rows.length === 0) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      return;
    }

    const query = `
      SELECT id, state FROM reservations
      WHERE experience_id = $1 AND (id::text ILIKE $2 OR pin = $3)
      LIMIT 1
    `;
    const sanitizedPin = pin.trim().replace(/[%_\\]/g, '\\$&');
    const reservationRes = await pool.query(query, [id, `${sanitizedPin}%`, pin.trim()]);

    if (reservationRes.rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invalid PIN' } });
      return;
    }

    const reservation = reservationRes.rows[0];

    if (reservation.state === 'checked_in') {
      res.status(400).json({ success: false, error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in' } });
      return;
    }

    const updatedReservation = await ReservationModel.updateState(reservation.id, 'checked_in');

    res.json({
      success: true,
      data: updatedReservation,
      message: 'Check-in successful',
    });
  } catch (error: any) {
    logger.error('Error verifying PIN:', error);
    if (error.message && error.message.includes('Invalid state transition')) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TRANSITION', message: error.message } });
      return;
    }

    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify PIN' } });
  }
};
