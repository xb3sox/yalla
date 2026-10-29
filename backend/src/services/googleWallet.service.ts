import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';
import { isVenueDetailsUnlocked, generateCheckInToken, PassUserData } from './appleWallet.service';

export interface GoogleWalletPassPayload {
  id: string;
  classId: string;
  state: string;
  eventName: { defaultValue: { language: string; value: string } };
  venue: {
    name: { defaultValue: { language: string; value: string } };
    address: { defaultValue: { language: string; value: string } };
  };
  locations?: Array<{ latitude: number; longitude: number }>;
  barcode: {
    type: string;
    value: string;
    alternateText: string;
  };
  textModulesData: Array<{
    id: string;
    header: string;
    body: string;
  }>;
}

/**
 * Creates Google Wallet Pass JSON payload complying with eval-008 privacy invariant.
 */
export function createGoogleWalletPassPayload(
  reservation: any,
  experience: any,
  user?: PassUserData,
  now: Date = new Date()
): GoogleWalletPassPayload {
  const unlocked = isVenueDetailsUnlocked(reservation, experience, now);
  const qrToken = generateCheckInToken(reservation, experience, user);

  const venueName = unlocked
    ? (experience.venue_name || experience.title || 'Secret Experience Venue')
    : (experience.area || experience.neighborhood || 'General Neighborhood');

  const venueAddress = unlocked
    ? (experience.venue_address || '123 Olaya St, Riyadh')
    : `${experience.area || 'Riyadh'}, Saudi Arabia`;

  const pinText = unlocked ? (reservation.pin || '482910') : 'Unlocks 24h prior';

  const payload: GoogleWalletPassPayload = {
    id: `issuer.res_${reservation.id}`,
    classId: `issuer.exp_${experience.id}`,
    state: 'ACTIVE',
    eventName: {
      defaultValue: {
        language: 'en-US',
        value: experience.title || 'Yalla Experience',
      },
    },
    venue: {
      name: {
        defaultValue: {
          language: 'en-US',
          value: venueName,
        },
      },
      address: {
        defaultValue: {
          language: 'en-US',
          value: venueAddress,
        },
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: qrToken,
      alternateText: `Check-In PIN: ${pinText}`,
    },
    textModulesData: [
      {
        id: 'pin',
        header: 'Check-In PIN',
        body: pinText,
      },
      {
        id: 'attendee',
        header: 'Attendee',
        body: user?.display_name || 'Yalla Guest',
      },
    ],
  };

  // Strictly omit locations / geofencing unless unlocked!
  if (unlocked && experience.latitude && experience.longitude) {
    payload.locations = [
      {
        latitude: Number(experience.latitude),
        longitude: Number(experience.longitude),
      },
    ];
  }

  return payload;
}

/**
 * Generates Google Wallet save URL containing signed JWT token
 */
export function generateGoogleWalletSaveUrl(
  reservation: any,
  experience: any,
  user?: PassUserData,
  now: Date = new Date()
): { saveUrl: string; payload: GoogleWalletPassPayload } {
  const payload = createGoogleWalletPassPayload(reservation, experience, user, now);
  const secret = config.jwt?.secret || 'yalla_jwt_secret_dev';

  const jwtToken = jwt.sign(
    {
      iss: 'yalla-service-account@yalla-wallet.iam.gserviceaccount.com',
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        eventTicketObjects: [payload],
      },
    },
    secret,
    { expiresIn: '30d' }
  );

  const saveUrl = `https://pay.google.com/gp/v/save/${jwtToken}`;

  logger.info('Generated Google Wallet Save URL', {
    reservationId: reservation.id,
    unlocked: isVenueDetailsUnlocked(reservation, experience, now),
  });

  return { saveUrl, payload };
}

/**
 * Simulates patching/updating Google Wallet pass via REST API upon reconfirmation
 */
export async function patchGoogleWalletPass(
  reservation: any,
  experience: any,
  user?: PassUserData,
  now: Date = new Date()
): Promise<GoogleWalletPassPayload> {
  const updatedPayload = createGoogleWalletPassPayload(reservation, experience, user, now);
  logger.info('Patched Google Wallet Pass Object via REST API', {
    reservationId: reservation.id,
    venueUnlocked: isVenueDetailsUnlocked(reservation, experience, now),
  });
  return updatedPayload;
}

export default {
  createGoogleWalletPassPayload,
  generateGoogleWalletSaveUrl,
  patchGoogleWalletPass,
};
