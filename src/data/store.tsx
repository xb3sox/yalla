import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Language, Role, Experience, Reservation, UserProfile, SupportRequest, Feedback, Notification } from '../types';

// Mock Experiences
export const mockExperiences: Experience[] = [
  {
    id: 'exp-1',
    title: 'Sunset Art Walk',
    titleAr: 'جولة فنية عند الغروب',
    description: 'A guided evening walk through local galleries and street art, ending at a rooftop café with views of the city at golden hour.',
    descriptionAr: 'جولة مسائية إرشادية عبر المعارض المحلية والفن الشعبي، تنتهي في مقهى على سطح المنزل مع إطلالات على المدينة في الساعة الذهبية.',
    timeline: [
      { time: '17:00', activity: 'Meet at gathering point', activityAr: 'الالتقاء في نقطة التجمع' },
      { time: '17:15', activity: 'Gallery 1 — contemporary art', activityAr: 'المعرض ١ — فن معاصر' },
      { time: '18:00', activity: 'Street art district walk', activityAr: 'جولة في حي الفن الشعبي' },
      { time: '18:45', activity: 'Gallery 2 — emerging artists', activityAr: 'المعرض ٢ — فنانون صاعدون' },
      { time: '19:30', activity: 'Rooftop café sunset', activityAr: 'غروب الشمس في مقهى السطح' },
    ],
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
    currency: 'SAR',
    included: ['Gallery entry', 'Welcome drink', 'Guide'],
    includedAr: ['دخول المعرض', 'مشروب ترحيبي', 'مرشد'],
    excluded: ['Transport to meeting point', 'Personal purchases'],
    excludedAr: ['المواصلات إلى نقطة الالتقاء', 'المشتريات الشخصية'],
    accessibility: 'Step-free access at galleries. Cobblestone sections on street walk. Seating available at café.',
    accessibilityAr: 'وصول بدون درجات في المعارض. أقسام حجرية في المشي. تتوفر مقاعد في المقهى.',
    physicalDemand: 'low',
    environment: 'Indoor galleries and outdoor streets',
    environmentAr: 'معارض داخلية وشوارع خارجية',
    noiseLevel: 'moderate',
    hostRole: 'Art guide and group facilitator',
    hostRoleAr: 'مرشد فني وميسر المجموعة',
    requirements: ['Must be 18+', 'Comfortable walking 1.5km'],
    requirementsAr: ['يجب أن يكون العمر ١٨+', 'الراحة في المشي ١.٥ كم'],
    cancellationSummary: 'Free cancellation up to 24 hours before. Within 24 hours, no refund.',
    cancellationSummaryAr: 'إلغاء مجاني حتى ٢٤ ساعة قبل. خلال ٢٤ ساعة، لا استرداد.',
    imageUrl: 'https://image.qwenlm.ai/generated-images/d7ce82c3-30c8-4a95-b790-683a48175a2e/_result.png',
    planState: 'published',
    capacity: 8,
    booked: 5,
    primaryHostId: 'host-1',
    backupHostId: 'host-2',
    primaryVenueId: 'venue-1',
    fallbackVenueId: 'venue-2',
    minAttendance: 4,
  },
  {
    id: 'exp-2',
    title: 'Arabic Coffee Ceremony',
    titleAr: 'جلسة القهوة العربية',
    description: 'Learn the art of traditional Arabic coffee preparation in an intimate group setting. Includes tasting of three regional varieties and pairing with local dates.',
    descriptionAr: 'تعلم فن تحضير القهوة العربية التقليدية في مجموعة صغيرة. يشمل تذوق ثلاثة أنواع إقليمية مع التمور المحلية.',
    timeline: [
      { time: '10:00', activity: 'Welcome and introduction', activityAr: 'الترحيب والمقدمة' },
      { time: '10:15', activity: 'Coffee bean origins talk', activityAr: 'حديث عن أصول حبوب البن' },
      { time: '10:45', activity: 'Hands-on brewing', activityAr: 'التحضير العملي' },
      { time: '11:30', activity: 'Tasting and pairing', activityAr: 'التذوق والمزاوجة' },
      { time: '12:00', activity: 'Farewell', activityAr: 'الوداع' },
    ],
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
    currency: 'SAR',
    included: ['All coffee and dates', 'Recipe card', 'Small gift'],
    includedAr: ['جميع القهوة والتمور', 'بطاقة وصفة', 'هدية صغيرة'],
    excluded: ['Transport'],
    excludedAr: ['المواصلات'],
    accessibility: 'Fully accessible venue. Wheelchair accessible. Quiet environment.',
    accessibilityAr: 'مكان متاح بالكامل. مناسب للكراسي المتحركة. بيئة هادئة.',
    physicalDemand: 'low',
    environment: 'Indoor traditional majlis setting',
    environmentAr: 'إعداد مجلس تقليدي داخلي',
    noiseLevel: 'quiet',
    hostRole: 'Coffee expert and cultural guide',
    hostRoleAr: 'خبير قهوة ومرشد ثقافي',
    requirements: ['Must be 18+'],
    requirementsAr: ['يجب أن يكون العمر ١٨+'],
    cancellationSummary: 'Free cancellation up to 48 hours before.',
    cancellationSummaryAr: 'إلغاء مجاني حتى ٤٨ ساعة قبل.',
    imageUrl: 'https://image.qwenlm.ai/generated-images/c70a465d-0bec-4482-8dee-15d625583e27/_result.png',
    planState: 'published',
    capacity: 6,
    booked: 4,
    primaryHostId: 'host-3',
    backupHostId: 'host-1',
    primaryVenueId: 'venue-3',
    fallbackVenueId: 'venue-4',
    minAttendance: 3,
  },
  {
    id: 'exp-3',
    title: 'Desert Stargazing Evening',
    titleAr: 'أمسية تأمل النجوم في الصحراء',
    description: 'A serene evening at a desert camp, learning constellations with an astronomer guide, traditional dinner under the stars.',
    descriptionAr: 'أمسية هادئة في مخيم صحراوي، تعلم الأبراج مع مرشد فلكي، وعشاء تقليدي تحت النجوم.',
    timeline: [
      { time: '18:00', activity: 'Meet and depart to desert', activityAr: 'الالتقاء والتوجه للصحراء' },
      { time: '19:00', activity: 'Arrive at camp, welcome tea', activityAr: 'الوصول للمخيم، شاي ترحيبي' },
      { time: '19:30', activity: 'Traditional dinner', activityAr: 'عشاء تقليدي' },
      { time: '20:30', activity: 'Stargazing session', activityAr: 'جلسة تأمل النجوم' },
      { time: '22:00', activity: 'Return journey', activityAr: 'العودة' },
    ],
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
    currency: 'SAR',
    included: ['Transport from meeting point', 'Dinner', 'Tea and refreshments', 'Astronomer guide'],
    includedAr: ['المواصلات من نقطة الالتقاء', 'العشاء', 'الشاي والمرطبات', 'مرشد فلكي'],
    excluded: ['Personal warm clothing', 'Camera equipment'],
    excludedAr: ['ملابس دافئة شخصية', 'معدات تصوير'],
    accessibility: 'Sand terrain. Limited wheelchair access. Folding chairs provided. Please contact us for specific needs.',
    accessibilityAr: 'أرض رملية. وصول محدود للكراسي المتحركة. تتوفر كراسي قابلة للطي. يرجى التواصل معنا للاحتياجات الخاصة.',
    physicalDemand: 'moderate',
    environment: 'Outdoor desert, evening temperatures',
    environmentAr: 'صحراء خارجية، درجات حرارة مسائية',
    noiseLevel: 'quiet',
    hostRole: 'Logistics coordinator and astronomy guide',
    hostRoleAr: 'منسق لوجستي ومرشد فلكي',
    requirements: ['Must be 18+', 'Comfortable sitting on ground level', 'Able to handle evening desert temperatures'],
    requirementsAr: ['يجب أن يكون العمر ١٨+', 'الراحة في الجلوس على مستوى الأرض', 'القدرة على التعامل مع درجات حرارة الصحراء المسائية'],
    cancellationSummary: 'Free cancellation up to 72 hours before. 50% refund within 72-24 hours.',
    cancellationSummaryAr: 'إلغاء مجاني حتى ٧٢ ساعة قبل. استرداد ٥٠٪ خلال ٧٢-٢٤ ساعة.',
    imageUrl: 'https://image.qwenlm.ai/generated-images/42b2b068-6a16-4b08-b069-fdd2050bc5dd/_result.png',
    planState: 'published',
    capacity: 12,
    booked: 10,
    primaryHostId: 'host-2',
    backupHostId: 'host-3',
    primaryVenueId: 'venue-5',
    fallbackVenueId: 'venue-6',
    minAttendance: 6,
  },
];

// Mock Hosts
export const mockHosts = [
  { id: 'host-1', displayName: 'Sarah Al-Rashid', displayNameAr: 'سارة الراشد', role: 'Art guide', roleAr: 'مرشدة فنية', bio: 'Curator and art enthusiast with 8 years of experience.', bioAr: 'أمينة فنية ومتحمسة للفن بخبرة ٨ سنوات.', isPrimary: true },
  { id: 'host-2', displayName: 'Khalid Al-Otaibi', displayNameAr: 'خالد العتيبي', role: 'Desert guide', roleAr: 'مرشد صحراوي', bio: 'Born and raised in the desert. Astronomy enthusiast.', bioAr: 'مولود وترعرع في الصحراء. متحمس لعلم الفلك.', isPrimary: true },
  { id: 'host-3', displayName: 'Noura Al-Fahad', displayNameAr: 'نورة الفهد', role: 'Coffee expert', roleAr: 'خبيرة قهوة', bio: 'Third-generation coffee roaster and cultural preservationist.', bioAr: 'محمصة بن من الجيل الثالث ومحافظة على التراث.', isPrimary: true },
];

// Mock Venues
export const mockVenues = [
  { id: 'venue-1', name: 'Al Khobar Art District', nameAr: 'حي الفن بالخبر', area: 'Al Khobar', areaAr: 'الخبر', address: 'Prince Turkey St, Al Khobar', addressAr: 'شارع الأمير تركي، الخبر', meetingPoint: 'Near the blue mosaic fountain', meetingPointAr: 'بجوار نافذة الفسيفساء الزرقاء', mapLink: '#', accessibilityNotes: 'Step-free', accessibilityNotesAr: 'بدون درجات' },
  { id: 'venue-2', name: 'Al Khobar Cultural Center', nameAr: 'المركز الثقافي بالخبر', area: 'Al Khobar', areaAr: 'الخبر', address: 'King Fahd Rd, Al Khobar', addressAr: 'طريق الملك فهد، الخبر', meetingPoint: 'Main entrance lobby', meetingPointAr: 'بهو المدخل الرئيسي', mapLink: '#', accessibilityNotes: 'Fully accessible', accessibilityNotesAr: 'متاح بالكامل' },
  { id: 'venue-3', name: 'Bun & Traditions Majlis', nameAr: 'مجلس بن وتقاليد', area: 'Riyadh — Al Malqa', areaAr: 'الرياض — الملقا', address: 'Al Malqa District, Riyadh', addressAr: 'حي الملقا، الرياض', meetingPoint: 'Side entrance near parking', meetingPointAr: 'المدخل الجانبي بالقرب من الموقف', mapLink: '#', accessibilityNotes: 'Wheelchair accessible', accessibilityNotesAr: 'مناسب للكراسي المتحركة' },
  { id: 'venue-4', name: 'Heritage House Riyadh', nameAr: 'بيت التراث الرياض', area: 'Riyadh — Al Malqa', areaAr: 'الرياض — الملقا', address: 'Al Malqa, Riyadh', addressAr: 'الملقا، الرياض', meetingPoint: 'Front garden', meetingPointAr: 'الحديقة الأمامية', mapLink: '#', accessibilityNotes: 'Partial access', accessibilityNotesAr: 'وصول جزئي' },
  { id: 'venue-5', name: 'Desert Star Camp', nameAr: 'مخيم نجوم الصحراء', area: 'Riyadh — Desert', areaAr: 'الرياض — الصحراء', address: 'Desert Road, 40km from Riyadh', addressAr: 'طريق الصحراء، ٤٠ كم من الرياض', meetingPoint: 'Main tent entrance', meetingPointAr: 'مدخل الخيمة الرئيسية', mapLink: '#', accessibilityNotes: 'Sand terrain, chairs provided', accessibilityNotesAr: 'أرض رملية، كراسي متوفرة' },
  { id: 'venue-6', name: 'Wadi Hanifah Camp', nameAr: 'مخيم وادي حنيفة', area: 'Riyadh — Wadi', areaAr: 'الرياض — الوادي', address: 'Wadi Hanifah, Riyadh', addressAr: 'وادي حنيفة، الرياض', meetingPoint: 'Parking area', meetingPointAr: 'منطقة الموقف', mapLink: '#', accessibilityNotes: 'Flat terrain', accessibilityNotesAr: 'أرض مستوية' },
];

// Mock User
export const mockUser: UserProfile = {
  id: 'user-1',
  phone: '+966501234567',
  displayName: 'Ahmed',
  language: 'en',
  preferences: {
    preferredArea: 'Riyadh',
    availability: ['weekends', 'evenings'],
    experienceLanguage: 'en',
    budgetRange: { min: 100, max: 400 },
    accessibilityNeeds: '',
  },
  adultDeclarationAccepted: true,
  termsAccepted: true,
  marketingConsent: false,
  createdAt: '2026-01-15T10:00:00Z',
};

// Mock Reservations
export const mockReservations: Reservation[] = [
  {
    id: 'res-1',
    participantId: 'user-1',
    planId: 'exp-1',
    state: 'confirmed',
    createdAt: '2026-01-20T14:00:00Z',
    confirmedAt: '2026-01-20T14:01:00Z',
    paymentState: 'captured',
    paymentId: 'pay-synth-1',
    idempotencyKey: 'idem-1',
  },
  {
    id: 'res-2',
    participantId: 'user-1',
    planId: 'exp-2',
    state: 'reconfirmation_required',
    createdAt: '2026-01-22T09:00:00Z',
    confirmedAt: '2026-01-22T09:01:00Z',
    expiryAt: '2026-02-16T23:59:00Z',
    paymentState: 'captured',
    paymentId: 'pay-synth-2',
    idempotencyKey: 'idem-2',
  },
  {
    id: 'res-3',
    participantId: 'user-1',
    planId: 'exp-3',
    state: 'waitlisted',
    createdAt: '2026-01-25T16:00:00Z',
    paymentState: 'initiated',
    idempotencyKey: 'idem-3',
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    recipientId: 'user-1',
    type: 'reconfirmation',
    state: 'sent',
    title: 'Reconfirm your attendance',
    titleAr: 'أكد حضورك',
    body: 'Your Sunset Art Walk is in 3 days. Please reconfirm.',
    bodyAr: 'جولتك الفنية عند الغروب بعد ٣ أيام. يرجى تأكيد حضورك.',
    createdAt: '2026-02-12T10:00:00Z',
    sentAt: '2026-02-12T10:00:00Z',
  },
  {
    id: 'notif-2',
    recipientId: 'user-1',
    type: 'confirmation',
    state: 'delivered',
    title: 'Booking confirmed',
    titleAr: 'تم تأكيد الحجز',
    body: 'Your Sunset Art Walk booking is confirmed.',
    bodyAr: 'تم تأكيد حجز جولتك الفنية عند الغروب.',
    createdAt: '2026-01-20T14:01:00Z',
    sentAt: '2026-01-20T14:01:00Z',
    deliveredAt: '2026-01-20T14:02:00Z',
  },
];

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
  | { type: 'CANCEL_RESERVATION'; payload: string };

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
    case 'ADD_RESERVATION':
      return { ...state, reservations: [...state.reservations, action.payload] };
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r =>
          r.id === action.payload.id ? { ...r, state: action.payload.state } : r
        ),
      };
    case 'RECONFIRM_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r =>
          r.id === action.payload ? { ...r, state: 'reconfirmed' as const, reconfirmedAt: new Date().toISOString() } : r
        ),
      };
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
