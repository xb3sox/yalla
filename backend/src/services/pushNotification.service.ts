import webPush from 'web-push';
import pool from '../config/database';
import config from '../config';
import logger from '../utils/logger';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  dir?: 'rtl' | 'ltr' | 'auto';
  lang?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export class PushNotificationService {
  constructor() {
    this.initVapid();
  }

  public initVapid(): void {
    if (config.vapid.subject && config.vapid.publicKey && config.vapid.privateKey) {
      try {
        webPush.setVapidDetails(
          config.vapid.subject,
          config.vapid.publicKey,
          config.vapid.privateKey
        );
      } catch (err: any) {
        logger.warn('Failed to initialize VAPID details', { error: err.message });
      }
    }
  }

  public getVapidPublicKey(): string {
    return config.vapid.publicKey;
  }

  /**
   * Save or update push subscription for user
   */
  public async saveSubscription(
    userId: string,
    subscription: PushSubscriptionData,
    userAgent?: string
  ): Promise<any> {
    const query = `
      INSERT INTO push_subscriptions (user_id, endpoint, keys, user_agent, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        keys = EXCLUDED.keys,
        user_agent = EXCLUDED.user_agent,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [userId, subscription.endpoint, JSON.stringify(subscription.keys), userAgent || null];
    const result = await pool.query(query, values);
    logger.info('Push subscription saved', { userId, endpoint: subscription.endpoint });
    return result.rows[0];
  }

  /**
   * Delete subscription by user and endpoint
   */
  public async deleteSubscription(userId: string, endpoint: string): Promise<boolean> {
    const query = `
      DELETE FROM push_subscriptions
      WHERE user_id = $1 AND endpoint = $2
    `;
    const result = await pool.query(query, [userId, endpoint]);
    logger.info('Push subscription deleted', { userId, endpoint });
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete subscription by id
   */
  public async deleteSubscriptionById(id: string): Promise<void> {
    const query = 'DELETE FROM push_subscriptions WHERE id = $1';
    await pool.query(query, [id]);
    logger.info('Expired/invalid push subscription pruned', { subscriptionId: id });
  }

  /**
   * Delete all subscriptions for a user (e.g., account deletion / logout)
   */
  public async deleteAllUserSubscriptions(userId: string): Promise<number> {
    const query = 'DELETE FROM push_subscriptions WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    logger.info('All push subscriptions deleted for user', { userId });
    return result.rowCount ?? 0;
  }

  /**
   * Get subscriptions for a user
   */
  public async getUserSubscriptions(userId: string): Promise<any[]> {
    const query = 'SELECT * FROM push_subscriptions WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Format payload with default RTL & localization attributes
   */
  public formatPayload(payload: PushPayload): Record<string, any> {
    return {
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      dir: payload.dir || 'rtl',
      lang: payload.lang || 'ar',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-96x96.png',
      tag: payload.tag,
      data: payload.data || {},
    };
  }

  /**
   * Send push notification to a user
   */
  public async sendPushNotificationToUser(
    userId: string,
    payload: PushPayload
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await this.getUserSubscriptions(userId);
    if (!subscriptions || subscriptions.length === 0) {
      logger.info('No push subscriptions found for user', { userId });
      return { sent: 0, failed: 0 };
    }

    const formattedPayload = this.formatPayload(payload);
    const jsonPayload = JSON.stringify(formattedPayload);

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const keys = typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys;
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: keys,
      };

      try {
        await webPush.sendNotification(pushSubscription, jsonPayload);
        sent++;
      } catch (error: any) {
        failed++;
        logger.error('Failed to deliver push notification', {
          userId,
          endpoint: sub.endpoint,
          statusCode: error.statusCode,
          error: error.message,
        });

        // Prune expired or invalid subscriptions (404 Not Found or 410 Gone)
        if (error.statusCode === 404 || error.statusCode === 410) {
          await this.deleteSubscriptionById(sub.id);
        }
      }
    }

    return { sent, failed };
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
