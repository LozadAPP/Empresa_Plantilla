import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

interface AuditableRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Middleware para registrar todas las acciones en el sistema
 * Registra: CREATE, UPDATE, DELETE operations
 */
export const auditLogger = (entityType: string) => {
  return async (req: AuditableRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json;

    res.json = function (data: any) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const method = req.method;
        let action: 'create' | 'update' | 'delete' | 'read' = 'read';

        if (method === 'POST') action = 'create';
        else if (method === 'PUT' || method === 'PATCH') action = 'update';
        else if (method === 'DELETE') action = 'delete';

        // Don't log read operations to avoid cluttering the audit log
        if (action !== 'read') {
          const userId = req.user?.id;
          const entityId = req.params.id || (data?.data?.id ? String(data.data.id) : null);

          const oldValues = req.method === 'PUT' || req.method === 'PATCH' ? req.body : null;
          const newValues = data?.data || null;

          // Create audit log asynchronously (don't block response)
          (AuditLog.create as any)({
            user_id: userId || 0,
            entity_type: entityType,
            entity_id: entityId ? parseInt(entityId, 10) : 0,
            action: action as 'create' | 'update' | 'delete',
            old_values: oldValues || undefined,
            new_values: newValues || undefined,
            ip_address: req.ip || req.connection.remoteAddress,
          }).catch((error: any) => {
            console.error('Error creating audit log:', error);
          });
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para registrar eventos personalizados en el audit log
 */
export const logCustomEvent = async (
  userId: number | null,
  entityType: string,
  entityId: string | null,
  action: 'create' | 'update' | 'delete',
  details?: {
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    await (AuditLog.create as any)({
      user_id: userId || 0,
      entity_type: entityType,
      entity_id: entityId ? parseInt(entityId, 10) : 0,
      action,
      old_values: details?.oldValues || undefined,
      new_values: details?.newValues || undefined,
      ip_address: details?.ipAddress || undefined,
    });
  } catch (error) {
    console.error('Error logging custom event:', error);
  }
};

export default auditLogger;
