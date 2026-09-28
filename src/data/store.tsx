import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Language, Role, Experience, Reservation, UserProfile, SupportRequest, Feedback, Notification } from '../types';
import { mockExperiences, mockUser, mockReservations, mockNotifications } from '../infrastructure/mock/mockData';

// Re-export mock data for backward compatibility
export { mockExperiences };

// State
interface AppState {
  language: Language;
  role: Role;
  user: UserProfile | null;
  isAuthenticated: boolean;
  onboardingStep: 'phone' | 'adult' | 'preferences' | 'complete';
  experiences: Experience[];
  reservations: Reservation[];
  notifications: Notification[];
  supportRequests: SupportRequest[];
  feedbacks: Feedback[];
  favorites: string[];
  currentView: string;
}

type Action =
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'LOGIN'; payload: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'SET_ONBOARDING_STEP'; payload: AppState['onboardingStep'] }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'ADD_RESERVATION'; payload: Reservation }
  | { type: 'UPDATE_RESERVATION'; payload: { id: string; state: Reservation['state'] } }
  | { type: 'ADD_FEEDBACK'; payload: Feedback }
  | { type: 'ADD_SUPPORT_REQUEST'; payload: SupportRequest }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'RECONFIRM_RESERVATION'; payload: string }
  | { type: 'CANCEL_RESERVATION'; payload: string }
  | { type: 'ADD_FAVORITE'; payload: string }
  | { type: 'REMOVE_FAVORITE'; payload: string };

const initialState: AppState = {
  language: 'en',
  role: 'participant',
  user: mockUser,
  isAuthenticated: true,
  onboardingStep: 'complete',
  experiences: mockExperiences,
  reservations: mockReservations,
  notifications: mockNotifications,
  supportRequests: [],
  feedbacks: [],
  favorites: [],
  currentView: 'explore',
};

// Demo: Start authenticated for immediate access to the full journey
// Set isAuthenticated: false and onboardingStep: 'phone' to see onboarding flow

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingStep: 'complete' };
    case 'ADD_RESERVATION': {
      // Check for duplicate active reservation
      const hasActiveReservation = state.reservations.some(
        r => r.participantId === action.payload.participantId &&
             r.planId === action.payload.planId &&
             ['initiated', 'payment_pending', 'confirmed', 'reconfirmation_required', 'reconfirmed'].includes(r.state)
      );
      
      if (hasActiveReservation) {
        return state; // Reject duplicate
      }
      
      return { ...state, reservations: [...state.reservations, action.payload] };
    }
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r =>
          r.id === action.payload.id ? { ...r, state: action.payload.state } : r
        ),
      };
    case 'RECONFIRM_RESERVATION': {
      const reservation = state.reservations.find(r => r.id === action.payload);
      
      // Only allow reconfirmation if in valid state
      if (!reservation || reservation.state !== 'reconfirmation_required') {
        return state;
      }
      
      // Check if expired
      if (reservation.expiryAt && new Date(reservation.expiryAt) < new Date()) {
        return state;
      }
      
      return {
        ...state,
        reservations: state.reservations.map(r =>
          r.id === action.payload ? { ...r, state: 'reconfirmed' as const, reconfirmedAt: new Date().toISOString() } : r
        ),
      };
    }
    case 'CANCEL_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r =>
          r.id === action.payload ? { ...r, state: 'cancelled_by_participant' as const, cancelledAt: new Date().toISOString() } : r
        ),
      };
    case 'ADD_FEEDBACK':
      return { ...state, feedbacks: [...state.feedbacks, action.payload] };
    case 'ADD_SUPPORT_REQUEST':
      return { ...state, supportRequests: [...state.supportRequests, action.payload] };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'ADD_FAVORITE': {
      // Check for duplicate
      if (state.favorites.includes(action.payload)) {
        return state; // Already in favorites
      }
      return { ...state, favorites: [...state.favorites, action.payload] };
    }
    case 'REMOVE_FAVORITE':
      return { ...state, favorites: state.favorites.filter(id => id !== action.payload) };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
