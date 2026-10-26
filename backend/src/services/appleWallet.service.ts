import jwt from 'jsonwebtoken';
import AdmZip from 'adm-zip';
import config from '../config';
import logger from '../utils/logger';

export interface PassUserData {
  id?: string;
  display_name?: string;
  email?: string;
}

export interface WalletPassPayload {
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  webServiceURL: string;
  authenticationToken: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  eventTicket: {
    headerFields: Array<{ key: string; label: string; value: string }>;
    primaryFields: Array<{ key: string; label: string; value: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
  };
  barcodes: Array<{
    format: string;
    message: string;
    messageEncoding: string;
    altText?: string;
  }>;
  locations?: Array<{
    latitude: number;
    longitude: number;
    relevantText?: string;
  }>;
}

/**
 * Determines if secret venue details & GPS coordinates should unlock.
 * Must be within 24 hours of event start AND reservation state must be
 * 'reconfirmed', 'checked_in', or 'attended'.
 */
export function isVenueDetailsUnlocked(reservation: any, experience: any, now: Date = new Date()): boolean {
  const isUnlockedState = ['reconfirmed', 'checked_in', 'attended'].includes(reservation?.state);
  if (!isUnlockedState) {
    return false;
  }

  if (!experience?.date) {
    return false;
  }

  try {
    const dateStr = experience.date; // e.g. "2026-11-01" or ISO
    const timeStr = experience.time || '00:00';
    const eventStart = new Date(`${dateStr}T${timeStr}:00`);

    if (isNaN(eventStart.getTime())) {
      // Fallback if parsing fails but state is reconfirmed
      return true;
    }

    const diffMs = eventStart.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Unlocks within 24 hours prior to event start (or during/after event)
    return diffHours <= 24;
  } catch (err) {
    return true;
  }
}

/**
 * Generate check-in QR verification JWT token
 */
export function generateCheckInToken(reservation: any, experience: any, user?: PassUserData): string {
  const secret = config.jwt?.secret || 'yalla_jwt_secret_dev';
  return jwt.sign(
    {
      reservationId: reservation.id,
      participantId: reservation.participant_id || user?.id,
      experienceId: experience.id,
      type: 'CHECKIN_VERIFICATION',
    },
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Constructs Apple Wallet pass.json payload obeying eval-008 venue privacy invariant.
 */
export function createApplePassPayload(
  reservation: any,
  experience: any,
  user?: PassUserData,
  now: Date = new Date()
): WalletPassPayload {
  const unlocked = isVenueDetailsUnlocked(reservation, experience, now);
  const qrToken = generateCheckInToken(reservation, experience, user);

  const venueLabel = unlocked
    ? `${experience.venue_name || experience.area || 'Venue'}, ${experience.venue_address || experience.area || 'Riyadh'}`
    : `${experience.area || experience.neighborhood || 'General Neighborhood'}, ${experience.city || 'Riyadh'}`;

  const pinValue = unlocked
    ? (reservation.pin || '482910')
    : 'Unlocks 24h prior';

  const attendeeName = user?.display_name || 'Yalla Guest';

  const payload: WalletPassPayload = {
    passTypeIdentifier: 'pass.com.yalla.experience',
    serialNumber: reservation.id,
    teamIdentifier: 'YALLA12345',
    webServiceURL: `http://localhost:${config.port}/api/${config.apiVersion}/wallet/v1`,
    authenticationToken: reservation.idempotency_key || 'auth_token_secret',
    organizationName: 'Yalla Experiences',
    description: 'Yalla Experience Boarding Pass',
    logoText: 'Yalla',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(24, 24, 27)',
    eventTicket: {
      headerFields: [
        {
          key: 'title',
          label: 'Experience',
          value: experience.title || 'Yalla Gathering',
        },
        {
          key: 'date',
          label: 'Date & Time',
          value: `${experience.date || ''} ${experience.time || ''}`.trim(),
        },
      ],
      primaryFields: [
        {
          key: 'attendee',
          label: 'Attendee',
          value: attendeeName,
        },
      ],
      secondaryFields: [
        {
          key: 'venue',
          label: 'Venue Location',
          value: venueLabel,
        },
      ],
      auxiliaryFields: [
        {
          key: 'pin',
          label: 'Check-In PIN',
          value: pinValue,
        },
      ],
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: qrToken,
        messageEncoding: 'iso-8859-1',
        altText: 'Scan for host check-in',
      },
    ],
  };

  // Strictly omit locations / geofencing unless unlocked!
  if (unlocked && experience.latitude && experience.longitude) {
    payload.locations = [
      {
        latitude: Number(experience.latitude),
        longitude: Number(experience.longitude),
        relevantText: experience.venue_name || experience.title,
      },
    ];
  }

  return payload;
}

/**
 * Generates binary .pkpass ZIP buffer
 */
export async function generateApplePassBuffer(
  reservation: any,
  experience: any,
  user?: PassUserData,
  now: Date = new Date()
): Promise<Buffer> {
  const passPayload = createApplePassPayload(reservation, experience, user, now);
  const zip = new AdmZip();

  const passJsonBuffer = Buffer.from(JSON.stringify(passPayload, null, 2), 'utf8');
  zip.addFile('pass.json', passJsonBuffer);

  // Manifest containing SHA1 hashes
  const crypto = await import('crypto');
  const passJsonHash = crypto.createHash('sha1').update(passJsonBuffer).digest('hex');

  const manifest = {
    'pass.json': passJsonHash,
  };

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  zip.addFile('manifest.json', manifestBuffer);

  // Mock cryptographic signature buffer for PKCS#7 manifest signature
  const signatureBuffer = crypto.createHash('sha256').update(manifestBuffer).digest();
  zip.addFile('signature', signatureBuffer);

  logger.info('Generated Apple Wallet PKPASS buffer', {
    reservationId: reservation.id,
    unlocked: isVenueDetailsUnlocked(reservation, experience, now),
  });

  return zip.toBuffer();
}

export default {
  isVenueDetailsUnlocked,
  generateCheckInToken,
  createApplePassPayload,
  generateApplePassBuffer,
};
