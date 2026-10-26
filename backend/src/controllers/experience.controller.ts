import { Request, Response } from 'express';
import experienceModel from '../models/experience.model';
import logger from '../utils/logger';
import { invalidateExperienceCache } from '../middleware/cache.middleware';

/**
 * Get all published experiences
 */
export const getExperiences = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const experiences = await experienceModel.findAllPublished(limit, offset);
    
    res.json({
      success: true,
      data: { experiences },
      meta: {
        limit,
        offset,
        count: experiences.length,
      },
    });
  } catch (error: any) {
    logger.error('Get experiences failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EXPERIENCES_FAILED',
        message: 'Failed to get experiences',
      },
    });
  }
};

/**
 * Get experience by ID
 */
export const getExperienceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const experience = await experienceModel.findById(id);
    
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }
    
    res.json({
      success: true,
      data: { experience },
    });
  } catch (error: any) {
    logger.error('Get experience failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EXPERIENCE_FAILED',
        message: 'Failed to get experience',
      },
    });
  }
};

/**
 * Search experiences
 */
export const searchExperiences = async (req: Request, res: Response) => {
  try {
    const { query, area, minPrice, maxPrice, language, date } = req.query;
    
    const experiences = await experienceModel.search({
      query: query as string,
      area: area as string,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      language: language as string,
      date: date as string,
    });
    
    res.json({
      success: true,
      data: { experiences },
      meta: {
        count: experiences.length,
      },
    });
  } catch (error: any) {
    logger.error('Search experiences failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to search experiences',
      },
    });
  }
};

/**
 * Staff operations search experiences
 */
export const staffSearchExperiences = async (req: Request, res: Response) => {
  try {
    const { searchQuery, city, status, minSpots, maxPrice } = req.query;
    
    const experiences = await experienceModel.staffSearch({
      searchQuery: searchQuery as string,
      city: city as string,
      status: status as string,
      minSpots: minSpots ? parseInt(minSpots as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
    });
    
    res.json({
      success: true,
      data: { experiences },
      meta: {
        count: experiences.length,
      },
    });
  } catch (error: any) {
    logger.error('Staff search experiences failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'STAFF_SEARCH_FAILED',
        message: 'Failed to search experiences for staff operations',
      },
    });
  }
};

/**
 * Create experience (staff only)
 */
export const createExperience = async (req: Request, res: Response) => {
  try {
    const input = req.body;
    
    const experience = await experienceModel.create(input);
    
    await invalidateExperienceCache();
    logger.info('Experience created', { experienceId: experience.id });
    
    res.status(201).json({
      success: true,
      data: { experience },
      message: 'Experience created successfully',
    });
  } catch (error: any) {
    logger.error('Create experience failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_EXPERIENCE_FAILED',
        message: 'Failed to create experience',
      },
    });
  }
};

/**
 * Update experience (staff only)
 */
export const updateExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const experience = await experienceModel.findById(id);
    
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }
    
    const updated = await experienceModel.update(id, updates);
    
    await invalidateExperienceCache();
    logger.info('Experience updated', { experienceId: id });
    
    res.json({
      success: true,
      data: { experience: updated },
      message: 'Experience updated successfully',
    });
  } catch (error: any) {
    logger.error('Update experience failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_EXPERIENCE_FAILED',
        message: 'Failed to update experience',
      },
    });
  }
};

/**
 * Delete experience (staff only)
 */
export const deleteExperience = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const experience = await experienceModel.findById(id);
    
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }
    
    await experienceModel.delete(id);
    
    await invalidateExperienceCache();
    logger.info('Experience deleted', { experienceId: id });
    
    res.json({
      success: true,
      message: 'Experience deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete experience failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_EXPERIENCE_FAILED',
        message: 'Failed to delete experience',
      },
    });
  }
};
