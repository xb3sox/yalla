import type { Language } from '../types';

type TranslationKeys = {
  // Navigation
  'nav.explore': string;
  'nav.myPlans': string;
  'nav.profile': string;
  'nav.staff': string;
  'nav.support': string;
  'nav.language': string;
  'nav.notifications': string;
  'nav.switchRole': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.retry': string;
  'common.cancel': string;
  'common.confirm': string;
  'common.save': string;
  'common.back': string;
  'common.next': string;
  'common.submit': string;
  'common.close': string;
  'common.sar': string;
  'common.person': string;
  'common.people': string;
  'common.minutes': string;
  'common.required': string;
  'common.optional': string;
  'common.yes': string;
  'common.no': string;
  'common.pending': string;
  'common.confirmed': string;
  'common.cancelled': string;
  'common.expired': string;
  'common.actionRequired': string;
  'common.noActionRequired': string;
  'common.deadline': string;
  'common.whatHappensNext': string;
  'common.doIHaveAPlace': string;
  'common.syntheticPayment': string;

  // Onboarding
  'onboarding.welcome': string;
  'onboarding.phoneVerification': string;
  'onboarding.phonePlaceholder': string;
  'onboarding.verifyCode': string;
  'onboarding.adultDeclaration': string;
  'onboarding.adultText': string;
  'onboarding.preferences': string;
  'onboarding.preferredArea': string;
  'onboarding.availability': string;
  'onboarding.experienceLanguage': string;
  'onboarding.budgetRange': string;
  'onboarding.accessibilityNeeds': string;
  'onboarding.whyCollect': string;
  'onboarding.whyCollectText': string;
  'onboarding.termsAccept': string;

  // Explore
  'explore.title': string;
  'explore.subtitle': string;
  'explore.empty': string;
  'explore.emptyAction': string;
  'explore.spotsLeft': string;
  'explore.full': string;
  'explore.approximateArea': string;
  'explore.groupSize': string;
  'explore.expectedPrice': string;
  'explore.accessibilitySummary': string;
  'explore.refreshStale': string;
  'explore.sortBy': string;
  'explore.sort.date': string;
  'explore.sort.priceLow': string;
  'explore.sort.priceHigh': string;
  'explore.sort.newest': string;

  // Experience Details
  'details.whatYoullDo': string;
  'details.timeline': string;
  'details.dateTime': string;
  'details.duration': string;
  'details.area': string;
  'details.groupSizeRange': string;
  'details.language': string;
  'details.expectedPrice': string;
  'details.included': string;
  'details.excluded': string;
  'details.accessibility': string;
  'details.physicalDemand': string;
  'details.environment': string;
  'details.noiseLevel': string;
  'details.hostRole': string;
  'details.requirements': string;
  'details.cancellation': string;
  'details.venueRelease': string;
  'details.venueReleaseText': string;
  'details.supportBoundaries': string;
  'details.supportBoundariesText': string;
  'details.bookNow': string;
  'details.requestApproval': string;
  'details.joinWaitlist': string;
  'details.physicalLow': string;
  'details.physicalModerate': string;
  'details.physicalHigh': string;
  'details.noiseQuiet': string;
  'details.noiseModerate': string;
  'details.noiseLoud': string;

  // Booking
  'booking.title': string;
  'booking.processing': string;
  'booking.success': string;
  'booking.successTitle': string;
  'booking.waitlisted': string;
  'booking.waitlistTitle': string;
  'booking.approvalPending': string;
  'booking.duplicateWarning': string;
  'booking.seatConflict': string;
  'booking.paymentPending': string;
  'booking.paymentFailed': string;
  'booking.paymentUnknown': string;
  'booking.syntheticLabel': string;

  // My Plans
  'plans.title': string;
  'plans.actionRequired': string;
  'plans.upcoming': string;
  'plans.pendingWaitlisted': string;
  'plans.cancelled': string;
  'plans.past': string;
  'plans.reconfirm': string;
  'plans.release': string;
  'plans.reviewChanges': string;
  'plans.acceptChanges': string;
  'plans.cancelPlan': string;
  'plans.empty': string;

  // Arrival Mode
  'arrival.title': string;
  'arrival.venue': string;
  'arrival.address': string;
  'arrival.meetingPoint': string;
  'arrival.mapLink': string;
  'arrival.host': string;
  'arrival.startTime': string;
  'arrival.endTime': string;
  'arrival.accessibilityNotes': string;
  'arrival.lastUpdated': string;
  'arrival.offlineCopy': string;
  'arrival.imHere': string;
  'arrival.illBeLate': string;
  'arrival.cantFind': string;
  'arrival.needHelp': string;
  'arrival.notEntitled': string;
  'arrival.notEntitledText': string;

  // Feedback
  'feedback.title': string;
  'feedback.worthTime': string;
  'feedback.descriptionAccurate': string;
  'feedback.comfortableOrganized': string;
  'feedback.optionalComment': string;
  'feedback.submit': string;
  'feedback.thankYou': string;
  'feedback.bookAnother': string;

  // Profile
  'profile.title': string;
  'profile.preferences': string;
  'profile.dataRights': string;
  'profile.exportData': string;
  'profile.correctData': string;
  'profile.deleteData': string;
  'profile.privacyNotice': string;
  'profile.terms': string;
  'profile.marketingConsent': string;

  // Support
  'support.title': string;
  'support.operationalHelp': string;
  'support.reportConcern': string;
  'support.reportParticipant': string;
  'support.reportHost': string;
  'support.reportVenue': string;
  'support.generalConcern': string;
  'support.blockUser': string;
  'support.emergencyDisclaimer': string;
  'support.submissionAcknowledged': string;
  'support.responseExpectation': string;

  // Host Portal
  'host.title': string;
  'host.overview': string;
  'host.calendar': string;
  'host.attendees': string;
  'host.payouts': string;
  'host.totalAttendees': string;
  'host.averageRating': string;
  'host.totalEarnings': string;
  'host.upcomingSessions': string;
  'host.scheduleSession': string;
  'host.sessionTitle': string;
  'host.sessionTitleAr': string;
  'host.date': string;
  'host.time': string;
  'host.price': string;
  'host.capacity': string;
  'host.seatUtilization': string;
  'host.checkInPin': string;
  'host.checkInBtn': string;
  'host.checkInSuccess': string;
  'host.pendingBalance': string;
  'host.totalPaidOut': string;
  'host.stripeStatus': string;
  'host.cancelSession': string;
  'host.capacityError': string;

  // Staff
  'staff.plans': string;
  'staff.hosts': string;
  'staff.venues': string;
  'staff.requests': string;
  'staff.waitlist': string;
  'staff.attendance': string;
  'staff.notifications': string;
  'staff.recovery': string;
  'staff.safetyCases': string;
  'staff.audit': string;
  'staff.metrics': string;
  'staff.exportCsv': string;
  'staff.exportExcel': string;
  'staff.assignHost': string;
  'staff.assignVenue': string;
  'staff.setCapacity': string;
  'staff.correctAttendance': string;
  'staff.reasonRequired': string;

  // Wallet
  'wallet.addToApple': string;
  'wallet.addToGoogle': string;
  'wallet.privacyNotice': string;
  'wallet.offlinePassTitle': string;
  'wallet.downloadStarted': string;

  // States
  'state.available': string;
  'state.approvalPending': string;
  'state.waitlisted': string;
  'state.seatOffered': string;
  'state.confirmed': string;
  'state.reconfirmationRequired': string;
  'state.expired': string;
  'state.full': string;
  'state.unavailable': string;

  // Errors
  'error.permissionDenied': string;
  'error.permissionDeniedText': string;
  'error.networkError': string;
  'error.staleData': string;
  'error.sessionExpired': string;
  'error.restrictedAccount': string;
  'error.hostAbsent': string;
  'error.venueUnavailable': string;
  'error.minAttendanceNotMet': string;
  'error.notificationFailed': string;
  'error.refundPending': string;
  'error.manualRecovery': string;
  'error.unknownOutcome': string;
  'error.unknownOutcomeText': string;
};

const en: TranslationKeys = {
  'nav.explore': 'Explore',
  'nav.myPlans': 'My Plans',
  'nav.profile': 'Profile',
  'nav.staff': 'Staff',
  'nav.support': 'Support',
  'nav.language': 'العربية',
  'nav.notifications': 'Notifications',
  'nav.switchRole': 'Switch Role',

  'common.loading': 'Loading...',
  'common.error': 'Something went wrong',
  'common.retry': 'Try again',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.submit': 'Submit',
  'common.close': 'Close',
  'common.sar': 'SAR',
  'common.person': 'person',
  'common.people': 'people',
  'common.minutes': 'min',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.pending': 'Pending',
  'common.confirmed': 'Confirmed',
  'common.cancelled': 'Cancelled',
  'common.expired': 'Expired',
  'common.actionRequired': 'Action required',
  'common.noActionRequired': 'No action required',
  'common.deadline': 'Deadline',
  'common.whatHappensNext': 'What happens next',
  'common.doIHaveAPlace': 'Do I have a place?',
  'common.syntheticPayment': 'Synthetic payment — not real',

  'onboarding.welcome': 'Welcome to Yalla',
  'onboarding.phoneVerification': 'Verify your phone',
  'onboarding.phonePlaceholder': '+966 5X XXX XXXX',
  'onboarding.verifyCode': 'Enter verification code',
  'onboarding.adultDeclaration': 'Adult eligibility',
  'onboarding.adultText': 'I confirm that I am 18 years of age or older.',
  'onboarding.preferences': 'Your preferences',
  'onboarding.preferredArea': 'Preferred area',
  'onboarding.availability': 'When are you usually available?',
  'onboarding.experienceLanguage': 'Preferred experience language',
  'onboarding.budgetRange': 'Budget range',
  'onboarding.accessibilityNeeds': 'Accessibility needs (optional)',
  'onboarding.whyCollect': 'Why we collect this',
  'onboarding.whyCollectText': 'We collect only what we need to match you with suitable experiences. We never use personality tests or unnecessary personal data.',
  'onboarding.termsAccept': 'I accept the terms and privacy notice',

  'explore.title': 'Discover experiences',
  'explore.subtitle': 'Find something enjoyable near you',
  'explore.empty': 'No experiences available right now',
  'explore.emptyAction': 'Change preferences',
  'explore.spotsLeft': '{count} spots left',
  'explore.full': 'Full',
  'explore.approximateArea': 'Approximate area',
  'explore.groupSize': 'Group size',
  'explore.expectedPrice': 'Expected total price',
  'explore.accessibilitySummary': 'Accessibility',
  'explore.refreshStale': 'Refresh for latest availability',
  'explore.sortBy': 'Sort by',
  'explore.sort.date': 'Date',
  'explore.sort.priceLow': 'Price: Low to High',
  'explore.sort.priceHigh': 'Price: High to Low',
  'explore.sort.newest': 'Newest',

  'details.whatYoullDo': 'What you\'ll do',
  'details.timeline': 'Timeline',
  'details.dateTime': 'Date & time',
  'details.duration': 'Duration',
  'details.area': 'Approximate area',
  'details.groupSizeRange': 'Group size',
  'details.language': 'Language',
  'details.expectedPrice': 'Expected total price',
  'details.included': 'Included',
  'details.excluded': 'Not included',
  'details.accessibility': 'Accessibility',
  'details.physicalDemand': 'Physical demand',
  'details.environment': 'Environment',
  'details.noiseLevel': 'Noise level',
  'details.hostRole': 'Host role',
  'details.requirements': 'Participation requirements',
  'details.cancellation': 'Cancellation',
  'details.venueRelease': 'Venue details',
  'details.venueReleaseText': 'Exact venue is released closer to the experience date for confirmed participants only.',
  'details.supportBoundaries': 'Support',
  'details.supportBoundariesText': 'Yalla does not replace emergency services. For urgent safety concerns, contact local emergency services.',
  'details.bookNow': 'Book your place',
  'details.requestApproval': 'Request approval',
  'details.joinWaitlist': 'Join waitlist',
  'details.physicalLow': 'Low — minimal walking or standing',
  'details.physicalModerate': 'Moderate — some walking and standing',
  'details.physicalHigh': 'High — active participation required',
  'details.noiseQuiet': 'Quiet',
  'details.noiseModerate': 'Moderate',
  'details.noiseLoud': 'Loud',

  'booking.title': 'Confirm your booking',
  'booking.processing': 'Processing your booking...',
  'booking.success': 'You\'re booked! Check My Plans for details.',
  'booking.successTitle': 'Booking Confirmed!',
  'booking.waitlisted': 'You\'re on the waitlist. We\'ll notify you if a spot opens.',
  'booking.waitlistTitle': 'You\'re on the Waitlist',
  'booking.approvalPending': 'Your request is pending approval.',
  'booking.duplicateWarning': 'You already have an active reservation for this experience.',
  'booking.seatConflict': 'This seat was just taken. Please choose another experience.',
  'booking.paymentPending': 'Payment is being processed. This may take a moment.',
  'booking.paymentFailed': 'Payment failed. No charge was made.',
  'booking.paymentUnknown': 'Payment status is unknown. We\'re checking. Your reservation is pending.',
  'booking.syntheticLabel': '⚠ Synthetic payment — test only',

  'plans.title': 'My Plans',
  'plans.actionRequired': 'Action required',
  'plans.upcoming': 'Upcoming',
  'plans.pendingWaitlisted': 'Pending / Waitlisted',
  'plans.cancelled': 'Cancelled',
  'plans.past': 'Past',
  'plans.reconfirm': 'Reconfirm attendance',
  'plans.release': 'Release my place',
  'plans.reviewChanges': 'Review changes',
  'plans.acceptChanges': 'Accept changes',
  'plans.cancelPlan': 'Cancel',
  'plans.empty': 'No plans yet. Explore to find your next experience.',

  'arrival.title': 'Arrival',
  'arrival.venue': 'Venue',
  'arrival.address': 'Address',
  'arrival.meetingPoint': 'Meeting point',
  'arrival.mapLink': 'Open in maps',
  'arrival.host': 'Your host',
  'arrival.startTime': 'Start time',
  'arrival.endTime': 'Expected end',
  'arrival.accessibilityNotes': 'Accessibility notes',
  'arrival.lastUpdated': 'Last updated',
  'arrival.offlineCopy': 'Available offline',
  'arrival.imHere': 'I\'m here',
  'arrival.illBeLate': 'I\'ll be late',
  'arrival.cantFind': 'I can\'t find the group',
  'arrival.needHelp': 'Need help',
  'arrival.notEntitled': 'Not yet available',
  'arrival.notEntitledText': 'Exact venue details are available only to confirmed participants within the release window.',

  'feedback.title': 'How was your experience?',
  'feedback.worthTime': 'Was the experience worth your time?',
  'feedback.descriptionAccurate': 'Was the description accurate?',
  'feedback.comfortableOrganized': 'Did it feel comfortable and well organized?',
  'feedback.optionalComment': 'Private comment (optional)',
  'feedback.submit': 'Submit feedback',
  'feedback.thankYou': 'Thank you for your feedback!',
  'feedback.bookAnother': 'Book another experience',

  'profile.title': 'Profile',
  'profile.preferences': 'Preferences',
  'profile.dataRights': 'Your data rights',
  'profile.exportData': 'Export my data',
  'profile.correctData': 'Correct my data',
  'profile.deleteData': 'Delete my data',
  'profile.privacyNotice': 'Privacy notice',
  'profile.terms': 'Terms of service',
  'profile.marketingConsent': 'Marketing emails',

  'support.title': 'Support',
  'support.operationalHelp': 'Get help',
  'support.reportConcern': 'Report a concern',
  'support.reportParticipant': 'Report a participant',
  'support.reportHost': 'Report a host',
  'support.reportVenue': 'Report a venue',
  'support.generalConcern': 'General concern',
  'support.blockUser': 'Block someone',
  'support.emergencyDisclaimer': 'Yalla does not replace emergency services. In an emergency, contact local authorities immediately.',
  'support.submissionAcknowledged': 'Your submission has been received.',
  'support.responseExpectation': 'We will review and respond as appropriate.',

  'staff.plans': 'Plans',
  'staff.hosts': 'Hosts',
  'staff.venues': 'Venues',
  'staff.requests': 'Requests',
  'staff.waitlist': 'Waitlist',
  'staff.attendance': 'Attendance',
  'staff.notifications': 'Notifications',
  'staff.recovery': 'Recovery',
  'staff.safetyCases': 'Safety Cases',
  'staff.audit': 'Audit Log',
  'staff.metrics': 'Metrics',
  'staff.exportCsv': 'Export CSV',
  'staff.exportExcel': 'Export Excel',
  'staff.assignHost': 'Assign Host',
  'staff.assignVenue': 'Assign Venue',
  'staff.setCapacity': 'Set Capacity',
  'staff.correctAttendance': 'Correct Attendance',
  'staff.reasonRequired': 'Reason required',

  'wallet.addToApple': 'Add to Apple Wallet',
  'wallet.addToGoogle': 'Add to Google Wallet',
  'wallet.privacyNotice': 'Exact venue GPS coordinates and check-in PIN unlock in your wallet 24 hours prior upon reconfirmation.',
  'wallet.offlinePassTitle': 'Offline Boarding Pass',
  'wallet.downloadStarted': 'Pass downloaded for offline use',

  'host.title': 'Host Portal',
  'host.overview': 'Overview',
  'host.calendar': 'Calendar',
  'host.attendees': 'Attendees',
  'host.payouts': 'Earnings & Payouts',
  'host.totalAttendees': 'Attendees Served',
  'host.averageRating': 'Average Rating',
  'host.totalEarnings': 'Total Net Earnings',
  'host.upcomingSessions': 'Upcoming Sessions',
  'host.scheduleSession': 'Schedule New Session',
  'host.sessionTitle': 'Session Title',
  'host.sessionTitleAr': 'Session Title (Arabic)',
  'host.date': 'Date',
  'host.time': 'Time',
  'host.price': 'Price (SAR)',
  'host.capacity': 'Capacity',
  'host.seatUtilization': '{booked} / {capacity} seats booked',
  'host.checkInPin': 'Enter Check-in PIN',
  'host.checkInBtn': 'Check In',
  'host.checkInSuccess': 'Attendee checked in successfully',
  'host.pendingBalance': 'Pending Balance',
  'host.totalPaidOut': 'Total Paid Out',
  'host.stripeStatus': 'Stripe Transfer Status',
  'host.cancelSession': 'Cancel Session',
  'host.capacityError': 'Cannot reduce capacity below current confirmed bookings.',

  'state.available': 'Available',
  'state.approvalPending': 'Approval pending',
  'state.waitlisted': 'Waitlisted',
  'state.seatOffered': 'Seat offered',
  'state.confirmed': 'Confirmed',
  'state.reconfirmationRequired': 'Reconfirmation required',
  'state.expired': 'Expired',
  'state.full': 'Full',
  'state.unavailable': 'Unavailable',

  'error.permissionDenied': 'Permission denied',
  'error.permissionDeniedText': 'You do not have access to this resource.',
  'error.networkError': 'Network error. Please check your connection.',
  'error.staleData': 'This information may be outdated. Please refresh.',
  'error.sessionExpired': 'Your session has expired. Please sign in again.',
  'error.restrictedAccount': 'Your account is currently restricted.',
  'error.hostAbsent': 'Host is unavailable. Backup arrangements are being made.',
  'error.venueUnavailable': 'Venue is unavailable. A fallback venue will be assigned.',
  'error.minAttendanceNotMet': 'Minimum attendance was not reached. This experience has been cancelled.',
  'error.notificationFailed': 'Notification delivery failed. Retrying.',
  'error.refundPending': 'Refund is being processed.',
  'error.manualRecovery': 'Manual recovery required. Staff has been notified.',
  'error.unknownOutcome': 'Unknown outcome',
  'error.unknownOutcomeText': 'We couldn\'t confirm the result. Your operation is pending review. We will not create a duplicate.',
};

const ar: TranslationKeys = {
  'nav.explore': 'استكشف',
  'nav.myPlans': 'خططي',
  'nav.profile': 'الملف الشخصي',
  'nav.staff': 'الفريق',
  'nav.support': 'الدعم',
  'nav.language': 'English',
  'nav.notifications': 'الإشعارات',
  'nav.switchRole': 'تبديل الدور',

  'common.loading': 'جاري التحميل...',
  'common.error': 'حدث خطأ ما',
  'common.retry': 'حاول مرة أخرى',
  'common.cancel': 'إلغاء',
  'common.confirm': 'تأكيد',
  'common.save': 'حفظ',
  'common.back': 'رجوع',
  'common.next': 'التالي',
  'common.submit': 'إرسال',
  'common.close': 'إغلاق',
  'common.sar': 'ر.س',
  'common.person': 'شخص',
  'common.people': 'أشخاص',
  'common.minutes': 'دقيقة',
  'common.required': 'مطلوب',
  'common.optional': 'اختياري',
  'common.yes': 'نعم',
  'common.no': 'لا',
  'common.pending': 'قيد الانتظار',
  'common.confirmed': 'مؤكد',
  'common.cancelled': 'ملغي',
  'common.expired': 'منتهي',
  'common.actionRequired': 'إجراء مطلوب',
  'common.noActionRequired': 'لا إجراء مطلوب',
  'common.deadline': 'الموعد النهائي',
  'common.whatHappensNext': 'ماذا يحدث بعد ذلك',
  'common.doIHaveAPlace': 'هل لدي مكان؟',
  'common.syntheticPayment': 'دفعة تجريبية — ليست حقيقية',

  'onboarding.welcome': 'مرحباً بك في يلا',
  'onboarding.phoneVerification': 'تحقق من رقم هاتفك',
  'onboarding.phonePlaceholder': '+966 5X XXX XXXX',
  'onboarding.verifyCode': 'أدخل رمز التحقق',
  'onboarding.adultDeclaration': 'أهلية البالغ',
  'onboarding.adultText': 'أؤكد أن عمري 18 عاماً أو أكثر.',
  'onboarding.preferences': 'تفضيلاتك',
  'onboarding.preferredArea': 'المنطقة المفضلة',
  'onboarding.availability': 'متى تكون متاحاً عادةً؟',
  'onboarding.experienceLanguage': 'لغة التجربة المفضلة',
  'onboarding.budgetRange': 'نطاق الميزانية',
  'onboarding.accessibilityNeeds': 'احتياجات إمكانية الوصول (اختياري)',
  'onboarding.whyCollect': 'لماذا نجمع هذا',
  'onboarding.whyCollectText': 'نجمع فقط ما نحتاجه لمطابقتك مع تجارب مناسبة. لا نستخدم أبداً اختبارات شخصية أو بيانات شخصية غير ضرورية.',
  'onboarding.termsAccept': 'أوافق على الشروط وإشعار الخصوصية',

  'explore.title': 'اكتشف التجارب',
  'explore.subtitle': 'ابحث عن شيء ممتع بالقرب منك',
  'explore.empty': 'لا توجد تجارب متاحة حالياً',
  'explore.emptyAction': 'تغيير التفضيلات',
  'explore.spotsLeft': '{count} أماكن متبقية',
  'explore.full': 'مكتمل',
  'explore.approximateArea': 'المنطقة التقريبية',
  'explore.groupSize': 'حجم المجموعة',
  'explore.expectedPrice': 'السعر الإجمالي المتوقع',
  'explore.accessibilitySummary': 'إمكانية الوصول',
  'explore.refreshStale': 'تحديث لأحدث التوفر',
  'explore.sortBy': 'ترتيب حسب',
  'explore.sort.date': 'التاريخ',
  'explore.sort.priceLow': 'السعر: من الأقل للأعلى',
  'explore.sort.priceHigh': 'السعر: من الأعلى للأقل',
  'explore.sort.newest': 'الأحدث',

  'details.whatYoullDo': 'ماذا ستفعل',
  'details.timeline': 'الجدول الزمني',
  'details.dateTime': 'التاريخ والوقت',
  'details.duration': 'المدة',
  'details.area': 'المنطقة التقريبية',
  'details.groupSizeRange': 'حجم المجموعة',
  'details.language': 'اللغة',
  'details.expectedPrice': 'السعر الإجمالي المتوقع',
  'details.included': 'متضمن',
  'details.excluded': 'غير متضمن',
  'details.accessibility': 'إمكانية الوصول',
  'details.physicalDemand': 'الجهد البدني',
  'details.environment': 'البيئة',
  'details.noiseLevel': 'مستوى الضوضاء',
  'details.hostRole': 'دور المضيف',
  'details.requirements': 'متطلبات المشاركة',
  'details.cancellation': 'الإلغاء',
  'details.venueRelease': 'تفاصيل المكان',
  'details.venueReleaseText': 'يتم إصدار المكان الدقيق فقط للمشاركين المؤكدين بالقرب من تاريخ التجربة.',
  'details.supportBoundaries': 'الدعم',
  'details.supportBoundariesText': 'يلا لا تحل محل خدمات الطوارئ. لمخاوف السلامة العاجلة، اتصل بخدمات الطوارئ المحلية.',
  'details.bookNow': 'احجز مكانك',
  'details.requestApproval': 'طلب موافقة',
  'details.joinWaitlist': 'انضم لقائمة الانتظار',
  'details.physicalLow': 'منخفض — مشي أووقوف محدود',
  'details.physicalModerate': 'متوسط — بعض المشي والوقوف',
  'details.physicalHigh': 'عالي — مشاركة نشطة مطلوبة',
  'details.noiseQuiet': 'هادئ',
  'details.noiseModerate': 'متوسط',
  'details.noiseLoud': 'صاخب',

  'booking.title': 'أكد حجزك',
  'booking.processing': 'جاري معالجة حجزك...',
  'booking.success': 'تم حجزك! تحقق من خططي للتفاصيل.',
  'booking.successTitle': 'تم الحجز بنجاح!',
  'booking.waitlisted': 'أنت في قائمة الانتظار. سنُعلمك إذا توفر مكان.',
  'booking.waitlistTitle': 'أنت في قائمة الانتظار',
  'booking.approvalPending': 'طلبك قيد الموافقة.',
  'booking.duplicateWarning': 'لديك بالفعل حجز نشط لهذه التجربة.',
  'booking.seatConflict': 'هذا المكان محجوز للتو. يرجى اختيار تجربة أخرى.',
  'booking.paymentPending': 'جاري معالجة الدفع. قد يستغرق لحظة.',
  'booking.paymentFailed': 'فشل الدفع. لم يتم خصم أي مبلغ.',
  'booking.paymentUnknown': 'حالة الدفع غير معروفة. نتحقق. حجزك قيد الانتظار.',
  'booking.syntheticLabel': '⚠ دفعة تجريبية — للاختبار فقط',

  'plans.title': 'خططي',
  'plans.actionRequired': 'إجراء مطلوب',
  'plans.upcoming': 'قادمة',
  'plans.pendingWaitlisted': 'قيد الانتظار',
  'plans.cancelled': 'ملغية',
  'plans.past': 'سابقة',
  'plans.reconfirm': 'تأكيد الحضور',
  'plans.release': 'إطلاق مكاني',
  'plans.reviewChanges': 'مراجعة التغييرات',
  'plans.acceptChanges': 'قبول التغييرات',
  'plans.cancelPlan': 'إلغاء',
  'plans.empty': 'لا توجد خطط بعد. استكشف للعثور على تجربتك القادمة.',

  'arrival.title': 'الوصول',
  'arrival.venue': 'المكان',
  'arrival.address': 'العنوان',
  'arrival.meetingPoint': 'نقطة الالتقاء',
  'arrival.mapLink': 'فتح في الخرائط',
  'arrival.host': 'مضيفك',
  'arrival.startTime': 'وقت البداية',
  'arrival.endTime': 'النهاية المتوقعة',
  'arrival.accessibilityNotes': 'ملاحظات إمكانية الوصول',
  'arrival.lastUpdated': 'آخر تحديث',
  'arrival.offlineCopy': 'متاح بدون إنترنت',
  'arrival.imHere': 'أنا هنا',
  'arrival.illBeLate': 'سأتأخر',
  'arrival.cantFind': 'لا أجد المجموعة',
  'arrival.needHelp': 'أحتاج مساعدة',
  'arrival.notEntitled': 'غير متاح بعد',
  'arrival.notEntitledText': 'تفاصيل المكان الدقيق متاحة فقط للمشاركين المؤكدين ضمن نافذة الإصدار.',

  'feedback.title': 'كيف كانت تجربتك؟',
  'feedback.worthTime': 'هل كانت التجربة تستحق وقتك؟',
  'feedback.descriptionAccurate': 'هل كان الوصف دقيقاً؟',
  'feedback.comfortableOrganized': 'هل كانت مريحة ومنظمة جيداً؟',
  'feedback.optionalComment': 'تعليق خاص (اختياري)',
  'feedback.submit': 'إرسال الملاحظات',
  'feedback.thankYou': 'شكراً لملاحظاتك!',
  'feedback.bookAnother': 'احجز تجربة أخرى',

  'profile.title': 'الملف الشخصي',
  'profile.preferences': 'التفضيلات',
  'profile.dataRights': 'حقوق بياناتك',
  'profile.exportData': 'تصدير بياناتي',
  'profile.correctData': 'تصحيح بياناتي',
  'profile.deleteData': 'حذف بياناتي',
  'profile.privacyNotice': 'إشعار الخصوصية',
  'profile.terms': 'شروط الخدمة',
  'profile.marketingConsent': 'رسائل تسويقية',

  'support.title': 'الدعم',
  'support.operationalHelp': 'احصل على مساعدة',
  'support.reportConcern': 'الإبلاغ عن مشكلة',
  'support.reportParticipant': 'الإبلاغ عن مشارك',
  'support.reportHost': 'الإبلاغ عن مضيف',
  'support.reportVenue': 'الإبلاغ عن مكان',
  'support.generalConcern': 'مشكلة عامة',
  'support.blockUser': 'حظر شخص',
  'support.emergencyDisclaimer': 'يلا لا تحل محل خدمات الطوارئ. في حالة الطوارئ، اتصل بالسلطات المحلية فوراً.',
  'support.submissionAcknowledged': 'تم استلام بلاغك.',
  'support.responseExpectation': 'سنراجعه ونرد بشكل مناسب.',

  'staff.plans': 'الخطط',
  'staff.hosts': 'المضيفون',
  'staff.venues': 'الأماكن',
  'staff.requests': 'الطلبات',
  'staff.waitlist': 'قائمة الانتظار',
  'staff.attendance': 'الحضور',
  'staff.notifications': 'الإشعارات',
  'staff.recovery': 'الاسترداد',
  'staff.safetyCases': 'حالات السلامة',
  'staff.audit': 'سجل التدقيق',
  'staff.metrics': 'المقاييس',
  'staff.exportCsv': 'تصدير CSV',
  'staff.exportExcel': 'تصدير Excel',
  'staff.assignHost': 'تعيين مضيف',
  'staff.assignVenue': 'تعيين مكان',
  'staff.setCapacity': 'تعيين السعة',
  'staff.correctAttendance': 'تصحيح الحضور',
  'staff.reasonRequired': 'السبب مطلوب',

  'wallet.addToApple': 'إضافة إلى محفظة Apple',
  'wallet.addToGoogle': 'إضافة إلى محفظة Google',
  'wallet.privacyNotice': 'سيتم فتح إحداثيات الموقع ورمز الدخول في محفظتك قبل 24 ساعة عند تأكيد الحضور.',
  'wallet.offlinePassTitle': 'بطاقة صعود بدون إنترنت',
  'wallet.downloadStarted': 'تم تنزيل البطاقة للاستخدام بدون إنترنت',

  'host.title': 'بوابة المضيف',
  'host.overview': 'نظرة عامة',
  'host.calendar': 'التقويم',
  'host.attendees': 'المشاركون',
  'host.payouts': 'الأرباح والمدفوعات',
  'host.totalAttendees': 'المشاركون المخدومون',
  'host.averageRating': 'متوسط التقييم',
  'host.totalEarnings': 'إجمالي صافي الأرباح',
  'host.upcomingSessions': 'الجلسات القادمة',
  'host.scheduleSession': 'جدولة جلسة جديدة',
  'host.sessionTitle': 'عنوان الجلسة',
  'host.sessionTitleAr': 'عنوان الجلسة (بالعربية)',
  'host.date': 'التاريخ',
  'host.time': 'الوقت',
  'host.price': 'السعر (ر.س)',
  'host.capacity': 'السعة',
  'host.seatUtilization': '{booked} / {capacity} مقاعد محجوزة',
  'host.checkInPin': 'أدخل رمز التحقق',
  'host.checkInBtn': 'تسجيل الحضور',
  'host.checkInSuccess': 'تم تسجيل حضور المشارك بنجاح',
  'host.pendingBalance': 'الرصيد المعلق',
  'host.totalPaidOut': 'إجمالي المدفوعات',
  'host.stripeStatus': 'حالة تحويل Stripe',
  'host.cancelSession': 'إلغاء الجلسة',
  'host.capacityError': 'لا يمكن تقليل السعة عن عدد الحجوزات المؤكدة حالياً.',

  'state.available': 'متاح',
  'state.approvalPending': 'بانتظار الموافقة',
  'state.waitlisted': 'في قائمة الانتظار',
  'state.seatOffered': 'مقعد معروض',
  'state.confirmed': 'مؤكد',
  'state.reconfirmationRequired': 'إعادة التأكيد مطلوبة',
  'state.expired': 'منتهي',
  'state.full': 'مكتمل',
  'state.unavailable': 'غير متاح',

  'error.permissionDenied': 'تم رفض الإذن',
  'error.permissionDeniedText': 'ليس لديك صلاحية الوصول إلى هذا المورد.',
  'error.networkError': 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
  'error.staleData': 'هذه المعلومات قد تكون قديمة. يرجى التحديث.',
  'error.sessionExpired': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  'error.restrictedAccount': 'حسابك مقيد حالياً.',
  'error.hostAbsent': 'المضيف غير متاح. يتم ترتيب بديل.',
  'error.venueUnavailable': 'المكان غير متاح. سيتم تعيين مكان بديل.',
  'error.minAttendanceNotMet': 'لم يتم تحقيق الحد الأدنى للحضور. تم إلغاء هذه التجربة.',
  'error.notificationFailed': 'فشل تسليم الإشعار. جاري إعادة المحاولة.',
  'error.refundPending': 'جاري معالجة الاسترداد.',
  'error.manualRecovery': 'استرداد يدوي مطلوب. تم إشعار الفريق.',
  'error.unknownOutcome': 'نتيجة غير معروفة',
  'error.unknownOutcomeText': 'لم نتمكن من تأكيد النتيجة. عمليتك قيد المراجعة. لن ننشئ عملية مكررة.',
};

const translations: Record<Language, TranslationKeys> = { en, ar };

export function t(key: keyof TranslationKeys, lang: Language, params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] || translations.en?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export type TranslationKey = keyof TranslationKeys;
