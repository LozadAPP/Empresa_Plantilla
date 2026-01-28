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
          AuditLog.create({
            userId: userId || null,
            entityType,
            entityId,
            action,
            oldValues: oldValues ? JSON.stringify(oldValues) : null,
            newValues: newValues ? JSON.stringify(newValues) : null,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
          }).catch((error) => {
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
  action: 'create' | 'update' | 'delete' | 'read',
  details?: {
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }
) => {
  try {
    await AuditLog.create({
      userId,
      entityType,
      entityId,
      action,
      oldValues: details?.oldValues ? JSON.stringify(details.oldValues) : null,
      newValues: details?.newValues ? JSON.stringify(details.newValues) : null,
      ipAddress: details?.ipAddress || null,
      userAgent: details?.userAgent || null,
    });
  } catch (error) {
    console.error('Error logging custom event:', error);
  }
};

export default auditLogger;
