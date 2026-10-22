import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, api } from './api';

// Mock fetch
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should set access token in memory only (cookie-based refresh)', () => {
      apiClient.setTokens('access-token');

      // Security requirement: tokens must never be persisted to localStorage.
      expect(localStorage.getItem('yalla_access_token')).toBeNull();
      expect(localStorage.getItem('yalla_refresh_token')).toBeNull();
      expect(apiClient.getToken()).toBe('access-token');
      expect(apiClient.isAuthenticated()).toBe(true);
    });

    it('should clear tokens', () => {
      apiClient.setTokens('access-token');
      apiClient.clearTokens();

      expect(apiClient.getToken()).toBeNull();
      expect(apiClient.isAuthenticated()).toBe(false);
    });

    it('should not load tokens from localStorage after reload', () => {
      localStorage.setItem('yalla_access_token', 'stored-token');

      const newClient = new (apiClient.constructor as any)();
      // Cookie-only auth: JS never reads persisted tokens.
      expect(newClient.getToken()).toBeNull();
    });
  });

  describe('API Methods', () => {
    it('should make GET request', async () => {
      const mockResponse = {
        success: true,
        data: { experiences: [] },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.experiences.list();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/experiences'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.success).toBe(true);
    });

    it('should make POST request', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123' },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.auth.login({ phone: '+966501234567', password: 'password123' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ phone: '+966501234567', password: 'password123' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should make PUT request', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123', display_name: 'Updated Name' },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.auth.updatePreferences({ display_name: 'Updated Name' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/preferences'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ display_name: 'Updated Name' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should make DELETE request', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.favorites.remove('123');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/favorites/123'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result.success).toBe(true);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockResponse),
      });

      await expect(api.auth.login({ phone: 'invalid', password: 'invalid' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('should include authorization header when authenticated', async () => {
      apiClient.setTokens('test-token');
      
      const mockResponse = { success: true, data: {} };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await api.auth.me();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('API Endpoints', () => {
    it('should have all auth endpoints', () => {
      expect(api.auth.register).toBeDefined();
      expect(api.auth.login).toBeDefined();
      expect(api.auth.logout).toBeDefined();
      expect(api.auth.me).toBeDefined();
      expect(api.auth.updatePreferences).toBeDefined();
      expect(api.auth.exportData).toBeDefined();
      expect(api.auth.deleteAccount).toBeDefined();
    });

    it('should have all experience endpoints', () => {
      expect(api.experiences.list).toBeDefined();
      expect(api.experiences.search).toBeDefined();
      expect(api.experiences.get).toBeDefined();
      expect(api.experiences.create).toBeDefined();
      expect(api.experiences.update).toBeDefined();
      expect(api.experiences.delete).toBeDefined();
    });

    it('should have all reservation endpoints', () => {
      expect(api.reservations.create).toBeDefined();
      expect(api.reservations.list).toBeDefined();
      expect(api.reservations.get).toBeDefined();
      expect(api.reservations.reconfirm).toBeDefined();
      expect(api.reservations.cancel).toBeDefined();
      expect(api.reservations.getByExperience).toBeDefined();
      expect(api.reservations.getWaitlist).toBeDefined();
      expect(api.reservations.offerSeat).toBeDefined();
      expect(api.reservations.getRequiringReconfirmation).toBeDefined();
      expect(api.reservations.getStatistics).toBeDefined();
    });

    it('should have all payment endpoints', () => {
      expect(api.payments.createIntent).toBeDefined();
      expect(api.payments.get).toBeDefined();
      expect(api.payments.refund).toBeDefined();
    });

    it('should have all notification endpoints', () => {
      expect(api.notifications.list).toBeDefined();
      expect(api.notifications.getUnreadCount).toBeDefined();
      expect(api.notifications.get).toBeDefined();
      expect(api.notifications.markAsRead).toBeDefined();
    });

    it('should have all favorite endpoints', () => {
      expect(api.favorites.add).toBeDefined();
      expect(api.favorites.list).toBeDefined();
      expect(api.favorites.remove).toBeDefined();
    });

    it('should have all feedback endpoints', () => {
      expect(api.feedbacks.create).toBeDefined();
      expect(api.feedbacks.getByExperience).toBeDefined();
    });

    it('should have all block endpoints', () => {
      expect(api.blocks.add).toBeDefined();
      expect(api.blocks.list).toBeDefined();
      expect(api.blocks.remove).toBeDefined();
    });

    it('should have all support endpoints', () => {
      expect(api.support.create).toBeDefined();
      expect(api.support.list).toBeDefined();
      expect(api.support.myRequests).toBeDefined();
      expect(api.support.update).toBeDefined();
      expect(api.support.addResponse).toBeDefined();
    });

    it('should have all safety case endpoints', () => {
      expect(api.safetyCases.create).toBeDefined();
      expect(api.safetyCases.list).toBeDefined();
      expect(api.safetyCases.get).toBeDefined();
      expect(api.safetyCases.update).toBeDefined();
      expect(api.safetyCases.addAction).toBeDefined();
      expect(api.safetyCases.getStatistics).toBeDefined();
      expect(api.safetyCases.delete).toBeDefined();
    });

    it('should have all staff endpoints', () => {
      expect(api.staff.getDashboard).toBeDefined();
      expect(api.staff.getUsers).toBeDefined();
      expect(api.staff.updateUserRole).toBeDefined();
      expect(api.staff.getReservations).toBeDefined();
      expect(api.staff.updateReservationState).toBeDefined();
      expect(api.staff.updateExperienceState).toBeDefined();
      expect(api.staff.assignHost).toBeDefined();
    });

    it('should have all audit endpoints', () => {
      expect(api.audit.list).toBeDefined();
      expect(api.audit.getStatistics).toBeDefined();
      expect(api.audit.getByResource).toBeDefined();
      expect(api.audit.getByActor).toBeDefined();
      expect(api.audit.create).toBeDefined();
    });

    it('should have health endpoints', () => {
      expect(api.health.check).toBeDefined();
      expect(api.health.metrics).toBeDefined();
    });
  });
});
