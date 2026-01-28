import SystemConfig from '../models/SystemConfig';

/**
 * Seed SystemConfig with comprehensive business configurations
 * Categories: general, pricing, email, notifications, security, business
 */
export const seedSystemConfig = async (): Promise<void> => {
  try {
    // Check if configs already exist
    const existing = await SystemConfig.count();
    if (existing > 0) {
      console.log('✓ SystemConfig seed data already exists, skipping...');
      return;
    }

    console.log('📝 Seeding SystemConfig data...');

    const configs = [
      // ============================================
      // GENERAL - 5 configs
      // ============================================
      {
        configKey: 'company_name',
        configValue: 'MOVICAR',
        configType: 'string' as const,
        category: 'general' as const,
        description: 'Nombre de la empresa que aparece en documentos y comunicaciones',
        isEditable: true,
      },
      {
        configKey: 'tax_percentage',
        configValue: '16',
        configType: 'number' as const,
        category: 'general' as const,
        description: 'Porcentaje de IVA aplicado a todas las transacciones (%)',
        isEditable: true,
      },
      {
        configKey: 'currency',
        configValue: 'MXN',
        configType: 'string' as const,
        category: 'general' as const,
        description: 'Moneda por defecto (MXN, USD, etc.)',
        isEditable: true,
      },
      {
        configKey: 'timezone',
        configValue: 'America/Mexico_City',
        configType: 'string' as const,
        category: 'general' as const,
        description: 'Zona horaria del sistema',
        isEditable: true,
      },
      {
        configKey: 'language',
        configValue: 'es',
        configType: 'string' as const,
        category: 'general' as const,
        description: 'Idioma del sistema (es, en)',
        isEditable: true,
      },

      // ============================================
      // PRICING - 6 configs
      // ============================================
      {
        configKey: 'late_fee_multiplier',
        configValue: '1.5',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Multiplicador para cargos por retraso en devolución',
        isEditable: true,
      },
      {
        configKey: 'deposit_percentage',
        configValue: '30',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Porcentaje de depósito requerido sobre el total de la renta (%)',
        isEditable: true,
      },
      {
        configKey: 'cleaning_fee',
        configValue: '500',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Cargo por limpieza profunda del vehículo (MXN)',
        isEditable: true,
      },
      {
        configKey: 'damage_assessment_fee',
        configValue: '200',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Cargo por evaluación de daños (MXN)',
        isEditable: true,
      },
      {
        configKey: 'fuel_refill_multiplier',
        configValue: '1.2',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Multiplicador sobre precio de mercado para re-llenado de combustible',
        isEditable: true,
      },
      {
        configKey: 'early_return_refund_percentage',
        configValue: '50',
        configType: 'number' as const,
        category: 'pricing' as const,
        description: 'Porcentaje de reembolso por devolución anticipada (%)',
        isEditable: true,
      },

      // ============================================
      // EMAIL - 4 configs
      // ============================================
      {
        configKey: 'email_from_name',
        configValue: 'MOVICAR',
        configType: 'string' as const,
        category: 'email' as const,
        description: 'Nombre del remitente en correos electrónicos',
        isEditable: true,
      },
      {
        configKey: 'email_from_address',
        configValue: 'noreply@movicar.com',
        configType: 'string' as const,
        category: 'email' as const,
        description: 'Dirección de correo del remitente',
        isEditable: true,
      },
      {
        configKey: 'email_support_address',
        configValue: 'soporte@movicar.com',
        configType: 'string' as const,
        category: 'email' as const,
        description: 'Dirección de correo para soporte técnico',
        isEditable: true,
      },
      {
        configKey: 'email_send_enabled',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'email' as const,
        description: 'Habilitar envío automático de correos electrónicos',
        isEditable: true,
      },

      // ============================================
      // NOTIFICATIONS - 6 configs
      // ============================================
      {
        configKey: 'alert_rental_expiring_days',
        configValue: '7',
        configType: 'number' as const,
        category: 'notifications' as const,
        description: 'Días de anticipación para alertas de rentas por vencer',
        isEditable: true,
      },
      {
        configKey: 'alert_payment_pending_days',
        configValue: '3',
        configType: 'number' as const,
        category: 'notifications' as const,
        description: 'Días después de vencimiento para alertar sobre pagos pendientes',
        isEditable: true,
      },
      {
        configKey: 'alert_maintenance_days',
        configValue: '30',
        configType: 'number' as const,
        category: 'notifications' as const,
        description: 'Días de anticipación para alertas de mantenimiento',
        isEditable: true,
      },
      {
        configKey: 'alert_insurance_expiring_days',
        configValue: '30',
        configType: 'number' as const,
        category: 'notifications' as const,
        description: 'Días de anticipación para alertas de seguros por vencer',
        isEditable: true,
      },
      {
        configKey: 'alert_low_inventory_threshold',
        configValue: '2',
        configType: 'number' as const,
        category: 'notifications' as const,
        description: 'Número mínimo de vehículos disponibles antes de alertar',
        isEditable: true,
      },
      {
        configKey: 'notification_email_enabled',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'notifications' as const,
        description: 'Enviar notificaciones por correo electrónico',
        isEditable: true,
      },

      // ============================================
      // SECURITY - 5 configs
      // ============================================
      {
        configKey: 'session_timeout_minutes',
        configValue: '60',
        configType: 'number' as const,
        category: 'security' as const,
        description: 'Tiempo de inactividad antes de cerrar sesión automáticamente (minutos)',
        isEditable: true,
      },
      {
        configKey: 'password_min_length',
        configValue: '8',
        configType: 'number' as const,
        category: 'security' as const,
        description: 'Longitud mínima de contraseña (caracteres)',
        isEditable: true,
      },
      {
        configKey: 'password_require_uppercase',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'security' as const,
        description: 'Requerir al menos una letra mayúscula en contraseñas',
        isEditable: true,
      },
      {
        configKey: 'password_require_numbers',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'security' as const,
        description: 'Requerir al menos un número en contraseñas',
        isEditable: true,
      },
      {
        configKey: 'audit_log_enabled',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'security' as const,
        description: 'Registrar todas las acciones de usuarios en el log de auditoría',
        isEditable: false,
      },

      // ============================================
      // BUSINESS - 6 configs
      // ============================================
      {
        configKey: 'min_rental_days',
        configValue: '1',
        configType: 'number' as const,
        category: 'business' as const,
        description: 'Número mínimo de días para una renta',
        isEditable: true,
      },
      {
        configKey: 'max_rental_days',
        configValue: '90',
        configType: 'number' as const,
        category: 'business' as const,
        description: 'Número máximo de días para una renta',
        isEditable: true,
      },
      {
        configKey: 'grace_period_hours',
        configValue: '2',
        configType: 'number' as const,
        category: 'business' as const,
        description: 'Horas de gracia para devolución sin cargo extra',
        isEditable: true,
      },
      {
        configKey: 'operating_hours_start',
        configValue: '08:00',
        configType: 'string' as const,
        category: 'business' as const,
        description: 'Hora de apertura (formato 24h: HH:MM)',
        isEditable: true,
      },
      {
        configKey: 'operating_hours_end',
        configValue: '20:00',
        configType: 'string' as const,
        category: 'business' as const,
        description: 'Hora de cierre (formato 24h: HH:MM)',
        isEditable: true,
      },
      {
        configKey: 'allow_weekend_pickups',
        configValue: 'true',
        configType: 'boolean' as const,
        category: 'business' as const,
        description: 'Permitir recoger vehículos en fines de semana',
        isEditable: true,
      },
    ];

    await SystemConfig.bulkCreate(configs);

    console.log(`✅ ${configs.length} SystemConfig entries created successfully`);
    console.log('   - General: 5 configs');
    console.log('   - Pricing: 6 configs');
    console.log('   - Email: 4 configs');
    console.log('   - Notifications: 6 configs');
    console.log('   - Security: 5 configs');
    console.log('   - Business: 6 configs');
  } catch (error) {
    console.error('❌ Error seeding SystemConfig:', error);
    throw error;
  }
};

export default seedSystemConfig;
