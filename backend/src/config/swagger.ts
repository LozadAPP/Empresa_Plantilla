import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MOVICAR API Documentation',
      version: '1.0.0',
      description: `
## MOVICAR - Sistema de Gestion de Renta de Vehiculos

API RESTful para el sistema de gestion de renta de vehiculos MOVICAR.

### Caracteristicas Principales:
- **Autenticacion JWT**: Login seguro con tokens de acceso y refresh
- **Gestion de Vehiculos**: CRUD completo de inventario de vehiculos
- **Gestion de Clientes**: Administracion de clientes individuales, corporativos y gubernamentales
- **Sistema de Rentas**: Reservas, rentas activas, devoluciones y pagos
- **Facturacion**: Generacion automatica de facturas y seguimiento de pagos
- **Mantenimiento**: Programacion y seguimiento de mantenimiento de vehiculos
- **Contabilidad**: Balance general, estados de resultados y transacciones
- **Reportes**: Ingresos, ocupacion, rentabilidad y mas
- **Inventario Generico**: Sistema multi-categoria con tracking GPS

### Autenticacion:
La mayoria de los endpoints requieren autenticacion mediante JWT.
Incluye el token en el header Authorization como: \`Bearer <token>\`
      `,
      contact: {
        name: 'MOVICAR Support',
        email: 'support@movicar.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.movicar.com/api/v1',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Autenticacion y gestion de sesiones' },
      { name: 'Users', description: 'Gestion de usuarios del sistema' },
      { name: 'Customers', description: 'Gestion de clientes' },
      { name: 'Vehicles', description: 'Gestion de vehiculos' },
      { name: 'Rentals', description: 'Gestion de rentas' },
      { name: 'Returns', description: 'Devoluciones de vehiculos' },
      { name: 'Payments', description: 'Gestion de pagos' },
      { name: 'Invoices', description: 'Facturacion' },
      { name: 'Maintenance', description: 'Mantenimiento de vehiculos' },
      { name: 'Inventory', description: 'Inventario generico con tracking GPS' },
      { name: 'Locations', description: 'Ubicaciones y sucursales' },
      { name: 'Dashboard', description: 'Metricas y KPIs del dashboard' },
      { name: 'Reports', description: 'Reportes y estadisticas' },
      { name: 'Accounting', description: 'Contabilidad y transacciones' },
      { name: 'Alerts', description: 'Sistema de alertas' },
      { name: 'Config', description: 'Configuracion del sistema' },
      { name: 'Audit', description: 'Logs de auditoria' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@movicar.com' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+1234567890' },
            roles: {
              type: 'array',
              items: { type: 'string' },
              example: ['admin', 'manager']
            },
            is_active: { type: 'boolean', example: true },
            location_id: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Empresa ABC S.A.' },
            email: { type: 'string', format: 'email', example: 'contact@empresa.com' },
            phone: { type: 'string', example: '+1234567890' },
            customer_type: { type: 'string', enum: ['individual', 'corporate', 'government'], example: 'corporate' },
            credit_limit: { type: 'number', example: 50000.00 },
            payment_terms: { type: 'integer', example: 30 },
            discount_percentage: { type: 'number', example: 10 },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            make: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Camry' },
            year: { type: 'integer', example: 2023 },
            license_plate: { type: 'string', example: 'ABC-123' },
            vin: { type: 'string', example: '1HGCM82633A123456' },
            status: { type: 'string', enum: ['available', 'rented', 'maintenance', 'retired'], example: 'available' },
            mileage: { type: 'integer', example: 15000 },
            vehicle_type_id: { type: 'integer', example: 1 },
            location_id: { type: 'integer', example: 1 },
            purchase_price: { type: 'number', example: 25000.00 },
            current_value: { type: 'number', example: 22000.00 },
            monthly_depreciation: { type: 'number', example: 250.00 }
          }
        },
        Rental: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            customer_id: { type: 'integer', example: 1 },
            vehicle_id: { type: 'integer', example: 1 },
            location_id: { type: 'integer', example: 1 },
            return_location_id: { type: 'integer', example: 1 },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['reserved', 'active', 'completed', 'cancelled'], example: 'active' },
            daily_rate: { type: 'number', example: 50.00 },
            total_amount: { type: 'number', example: 350.00 },
            deposit_amount: { type: 'number', example: 200.00 },
            tax_percentage: { type: 'number', example: 16 },
            discount_percentage: { type: 'number', example: 0 },
            start_mileage: { type: 'integer', example: 15000 },
            fuel_level_start: { type: 'string', enum: ['empty', 'quarter', 'half', 'three_quarters', 'full'], example: 'full' },
            notes: { type: 'string' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            customer_id: { type: 'integer', example: 1 },
            rental_id: { type: 'integer', example: 1 },
            invoice_id: { type: 'integer', example: 1 },
            amount: { type: 'number', example: 350.00 },
            payment_method: { type: 'string', enum: ['cash', 'credit_card', 'debit_card', 'transfer', 'check', 'other'], example: 'credit_card' },
            payment_type: { type: 'string', enum: ['rental', 'deposit', 'penalty', 'damage', 'other'], example: 'rental' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], example: 'completed' },
            reference_number: { type: 'string', example: 'REF-123456' },
            transaction_date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            invoice_number: { type: 'string', example: 'INV-2024-0001' },
            customer_id: { type: 'integer', example: 1 },
            rental_id: { type: 'integer', example: 1 },
            subtotal: { type: 'number', example: 300.00 },
            tax_amount: { type: 'number', example: 48.00 },
            total_amount: { type: 'number', example: 348.00 },
            status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], example: 'sent' },
            issue_date: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' },
            paid_date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' }
          }
        },
        Return: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            rental_id: { type: 'integer', example: 1 },
            return_date: { type: 'string', format: 'date-time' },
            return_location_id: { type: 'integer', example: 1 },
            end_mileage: { type: 'integer', example: 15500 },
            fuel_level: { type: 'string', enum: ['empty', 'quarter', 'half', 'three_quarters', 'full'], example: 'three_quarters' },
            vehicle_condition: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor', 'damaged'], example: 'good' },
            damage_description: { type: 'string' },
            damage_cost: { type: 'number', example: 0 },
            cleaning_required: { type: 'boolean', example: false },
            inspection_notes: { type: 'string' }
          }
        },
        Location: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Sucursal Centro' },
            address: { type: 'string', example: 'Av. Principal 123' },
            city: { type: 'string', example: 'Ciudad de Mexico' },
            state: { type: 'string', example: 'CDMX' },
            country: { type: 'string', example: 'Mexico' },
            zipCode: { type: 'string', example: '06600' },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 19.4326 },
                lng: { type: 'number', example: -99.1332 }
              }
            },
            type: { type: 'string', enum: ['office', 'warehouse', 'maintenance', 'other'], example: 'office' },
            is_active: { type: 'boolean', example: true }
          }
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'GPS Trimble R10' },
            serialNumber: { type: 'string', example: 'TR10-2024-001' },
            categoryId: { type: 'integer', example: 2 },
            categoryName: { type: 'string', example: 'Equipo Topografico' },
            status: { type: 'string', enum: ['available', 'rented', 'maintenance', 'retired'], example: 'available' },
            currentLocationId: { type: 'integer', example: 1 },
            currentLocationName: { type: 'string', example: 'Sucursal Centro' },
            description: { type: 'string', example: 'GPS de alta precision para topografia' }
          }
        },
        InventoryMovement: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            itemId: { type: 'integer', example: 1 },
            movementType: { type: 'string', enum: ['entry', 'exit', 'transfer'], example: 'transfer' },
            movementSubtype: { type: 'string', enum: ['purchase', 'return', 'rental', 'maintenance', 'relocation', 'other'], example: 'relocation' },
            fromLocationId: { type: 'integer', example: 1 },
            toLocationId: { type: 'integer', example: 2 },
            customerId: { type: 'integer', example: 1 },
            expectedReturnDate: { type: 'string', format: 'date-time' },
            documentNumber: { type: 'string', example: 'MOV-2024-00001' },
            notes: { type: 'string' }
          }
        },
        MaintenanceOrder: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            vehicleId: { type: 'integer', example: 1 },
            maintenanceTypeId: { type: 'integer', example: 1 },
            scheduledDate: { type: 'string', format: 'date-time' },
            completedDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], example: 'scheduled' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium' },
            estimatedCost: { type: 'number', example: 500.00 },
            actualCost: { type: 'number', example: 450.00 },
            description: { type: 'string' },
            workshopName: { type: 'string', example: 'Taller Oficial' },
            technicianName: { type: 'string', example: 'Juan Perez' }
          }
        },
        Alert: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            type: { type: 'string', example: 'maintenance_due' },
            title: { type: 'string', example: 'Mantenimiento Proximo' },
            message: { type: 'string', example: 'El vehiculo ABC-123 requiere mantenimiento' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'medium' },
            is_read: { type: 'boolean', example: false },
            is_resolved: { type: 'boolean', example: false },
            entity_type: { type: 'string', example: 'vehicle' },
            entity_id: { type: 'integer', example: 1 }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            code: { type: 'string', example: '1100' },
            name: { type: 'string', example: 'Caja y Bancos' },
            type: { type: 'string', enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], example: 'asset' },
            balance: { type: 'number', example: 50000.00 },
            parent_id: { type: 'integer', example: null },
            is_active: { type: 'boolean', example: true }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            transaction_number: { type: 'string', example: 'TRX-2024-0001' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string', example: 'Pago de renta #123' },
            status: { type: 'string', enum: ['pending', 'approved', 'cancelled'], example: 'approved' },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  account_id: { type: 'integer' },
                  debit: { type: 'number' },
                  credit: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MOVICAR API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  }));

  // JSON endpoint for the spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation available at /api-docs');
};

export default swaggerSpec;
