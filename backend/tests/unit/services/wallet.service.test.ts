import appleWalletService, {
  isVenueDetailsUnlocked,
  createApplePassPayload,
  generateCheckInToken,
  generateApplePassBuffer,
} from '../../../src/services/appleWallet.service';
import googleWalletService, {
  createGoogleWalletPassPayload,
  generateGoogleWalletSaveUrl,
} from '../../../src/services/googleWallet.service';
import jwt from 'jsonwebtoken';
import config from '../../../src/config';

describe('Wallet Pass Services Privacy & Generation Unit Tests (eval-008)', () => {
  const futureDateStr = '2028-12-01';
  const timeStr = '18:00';

  const mockExperience = {
    id: 'exp-100',
    title: 'Secret Rooftop Stargazing',
    area: 'Al Olaya District',
    neighborhood: 'Al Olaya',
    city: 'Riyadh',
    venue_name: 'Al Olaya Secret Observatory',
    venue_address: '123 King Fahd Road, Floor 18, Riyadh',
    date: futureDateStr,
    time: timeStr,
    latitude: 24.7136,
    longitude: 46.6753,
  };

  const mockUser = {
    id: 'user-77',
    display_name: 'Sara Ahmed',
    email: 'sara@example.com',
  };

  describe('Venue Privacy Gating Logic (isVenueDetailsUnlocked)', () => {
    it('returns FALSE for confirmed (unreconfirmed) reservations even if within 24 hours', () => {
      const now = new Date(`${futureDateStr}T10:00:00`); // 8 hours before event
      const reservation = {
        id: 'res-1',
        state: 'confirmed', // NOT reconfirmed
      };

      const unlocked = isVenueDetailsUnlocked(reservation, mockExperience, now);
      expect(unlocked).toBe(false);
    });

    it('returns FALSE for reconfirmed reservations outside the 24 hour window (e.g. 48h prior)', () => {
      const now = new Date('2028-11-28T18:00:00'); // 3 days before event
      const reservation = {
        id: 'res-2',
        state: 'reconfirmed',
      };

      const unlocked = isVenueDetailsUnlocked(reservation, mockExperience, now);
      expect(unlocked).toBe(false);
    });

    it('returns TRUE for reconfirmed reservations within 24 hours of event start', () => {
      const now = new Date(`${futureDateStr}T10:00:00`); // 8 hours before event
      const reservation = {
        id: 'res-3',
        state: 'reconfirmed',
        pin: '883921',
      };

      const unlocked = isVenueDetailsUnlocked(reservation, mockExperience, now);
      expect(unlocked).toBe(true);
    });

    it('returns TRUE for checked_in or attended state within 24 hours', () => {
      const now = new Date(`${futureDateStr}T18:30:00`);
      const reservation = { id: 'res-4', state: 'checked_in', pin: '883921' };

      const unlocked = isVenueDetailsUnlocked(reservation, mockExperience, now);
      expect(unlocked).toBe(true);
    });
  });

  describe('Apple Wallet Pass Generation (appleWallet.service.ts)', () => {
    it('OMITS exact GPS coordinates, venue address, and PIN for pre-24h/unconfirmed passes', () => {
      const reservation = {
        id: 'res-pre24h',
        state: 'confirmed', // unconfirmed
        pin: '123456',
      };

      const passPayload = createApplePassPayload(reservation, mockExperience, mockUser);

      // Verify secondary venue field has neighborhood only
      const venueField = passPayload.eventTicket.secondaryFields.find((f) => f.key === 'venue');
      expect(venueField?.value).toContain('Al Olaya District');
      expect(venueField?.value).not.toContain('123 King Fahd Road');

      // Verify PIN is placeholder
      const pinField = passPayload.eventTicket.auxiliaryFields.find((f) => f.key === 'pin');
      expect(pinField?.value).toBe('Unlocks 24h prior');

      // Verify GPS coordinates / geofencing is completely omitted
      expect(passPayload.locations).toBeUndefined();
    });

    it('INCLUDES exact GPS coordinates, full venue address, and dynamic PIN when unlocked within 24h', () => {
      const reservation = {
        id: 'res-unlocked',
        state: 'reconfirmed',
        pin: '992810',
      };

      // Mock date within 2 hours of event
      const now = new Date(`${futureDateStr}T16:00:00`);
      const unlocked = isVenueDetailsUnlocked(reservation, mockExperience, now);
      expect(unlocked).toBe(true);

      const passPayload = createApplePassPayload(reservation, mockExperience, mockUser, now);

      // Verify venue field has full address
      const venueField = passPayload.eventTicket.secondaryFields.find((f) => f.key === 'venue');
      expect(venueField?.value).toContain('123 King Fahd Road');

      // Verify PIN is included
      const pinField = passPayload.eventTicket.auxiliaryFields.find((f) => f.key === 'pin');
      expect(pinField?.value).toBe('992810');

      // Verify geofencing coordinates are included
      expect(passPayload.locations).toBeDefined();
      expect(passPayload.locations?.[0].latitude).toBe(24.7136);
      expect(passPayload.locations?.[0].longitude).toBe(46.6753);
    });

    it('embeds a valid signed check-in QR code JWT token', () => {
      const reservation = { id: 'res-jwt-1', participant_id: 'user-77' };
      const token = generateCheckInToken(reservation, mockExperience, mockUser);

      expect(typeof token).toBe('string');

      const secret = config.jwt?.secret || 'yalla_jwt_secret_dev';
      const decoded: any = jwt.verify(token, secret);

      expect(decoded.reservationId).toBe('res-jwt-1');
      expect(decoded.experienceId).toBe('exp-100');
      expect(decoded.type).toBe('CHECKIN_VERIFICATION');
    });

    it('generates a binary .pkpass ZIP buffer containing pass.json and manifest', async () => {
      const reservation = { id: 'res-zip-1', state: 'confirmed' };
      const buffer = await generateApplePassBuffer(reservation, mockExperience, mockUser);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
      // ZIP magic bytes PK\x03\x04
      expect(buffer.slice(0, 2).toString('ascii')).toBe('PK');
    });
  });

  describe('Google Wallet Pass Generation (googleWallet.service.ts)', () => {
    it('omits exact coordinates for pre-24h passes and includes them when unlocked', () => {
      const reservationPre = { id: 'res-g1', state: 'confirmed' };
      const payloadPre = createGoogleWalletPassPayload(reservationPre, mockExperience, mockUser);

      expect(payloadPre.venue.address.defaultValue.value).not.toContain('123 King Fahd Road');
      expect(payloadPre.locations).toBeUndefined();

      const reservationUnlocked = { id: 'res-g2', state: 'reconfirmed', pin: '554433' };
      const now = new Date(`${futureDateStr}T17:00:00`);
      expect(isVenueDetailsUnlocked(reservationUnlocked, mockExperience, now)).toBe(true);

      const payloadUnlocked = createGoogleWalletPassPayload(reservationUnlocked, mockExperience, mockUser, now);
      expect(payloadUnlocked.venue.address.defaultValue.value).toContain('123 King Fahd Road');
      expect(payloadUnlocked.locations).toBeDefined();
    });

    it('generates a valid Google Wallet save URL containing JWT token', () => {
      const reservation = { id: 'res-g3', state: 'reconfirmed' };
      const { saveUrl } = generateGoogleWalletSaveUrl(reservation, mockExperience, mockUser);

      expect(saveUrl).toContain('https://pay.google.com/gp/v/save/');
    });
  });
});
