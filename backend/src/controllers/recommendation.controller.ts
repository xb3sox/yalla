import { Request, Response } from 'express';
import experienceModel from '../models/experience.model';
import userModel from '../models/user.model';
import reservationModel from '../models/reservation.model';
import logger from '../utils/logger';

/**
 * Get personalized experience recommendations
 */
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID missing in request',
        },
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // Fetch user to get preferences
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Fetch user's past bookings
    const pastBookings = await reservationModel.findByParticipant(userId);
    // Create an O(N) lookup for fast checking
    const bookedExperienceIds = new Set(pastBookings.map((b) => b.experience_id));

    // Fetch all published experiences
    const allExperiences = await experienceModel.findAllPublished(1000, 0);

    const userBudgetMin = user.budget_min || 0;
    const userBudgetMax = user.budget_max || 10000;
    const userPreferredArea = user.preferred_area?.toLowerCase();
    const userAccessibilityNeeds = user.accessibility_needs?.toLowerCase();

    // O(N) loop to score experiences
    const scoredExperiences = allExperiences.map((exp) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Scoring by Bookings (exclude past bookings)
      if (bookedExperienceIds.has(exp.id)) {
        score -= 1000;
      }

      // 2. Scoring by Area
      if (userPreferredArea && exp.area?.toLowerCase().includes(userPreferredArea)) {
        score += 10;
        reasons.push('Matches your preferred area');
      }

      // 3. Scoring by Budget
      const price = Number(exp.price);
      if (price >= userBudgetMin && price <= userBudgetMax) {
        score += 5;
        reasons.push('Within your budget range');
      }

      // 4. Scoring by Accessibility Needs
      if (userAccessibilityNeeds && exp.accessibility && exp.accessibility?.toLowerCase().includes(userAccessibilityNeeds)) {
        score += 5;
        reasons.push('Matches accessibility needs');
      }

      // 5. Scoring by Popularity (Bookings)
      if (exp.booked > 0) {
        score += Math.min(exp.booked, 10) * 0.1;
        if (exp.booked >= (exp.capacity || 10) * 0.8) {
          reasons.push('Limited spots available');
        } else {
          reasons.push('Good availability');
        }
      }

      if (reasons.length === 0) {
        reasons.push('New experience to discover');
      }

      return {
        ...exp,
        score,
        reasons,
      };
    });

    const recommendations = scoredExperiences
      .filter((exp) => exp.score > -500)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Remove the 'score' property before sending
    const finalRecommendations = recommendations.map(({ score: _score, ...rest }) => rest);

    res.json({
      success: true,
      data: { experiences: finalRecommendations },
      meta: {
        count: finalRecommendations.length,
      },
    });
  } catch (error: any) {
    logger.error('Get recommendations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RECOMMENDATIONS_FAILED',
        message: 'Failed to get recommendations',
      },
    });
  }
};
