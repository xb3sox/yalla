/**
 * API Client for Yalla Backend
 * 
 * This client handles all communication with the backend API,
 * including authentication, error handling, and request/response formatting.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    limit?: number;
    offset?: number;
    count?: number;
  };
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    // In httpOnly cookie authentication mode, tokens are stored in secure cookies managed by the browser.
  }

  /**
   * Get cached data if valid
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Set cache data
   */
  private setCacheData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (retries > 0 && (error.message.includes('network') || error.message.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1)));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Set authentication tokens (in memory fallback / compatibility)
   */
  setTokens(accessToken: string, refreshToken: string) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      // Try to refresh token if unauthorized
      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry logic handled by caller if necessary or return refresh result
          return data;
        }
      }

      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  /**
   * Refresh access token via httpOnly cookie endpoint
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: this.refreshToken ? JSON.stringify({ refreshToken: this.refreshToken }) : undefined,
      });

      const data = await response.json();

      if (data.success) {
        if (data.data?.tokens) {
          this.setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
        }
        return true;
      }

      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Make GET request with caching and retry logic
   */
  async get<T>(endpoint: string, params?: Record<string, any>, options?: { cache?: boolean }): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const cacheKey = url.toString();
    const shouldCache = options?.cache !== false; // Cache by default

    // Check cache first
    if (shouldCache) {
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Make request with retry logic
    const response = await this.retryRequest(async () => {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<T>(res);
    });

    // Cache the response
    if (shouldCache && response.success) {
      this.setCacheData(cacheKey, response);
    }

    return response;
  }

  /**
   * Make POST request with retry logic
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(async () => {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(res);
    });

    // Clear related cache after successful POST
    if (response.success) {
      this.clearCache();
    }

    return response;
  }

  /**
   * Make PUT request with retry logic
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(async () => {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(res);
    });

    // Clear related cache after successful PUT
    if (response.success) {
      this.clearCache();
    }

    return response;
  }

  /**
   * Make DELETE request with retry logic
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(async () => {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include',
      });
      return this.handleResponse<T>(res);
    });

    // Clear related cache after successful DELETE
    if (response.success) {
      this.clearCache();
    }

    return response;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return true; // With httpOnly cookies, requests carry credentials automatically
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export API endpoints
export const api = {
  // Auth
  auth: {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    me: () => apiClient.get('/auth/me'),
    updatePreferences: (data: any) => apiClient.put('/auth/preferences', data),
    exportData: () => apiClient.get('/auth/export'),
    deleteAccount: () => apiClient.delete('/auth/account'),
  },

  // Experiences
  experiences: {
    list: (params?: any) => apiClient.get('/experiences', params),
    search: (params: any) => apiClient.get('/experiences/search', params),
    get: (id: string) => apiClient.get(`/experiences/${id}`),
    create: (data: any) => apiClient.post('/experiences', data),
    update: (id: string, data: any) => apiClient.put(`/experiences/${id}`, data),
    delete: (id: string) => apiClient.delete(`/experiences/${id}`),
  },

  // Reservations
  reservations: {
    create: (data: any) => apiClient.post('/reservations', data),
    list: () => apiClient.get('/reservations'),
    get: (id: string) => apiClient.get(`/reservations/${id}`),
    reconfirm: (id: string) => apiClient.post(`/reservations/${id}/reconfirm`),
    cancel: (id: string) => apiClient.post(`/reservations/${id}/cancel`),
    getByExperience: (experienceId: string) => apiClient.get(`/reservations/experience/${experienceId}`),
    getWaitlist: (experienceId: string) => apiClient.get(`/reservations/experience/${experienceId}/waitlist`),
    offerSeat: (experienceId: string) => apiClient.post(`/reservations/experience/${experienceId}/offer-seat`),
    getRequiringReconfirmation: () => apiClient.get('/reservations/requiring-reconfirmation'),
    getStatistics: () => apiClient.get('/reservations/statistics'),
  },

  // Payments
  payments: {
    createIntent: (data: any) => apiClient.post('/payments/intent', data),
    get: (reservationId: string) => apiClient.get(`/payments/reservation/${reservationId}`),
    refund: (reservationId: string, data?: any) => apiClient.post(`/payments/reservation/${reservationId}/refund`, data),
  },

  // Notifications
  notifications: {
    list: (params?: any) => apiClient.get('/notifications', params),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
    get: (id: string) => apiClient.get(`/notifications/${id}`),
    markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),
  },

  // Favorites
  favorites: {
    add: (experienceId: string) => apiClient.post('/favorites', { experience_id: experienceId }),
    list: () => apiClient.get('/favorites'),
    remove: (id: string) => apiClient.delete(`/favorites/${id}`),
  },

  // Blocks
  blocks: {
    add: (userId: string, reason?: string) => apiClient.post('/blocks', { blocked_user_id: userId, reason }),
    list: () => apiClient.get('/blocks'),
    remove: (id: string) => apiClient.delete(`/blocks/${id}`),
  },

  // Support
  support: {
    create: (data: any) => apiClient.post('/support-requests', data),
    list: (params?: any) => apiClient.get('/support-requests', params),
    myRequests: () => apiClient.get('/support-requests/my-requests'),
    update: (id: string, data: any) => apiClient.put(`/support-requests/${id}`, data),
    addResponse: (id: string, data: any) => apiClient.post(`/support-requests/${id}/responses`, data),
  },

  // Safety Cases
  safetyCases: {
    create: (data: any) => apiClient.post('/safety-cases', data),
    list: (params?: any) => apiClient.get('/safety-cases', params),
    get: (id: string) => apiClient.get(`/safety-cases/${id}`),
    update: (id: string, data: any) => apiClient.put(`/safety-cases/${id}`, data),
    addAction: (id: string, data: any) => apiClient.post(`/safety-cases/${id}/actions`, data),
    getStatistics: () => apiClient.get('/safety-cases/statistics'),
    delete: (id: string) => apiClient.delete(`/safety-cases/${id}`),
  },

  // Staff
  staff: {
    getDashboard: () => apiClient.get('/staff/dashboard'),
    getUsers: (params?: any) => apiClient.get('/staff/users', params),
    updateUserRole: (id: string, role: string) => apiClient.put(`/staff/users/${id}/role`, { role }),
    getReservations: (params?: any) => apiClient.get('/staff/reservations', params),
    updateReservationState: (id: string, state: string) => apiClient.put(`/staff/reservations/${id}/state`, { state }),
    updateExperienceState: (id: string, state: string) => apiClient.put(`/staff/experiences/${id}/state`, { state }),
    assignHost: (id: string, data: any) => apiClient.post(`/staff/experiences/${id}/assign-host`, data),
  },

  // Audit
  audit: {
    list: (params?: any) => apiClient.get('/audit', params),
    getStatistics: (params?: any) => apiClient.get('/audit/statistics', params),
    getByResource: (resourceType: string, resourceId: string) => apiClient.get(`/audit/resource/${resourceType}/${resourceId}`),
    getByActor: (actorId: string, limit?: number) => apiClient.get(`/audit/actor/${actorId}`, { limit }),
    create: (data: any) => apiClient.post('/audit', data),
  },

  // Health
  health: {
    check: () => apiClient.get('/health'),
    metrics: () => apiClient.get('/metrics'),
  },
};

export default apiClient;
