// Yalla Type Definitions

export type Language = 'en' | 'ar';
export type Role = 'visitor' | 'participant' | 'host' | 'operations' | 'support' | 'trust_safety' | 'admin';
export type AppView = 'dashboard' | 'explore' | 'details' | 'plans' | 'arrival' | 'feedback' | 'profile' | 'support' | 'staff' | 'host' | 'favorites' | 'notfound';

export type PlanState = 'draft' | 'review' | 'published' | 'full' | 'changed' | 'in_progress' | 'completed' | 'archived' | 'cancelled';

export type ReservationState = 
  | 'initiated' | 'payment_pending' | 'confirmed' | 'reconfirmation_required' 
  | 'reconfirmed' | 'checked_in' | 'attended' | 'completed'
  | 'waitlisted' | 'offered' | 'expired' | 'no_show'
  | 'cancelled_by_participant' | 'cancelled_by_yalla'
  | 'refund_pending' | 'refunded';

export type RequestState = 'pending' | 'approved' | 'declined' | 'withdrawn' | 'expired';
export type WaitlistState = 'waiting' | 'offered' | 'accepted' | 'declined' | 'expired' | 'removed';
export type SupportState = 'submitted' | 'acknowledged' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
export type SafetyState = 'submitted' | 'triage' | 'under_review' | 'action_taken' | 'closed' | 'appealed' | 'final';
export type NotificationState = 'queued' | 'sent' | 'delivered' | 'failed' | 'unknown' | 'retrying' | 'manual_recovery';
export type PaymentState = 'initiated' | 'pending' | 'authorized' | 'captured' | 'failed' | 'unknown' | 'cancelled' | 'refund_pending' | 'refunded' | 'partially_refunded';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface Experience {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timeline: { time: string; activity: string; activityAr: string }[];
  date: string;
  time: string;
  duration: string;
  durationMinutes: number;
  area: string;
  areaAr: string;
  groupSizeMin: number;
  groupSizeMax: number;
  language: Language;
  price: number;
  currency: string;
  included: string[];
  includedAr: string[];
  excluded: string[];
  excludedAr: string[];
  accessibility: string;
  accessibilityAr: string;
  physicalDemand: 'low' | 'moderate' | 'high';
  environment: string;
  environmentAr: string;
  noiseLevel: 'quiet' | 'moderate' | 'loud';
  hostRole: string;
  hostRoleAr: string;
  requirements: string[];
  requirementsAr: string[];
  cancellationSummary: string;
  cancellationSummaryAr: string;
  imageUrl: string;
  planState: PlanState;
  capacity: number;
  booked: number;
  primaryHostId: string;
  backupHostId: string;
  primaryVenueId: string;
  fallbackVenueId: string;
  minAttendance: number;
  materialChanges?: MaterialChange[];
}

export interface Venue {
  id: string;
  name: string;
  nameAr: string;
  area: string;
  areaAr: string;
  address?: string;
  addressAr?: string;
  meetingPoint?: string;
  meetingPointAr?: string;
  mapLink?: string;
  accessibilityNotes?: string;
  accessibilityNotesAr?: string;
}

export interface Host {
  id: string;
  displayName: string;
  displayNameAr: string;
  role: string;
  roleAr: string;
  bio: string;
  bioAr: string;
  isPrimary: boolean;
}

export interface Reservation {
  id: string;
  participantId: string;
  planId: string;
  state: ReservationState;
  createdAt: string;
  confirmedAt?: string;
  reconfirmedAt?: string;
  checkedInAt?: string;
  cancelledAt?: string;
  expiryAt?: string;
  paymentState: PaymentState;
  paymentId?: string;
  idempotencyKey: string;
}

export interface Plan {
  id: string;
  experienceId: string;
  state: PlanState;
  capacity: number;
  booked: number;
  minAttendance: number;
  primaryHostId: string;
  backupHostId?: string;
  primaryVenueId: string;
  fallbackVenueId: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  materialChanges?: MaterialChange[];
  createdAt: string;
}

export interface MaterialChange {
  id: string;
  field: string;
  fieldAr: string;
  oldValue: string;
  newValue: string;
  acknowledgedBy: string[];
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  participantId: string;
  type: 'operational' | 'report' | 'safety';
  state: SupportState;
  subject: string;
  subjectAr: string;
  description: string;
  descriptionAr: string;
  targetEntityId?: string;
  targetEntityType?: 'participant' | 'host' | 'venue' | 'general';
  createdAt: string;
  resolvedAt?: string;
}

export interface SafetyCase {
  id: string;
  reporterId: string;
  state: SafetyState;
  category: string;
  categoryAr: string;
  narrative: string;
  evidence: string[];
  actions: { action: string; actor: string; timestamp: string }[];
  createdAt: string;
  restrictedAccess: true;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedEntityId: string;
  blockedEntityType: 'participant' | 'host';
  createdAt: string;
  reason?: string;
}

export interface Feedback {
  id: string;
  reservationId: string;
  participantId: string;
  planId: string;
  worthTime: number;
  descriptionAccurate: boolean;
  comfortableOrganized: boolean;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: 'confirmation' | 'reconfirmation' | 'material_change' | 'cancellation' | 'offer' | 'reminder';
  state: NotificationState;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  timestamp: string;
  classification: DataClassification;
}

export interface UserProfile {
  id: string;
  phone: string;
  displayName: string;
  language: Language;
  preferences: {
    preferredArea?: string;
    availability?: string[];
    experienceLanguage?: Language;
    budgetRange?: { min: number; max: number };
    accessibilityNeeds?: string;
  };
  adultDeclarationAccepted: boolean;
  termsAccepted: boolean;
  marketingConsent: boolean;
  createdAt: string;
}

export interface Preferences {
  preferredArea: string;
  availability: string[];
  experienceLanguage: Language;
  budgetRange: { min: number; max: number };
  accessibilityNeeds?: string;
}
