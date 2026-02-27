import { Router } from 'express';
import authRoutes from './auth';
import dashboardRoutes from './dashboard';
import vehicleRoutes from './vehicles';
import customerRoutes from './customers';
import rentalRoutes from './rentalRoutes';
import returnRoutes from './returnRoutes';
import paymentRoutes, { invoiceRouter } from './paymentRoutes';
import maintenanceRoutes from './maintenance';
import accountingRoutes from './accounting';
import alertRoutes from './alerts';
import configRoutes from './config';
import reportRoutes from './reports';
import inventoryRoutes from './inventory';
import userRoutes from './users';
import locationRoutes from './locations';
import auditRoutes from './audit';
import extraServiceRoutes from './extraServices';
import quoteRoutes from './quoteRoutes';
import expenseRoutes from './expenseRoutes';
import supplierRoutes from './supplierRoutes';
import documentRoutes from './documentRoutes';
import leadRoutes from './leadRoutes';
import cfdiRoutes from './cfdiRoutes';

const router = Router();

// API Routes - CHAT 1 (Core)
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/customers', customerRoutes);

// API Routes - VENTAS (Cotizaciones & Rentas)
router.use('/quotes', quoteRoutes);
router.use('/rentals', rentalRoutes);
router.use('/returns', returnRoutes);
router.use('/payments', paymentRoutes);
router.use('/invoices', invoiceRouter);

// API Routes - CHAT 3 (Administration + Reports)
router.use('/maintenance', maintenanceRoutes);
router.use('/accounting', accountingRoutes);
router.use('/alerts', alertRoutes);
router.use('/config', configRoutes);
router.use('/reports', reportRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/audit', auditRoutes);
router.use('/extra-services', extraServiceRoutes);

// API Routes - FINANZAS (Gastos y Proveedores)
router.use('/expenses', expenseRoutes);
router.use('/suppliers', supplierRoutes);

// API Routes - CRM (Prospectos)
router.use('/leads', leadRoutes);

// API Routes - DOCUMENTOS
router.use('/documents', documentRoutes);

// API Routes - CFDI (Facturación Electrónica)
router.use('/cfdi', cfdiRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MOVICAR API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
