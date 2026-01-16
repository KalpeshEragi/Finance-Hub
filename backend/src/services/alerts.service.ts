/**
 * @file alerts.service.ts
 * @description User alerts/notifications service.
 * 
 * Manages user notifications:
 * - Fetching alerts (all, unread)
 * - Marking alerts as read
 * - Creating system-generated alerts
 */

import mongoose from 'mongoose';
import Alert, { IAlert, AlertType } from '../models/alert.model';

// =============================================================================
// TYPES
// =============================================================================

interface AlertPublic {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    isRead: boolean;
    relatedEntityId?: string;
    relatedEntityType?: 'budget' | 'goal' | 'transaction';
    createdAt: Date;
}

interface AlertsResponse {
    alerts: AlertPublic[];
    unreadCount: number;
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * @function getAlerts
 * @description Fetches alerts for a user.
 * 
 * @param userId - User ID
 * @param options - Filter options
 * @returns Alerts with unread count
 */
export async function getAlerts(
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {}
): Promise<AlertsResponse> {
    const { unreadOnly = false, limit = 50 } = options;

    const query: Record<string, unknown> = { userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    const [alerts, unreadCount] = await Promise.all([
        Alert.find(query)
            .sort({ createdAt: -1 })
            .limit(limit),
        Alert.countDocuments({ userId, isRead: false }),
    ]);

    return {
        alerts: alerts.map(formatAlertForResponse),
        unreadCount,
    };
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

/**
 * @function markAsRead
 * @description Marks specific alerts or all alerts as read.
 * 
 * @param userId - User ID
 * @param alertIds - Optional specific alert IDs (marks all if not provided)
 * @returns Number of alerts updated
 */
export async function markAsRead(
    userId: string,
    alertIds?: string[]
): Promise<{ updated: number }> {
    const query: Record<string, unknown> = {
        userId,
        isRead: false
    };

    if (alertIds && alertIds.length > 0) {
        query._id = { $in: alertIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const result = await Alert.updateMany(
        query,
        { $set: { isRead: true } }
    );

    return { updated: result.modifiedCount };
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

/**
 * @function createAlert
 * @description Creates a new alert for a user.
 * 
 * @param userId - User ID
 * @param data - Alert data
 * @returns Created alert
 */
export async function createAlert(
    userId: string,
    data: {
        type: AlertType;
        title: string;
        message: string;
        relatedEntityId?: string;
        relatedEntityType?: 'budget' | 'goal' | 'transaction';
        metadata?: Record<string, unknown>;
    }
): Promise<AlertPublic> {
    const alert = await Alert.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId
            ? new mongoose.Types.ObjectId(data.relatedEntityId)
            : undefined,
        relatedEntityType: data.relatedEntityType,
        metadata: data.metadata,
        isRead: false,
    });

    return formatAlertForResponse(alert);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatAlertForResponse(alert: IAlert): AlertPublic {
    return {
        id: alert._id.toString(),
        type: alert.type,
        title: alert.title,
        message: alert.message,
        isRead: alert.isRead,
        relatedEntityId: alert.relatedEntityId?.toString(),
        relatedEntityType: alert.relatedEntityType,
        createdAt: alert.createdAt,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const alertsService = {
    getAlerts,
    markAsRead,
    createAlert,
};

export default alertsService;
