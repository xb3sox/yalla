import { Response } from 'express';
import pool from '../config/database';
import ReservationModel from '../models/reservation.model';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export const getExperiences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const query = `
      SELECT * FROM experiences
      WHERE primary_host_id = $1 OR backup_host_id = $1
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching host experiences:', error);
    res.status(500).json({ error: 'Failed to fetch host experiences' });
  }
};

export const getExperienceRoster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if the user is the host for this experience
    const experienceQuery = `
      SELECT id FROM experiences
      WHERE id = $1 AND (primary_host_id = $2 OR backup_host_id = $2)
    `;
    const experienceResult = await pool.query(experienceQuery, [id, userId]);
    
    if (experienceResult.rows.length === 0) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const roster = await ReservationModel.findByExperience(id);
    res.json(roster);
  } catch (error) {
    logger.error('Error fetching experience roster:', error);
    res.status(500).json({ error: 'Failed to fetch experience roster' });
  }
};

export const verifyPin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pin } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    if (!pin) {
      res.status(400).json({ error: 'PIN is required' });
      return;
    }

    // Check if the user is the host
    const experienceQuery = `
      SELECT id FROM experiences
      WHERE id = $1 AND (primary_host_id = $2 OR backup_host_id = $2)
    `;
    const experienceResult = await pool.query(experienceQuery, [id, userId]);
    
    if (experienceResult.rows.length === 0) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Using the first 8 characters of the reservation id as a PIN
    const query = `
      SELECT id, state FROM reservations 
      WHERE experience_id = $1 AND id::text ILIKE $2
      LIMIT 1
    `;
    
    const reservationResult = await pool.query(query, [id, `${pin}%`]);
    
    if (reservationResult.rows.length === 0) {
      res.status(404).json({ error: 'Invalid PIN' });
      return;
    }
    
    const reservation = reservationResult.rows[0];

    if (reservation.state === 'checked_in') {
      res.status(400).json({ error: 'Already checked in' });
      return;
    }
    
    // Update to checked_in
    const updatedReservation = await ReservationModel.updateState(reservation.id, 'checked_in');
    
    res.json({ message: 'Check-in successful', reservation: updatedReservation });
  } catch (error: any) {
    logger.error('Error verifying PIN:', error);
    
    if (error.message && error.message.includes('Invalid state transition')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to verify PIN' });
  }
};
