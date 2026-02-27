import AuditLog from '../models/AuditLog';
import logger from '../config/logger';

interface AuditLogParams {
  userId: number;
  entityType: string;
  entityId: number;
  action: 'create' | 'update' | 'delete';
  oldValues?: object | null;
  newValues?: object | null;
  ipAddress?: string;
}

/**
 * Creates an audit log entry. Fire-and-forget: errors are logged
 * but never propagate to the caller so auditing doesn't break
 * normal operations.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      old_values: params.oldValues || null,
      new_values: params.newValues || null,
      timestamp: new Date(),
      ip_address: params.ipAddress || null,
    } as any);
  } catch (error) {
    logger.error('Failed to create audit log', { error });
  }
}

/**
 * Helper to extract the client IP from an Express request.
 */
export function getClientIp(req: any): string {
  return req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
}
