import { describe, it, expect, beforeEach } from 'vitest';
import { mockExperiences, mockUser, mockReservations, mockNotifications } from '../infrastructure/mock/mockData';

// Mock the store module
const createStore = () => {
  let state = {
    language: 'en' as const,
    role: 'participant' as const,
    user: mockUser,
    isAuthenticated: true,
    onboardingStep: 'complete' as const,
    experiences: mockExperiences,
    reservations: [...mockReservations],
    notifications: [...mockNotifications],
    supportRequests: [] as any[],
    feedbacks: [] as any[],
    favorites: [] as string[],
    blocks: [] as any[],
    safetyCases: [] as any[],
    auditEvents: [] as any[],
    currentView: 'explore',
  };

  const dispatch = (action: any) => {
    switch (action.type) {
      case 'SET_LANGUAGE':
        state = { ...state, language: action.payload };
        break;
      case 'SET_ROLE':
        state = { ...state, role: action.payload };
        break;
      case 'ADD_RESERVATION': {
        const hasActiveReservation = state.reservations.some(
          r => r.participantId === action.payload.participantId &&
               r.planId === action.payload.planId &&
               ['initiated', 'payment_pending', 'confirmed', 'reconfirmation_required', 'reconfirmed'].includes(r.state)
        );
        
        if (!hasActiveReservation) {
          state = { ...state, reservations: [...state.reservations, action.payload] };
        }
        break;
      }
      case 'RECONFIRM_RESERVATION': {
        const reservation = state.reservations.find(r => r.id === action.payload);
        
        if (reservation && reservation.state === 'reconfirmation_required') {
          if (!reservation.expiryAt || new Date(reservation.expiryAt) > new Date()) {
            state = {
              ...state,
              reservations: state.reservations.map(r =>
                r.id === action.payload 
                  ? { ...r, state: 'reconfirmed' as const, reconfirmedAt: new Date().toISOString() }
                  : r
              ),
            };
          }
        }
        break;
      }
      case 'CANCEL_RESERVATION':
        state = {
          ...state,
          reservations: state.reservations.map(r =>
            r.id === action.payload 
              ? { ...r, state: 'cancelled_by_participant' as const, cancelledAt: new Date().toISOString() }
              : r
          ),
        };
        break;
      case 'ADD_FAVORITE': {
        if (!state.favorites.includes(action.payload)) {
          state = { ...state, favorites: [...state.favorites, action.payload] };
        }
        break;
      }
      case 'REMOVE_FAVORITE':
        state = { ...state, favorites: state.favorites.filter(id => id !== action.payload) };
        break;
      case 'ADD_FEEDBACK':
        state = { ...state, feedbacks: [...state.feedbacks, action.payload] };
        break;
      case 'ADD_SUPPORT_REQUEST':
        state = { ...state, supportRequests: [...state.supportRequests, action.payload] };
        break;
      case 'ADD_BLOCK': {
        const hasBlock = state.blocks.some(
          b => b.blockerId === action.payload.blockerId && 
               b.blockedEntityId === action.payload.blockedEntityId
        );
        if (!hasBlock) {
          state = { ...state, blocks: [...state.blocks, action.payload] };
        }
        break;
      }
      case 'REMOVE_BLOCK':
        state = { ...state, blocks: state.blocks.filter(b => b.id !== action.payload) };
        break;
      case 'ADD_SAFETY_CASE':
        state = { ...state, safetyCases: [...state.safetyCases, action.payload] };
        break;
      case 'UPDATE_SAFETY_CASE':
        state = {
          ...state,
          safetyCases: state.safetyCases.map(c =>
            c.id === action.payload.id ? { ...c, state: action.payload.state } : c
          ),
        };
        break;
      case 'ADD_AUDIT_EVENT':
        state = { ...state, auditEvents: [...state.auditEvents, action.payload] };
        break;
      case 'ACCEPT_MATERIAL_CHANGES': {
        const auditEvent = {
          id: `audit-${Date.now()}`,
          actorId: state.user?.id || 'unknown',
          actorRole: state.role,
          action: 'material_changes_accepted',
          resourceType: 'reservation',
          resourceId: action.payload.reservationId,
          details: { changeIds: action.payload.changeIds },
          timestamp: new Date().toISOString(),
          classification: 'confidential' as const,
        };
        state = { ...state, auditEvents: [...state.auditEvents, auditEvent] };
        break;
      }
    }
  };

  return { getState: () => state, dispatch };
};

describe('Store Integration Tests', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Reservation Actions', () => {
    it('should add a new reservation', () => {
      const newReservation = {
        id: 'res-new',
        participantId: 'user-1',
        planId: 'exp-4',
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-new',
      };

      store.dispatch({ type: 'ADD_RESERVATION', payload: newReservation });

      const state = store.getState();
      expect(state.reservations).toHaveLength(mockReservations.length + 1);
      expect(state.reservations.find(r => r.id === 'res-new')).toBeDefined();
    });

    it('should prevent duplicate active reservations', () => {
      const duplicateReservation = {
        id: 'res-dup',
        participantId: 'user-1',
        planId: 'exp-1', // Same as existing reservation
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-dup',
      };

      const initialCount = store.getState().reservations.length;
      store.dispatch({ type: 'ADD_RESERVATION', payload: duplicateReservation });

      expect(store.getState().reservations.length).toBe(initialCount);
    });

    it('should allow multiple reservations for different experiences', () => {
      const reservation1 = {
        id: 'res-1-new',
        participantId: 'user-1',
        planId: 'exp-4',
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-1',
      };

      const reservation2 = {
        id: 'res-2-new',
        participantId: 'user-1',
        planId: 'exp-5',
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-2',
      };

      store.dispatch({ type: 'ADD_RESERVATION', payload: reservation1 });
      store.dispatch({ type: 'ADD_RESERVATION', payload: reservation2 });

      const state = store.getState();
      expect(state.reservations.find(r => r.id === 'res-1-new')).toBeDefined();
      expect(state.reservations.find(r => r.id === 'res-2-new')).toBeDefined();
    });

    it('should reconfirm a reservation', () => {
      const reconfirmId = 'res-2'; // Has state 'reconfirmation_required'
      
      store.dispatch({ type: 'RECONFIRM_RESERVATION', payload: reconfirmId });

      const state = store.getState();
      const reservation = state.reservations.find(r => r.id === reconfirmId);
      expect(reservation?.state).toBe('reconfirmed');
      expect(reservation?.reconfirmedAt).toBeDefined();
    });

    it('should not reconfirm expired reservation', () => {
      const expiredReservation = {
        id: 'res-expired',
        participantId: 'user-1',
        planId: 'exp-1',
        state: 'reconfirmation_required' as const,
        createdAt: new Date().toISOString(),
        expiryAt: '2020-01-01T00:00:00Z', // Past date
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-expired',
      };

      store.dispatch({ type: 'ADD_RESERVATION', payload: expiredReservation });
      store.dispatch({ type: 'RECONFIRM_RESERVATION', payload: 'res-expired' });

      const state = store.getState();
      const reservation = state.reservations.find(r => r.id === 'res-expired');
      expect(reservation?.state).toBe('reconfirmation_required'); // Should not change
    });

    it('should cancel a reservation', () => {
      const cancelId = 'res-1';
      
      store.dispatch({ type: 'CANCEL_RESERVATION', payload: cancelId });

      const state = store.getState();
      const reservation = state.reservations.find(r => r.id === cancelId);
      expect(reservation?.state).toBe('cancelled_by_participant');
      expect(reservation?.cancelledAt).toBeDefined();
    });
  });

  describe('Favorite Actions', () => {
    it('should add a favorite', () => {
      store.dispatch({ type: 'ADD_FAVORITE', payload: 'exp-1' });

      const state = store.getState();
      expect(state.favorites).toContain('exp-1');
    });

    it('should prevent duplicate favorites', () => {
      store.dispatch({ type: 'ADD_FAVORITE', payload: 'exp-1' });
      store.dispatch({ type: 'ADD_FAVORITE', payload: 'exp-1' });

      const state = store.getState();
      const count = state.favorites.filter(id => id === 'exp-1').length;
      expect(count).toBe(1);
    });

    it('should remove a favorite', () => {
      store.dispatch({ type: 'ADD_FAVORITE', payload: 'exp-1' });
      store.dispatch({ type: 'REMOVE_FAVORITE', payload: 'exp-1' });

      const state = store.getState();
      expect(state.favorites).not.toContain('exp-1');
    });
  });

  describe('Feedback Actions', () => {
    it('should add feedback', () => {
      const feedback = {
        id: 'fb-1',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 5,
        descriptionAccurate: true,
        comfortableOrganized: true,
        comment: 'Great experience!',
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_FEEDBACK', payload: feedback });

      const state = store.getState();
      expect(state.feedbacks).toHaveLength(1);
      expect(state.feedbacks[0].id).toBe('fb-1');
    });
  });

  describe('Support Request Actions', () => {
    it('should add support request', () => {
      const request = {
        id: 'sr-1',
        participantId: 'user-1',
        type: 'operational' as const,
        state: 'submitted' as const,
        subject: 'Help needed',
        subjectAr: 'مساعدة مطلوبة',
        description: 'I need help',
        descriptionAr: 'أحتاج مساعدة',
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_SUPPORT_REQUEST', payload: request });

      const state = store.getState();
      expect(state.supportRequests).toHaveLength(1);
      expect(state.supportRequests[0].id).toBe('sr-1');
    });
  });

  describe('Block Actions', () => {
    it('should add a block', () => {
      const block = {
        id: 'block-1',
        blockerId: 'user-1',
        blockedEntityId: 'user-2',
        blockedEntityType: 'participant' as const,
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_BLOCK', payload: block });

      const state = store.getState();
      expect(state.blocks).toHaveLength(1);
      expect(state.blocks[0].id).toBe('block-1');
    });

    it('should prevent duplicate blocks', () => {
      const block = {
        id: 'block-1',
        blockerId: 'user-1',
        blockedEntityId: 'user-2',
        blockedEntityType: 'participant' as const,
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_BLOCK', payload: block });
      store.dispatch({ type: 'ADD_BLOCK', payload: { ...block, id: 'block-2' } });

      const state = store.getState();
      expect(state.blocks).toHaveLength(1);
    });

    it('should remove a block', () => {
      const block = {
        id: 'block-1',
        blockerId: 'user-1',
        blockedEntityId: 'user-2',
        blockedEntityType: 'participant' as const,
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_BLOCK', payload: block });
      store.dispatch({ type: 'REMOVE_BLOCK', payload: 'block-1' });

      const state = store.getState();
      expect(state.blocks).toHaveLength(0);
    });
  });

  describe('Safety Case Actions', () => {
    it('should add a safety case', () => {
      const safetyCase = {
        id: 'case-1',
        reporterId: 'user-1',
        state: 'submitted' as const,
        category: 'Inappropriate behavior',
        categoryAr: 'سلوك غير لائق',
        narrative: 'User was rude',
        evidence: [],
        actions: [],
        createdAt: new Date().toISOString(),
        restrictedAccess: true as const,
      };

      store.dispatch({ type: 'ADD_SAFETY_CASE', payload: safetyCase });

      const state = store.getState();
      expect(state.safetyCases).toHaveLength(1);
      expect(state.safetyCases[0].id).toBe('case-1');
    });

    it('should update safety case state', () => {
      const safetyCase = {
        id: 'case-1',
        reporterId: 'user-1',
        state: 'submitted' as const,
        category: 'Inappropriate behavior',
        categoryAr: 'سلوك غير لائق',
        narrative: 'User was rude',
        evidence: [],
        actions: [],
        createdAt: new Date().toISOString(),
        restrictedAccess: true as const,
      };

      store.dispatch({ type: 'ADD_SAFETY_CASE', payload: safetyCase });
      store.dispatch({ 
        type: 'UPDATE_SAFETY_CASE', 
        payload: { id: 'case-1', state: 'under_review' } 
      });

      const state = store.getState();
      const updatedCase = state.safetyCases.find(c => c.id === 'case-1');
      expect(updatedCase?.state).toBe('under_review');
    });
  });

  describe('Audit Event Actions', () => {
    it('should add audit event', () => {
      const auditEvent = {
        id: 'audit-1',
        actorId: 'user-1',
        actorRole: 'participant' as const,
        action: 'booking_created',
        resourceType: 'reservation',
        resourceId: 'res-1',
        details: {},
        timestamp: new Date().toISOString(),
        classification: 'internal' as const,
      };

      store.dispatch({ type: 'ADD_AUDIT_EVENT', payload: auditEvent });

      const state = store.getState();
      expect(state.auditEvents).toHaveLength(1);
      expect(state.auditEvents[0].id).toBe('audit-1');
    });

    it('should create audit event when accepting material changes', () => {
      store.dispatch({
        type: 'ACCEPT_MATERIAL_CHANGES',
        payload: {
          reservationId: 'res-1',
          changeIds: ['change-1', 'change-2'],
        },
      });

      const state = store.getState();
      expect(state.auditEvents).toHaveLength(1);
      expect(state.auditEvents[0].action).toBe('material_changes_accepted');
      expect(state.auditEvents[0].resourceId).toBe('res-1');
    });
  });

  describe('Language and Role Actions', () => {
    it('should change language', () => {
      store.dispatch({ type: 'SET_LANGUAGE', payload: 'ar' });

      const state = store.getState();
      expect(state.language).toBe('ar');
    });

    it('should change role', () => {
      store.dispatch({ type: 'SET_ROLE', payload: 'operations' });

      const state = store.getState();
      expect(state.role).toBe('operations');
    });
  });

  describe('Business Rules Integration', () => {
    it('BR-001: Should prevent duplicate bookings', () => {
      const reservation1 = {
        id: 'res-test-1',
        participantId: 'user-1',
        planId: 'exp-4',
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-1',
      };

      const reservation2 = {
        id: 'res-test-2',
        participantId: 'user-1',
        planId: 'exp-4', // Same experience
        state: 'confirmed' as const,
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-2',
      };

      store.dispatch({ type: 'ADD_RESERVATION', payload: reservation1 });
      const countAfterFirst = store.getState().reservations.length;
      
      store.dispatch({ type: 'ADD_RESERVATION', payload: reservation2 });
      const countAfterSecond = store.getState().reservations.length;

      expect(countAfterSecond).toBe(countAfterFirst); // Should not increase
    });

    it('BR-005: Should only reconfirm if state is reconfirmation_required', () => {
      const reservation = {
        id: 'res-test',
        participantId: 'user-1',
        planId: 'exp-4',
        state: 'confirmed' as const, // Not reconfirmation_required
        createdAt: new Date().toISOString(),
        paymentState: 'captured' as const,
        idempotencyKey: 'idem-test',
      };

      store.dispatch({ type: 'ADD_RESERVATION', payload: reservation });
      store.dispatch({ type: 'RECONFIRM_RESERVATION', payload: 'res-test' });

      const state = store.getState();
      const updatedReservation = state.reservations.find(r => r.id === 'res-test');
      expect(updatedReservation?.state).toBe('confirmed'); // Should not change
    });

    it('BR-015: Should prevent duplicate blocks', () => {
      const block1 = {
        id: 'block-test-1',
        blockerId: 'user-1',
        blockedEntityId: 'user-2',
        blockedEntityType: 'participant' as const,
        createdAt: new Date().toISOString(),
      };

      const block2 = {
        id: 'block-test-2',
        blockerId: 'user-1',
        blockedEntityId: 'user-2', // Same blocked entity
        blockedEntityType: 'participant' as const,
        createdAt: new Date().toISOString(),
      };

      store.dispatch({ type: 'ADD_BLOCK', payload: block1 });
      const countAfterFirst = store.getState().blocks.length;
      
      store.dispatch({ type: 'ADD_BLOCK', payload: block2 });
      const countAfterSecond = store.getState().blocks.length;

      expect(countAfterSecond).toBe(countAfterFirst); // Should not increase
    });
  });
});
