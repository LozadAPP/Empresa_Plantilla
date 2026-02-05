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

const router = Router();

// API Routes - CHAT 1 (Core)
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/customers', customerRoutes);

// API Routes - CHAT 2 (Rentals & Operations)
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

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MOVICAR API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;
