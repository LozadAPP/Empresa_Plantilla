import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { LocationProvider } from './contexts/LocationContext';

// Loading component for Suspense fallback
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Lazy loaded pages - Public
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Lazy loaded pages - Dashboard & Core
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));

// Lazy loaded pages - Calendario + Cotizaciones + Catálogo + Prospectos (Ventas)
const Calendar = lazy(() => import('./pages/Calendar'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Quotes = lazy(() => import('./pages/Quotes'));
const QuoteForm = lazy(() => import('./pages/QuoteForm'));
const QuoteDetail = lazy(() => import('./pages/QuoteDetail'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadForm = lazy(() => import('./pages/LeadForm'));
const LeadDetail = lazy(() => import('./pages/LeadDetail'));

// Lazy loaded pages - Gastos y Proveedores (Finanzas)
const Expenses = lazy(() => import('./pages/Expenses'));
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const SupplierForm = lazy(() => import('./pages/SupplierForm'));
const SupplierDetail = lazy(() => import('./pages/SupplierDetail'));

// Lazy loaded pages - CHAT 2: Flujo Operacional
const Rentals = lazy(() => import('./pages/Rentals'));
const RentalForm = lazy(() => import('./pages/RentalForm'));
const RentalDetail = lazy(() => import('./pages/RentalDetail'));
const ReturnForm = lazy(() => import('./pages/ReturnForm'));
const Returns = lazy(() => import('./pages/Returns'));
const Payments = lazy(() => import('./pages/Payments'));
const PaymentForm = lazy(() => import('./pages/PaymentForm'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));

// Lazy loaded pages - CHAT 3: Administración + Reportes
const Maintenance = lazy(() => import('./pages/Maintenance'));
const MaintenanceForm = lazy(() => import('./pages/MaintenanceForm'));
const Reports = lazy(() => import('./pages/Reports'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Accounting = lazy(() => import('./pages/Accounting'));
const TransactionForm = lazy(() => import('./pages/TransactionForm'));
const Settings = lazy(() => import('./pages/Settings'));
const PricingConfig = lazy(() => import('./pages/PricingConfig'));
const Users = lazy(() => import('./pages/Users'));
const Locations = lazy(() => import('./pages/Locations'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const ExtraServiceForm = lazy(() => import('./pages/ExtraServiceForm'));
const Documents = lazy(() => import('./pages/Documents'));

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <LocationProvider>
                  <NotificationProvider>
                    <Layout />
                  </NotificationProvider>
                </LocationProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/:id" element={<VehicleDetail />} />
            <Route path="/inventory-management" element={<InventoryManagement />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Calendario + Catálogo + Cotizaciones (Ventas) */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<QuoteForm />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/quotes/:id/edit" element={<QuoteForm />} />

            {/* CRM: Prospectos */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/new" element={<LeadForm />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/leads/:id/edit" element={<LeadForm />} />

            {/* CHAT 2: Flujo Operacional */}
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/rentals/new" element={<RentalForm />} />
            <Route path="/rentals/:id" element={<RentalDetail />} />
            <Route path="/returns/new" element={<ReturnForm />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/new" element={<PaymentForm />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />

            {/* Gastos y Proveedores (Finanzas) */}
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/new" element={<ExpenseForm />} />
            <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/new" element={<SupplierForm />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/suppliers/:id/edit" element={<SupplierForm />} />

            {/* CHAT 3: Administración + Reportes */}
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/maintenance/new" element={<MaintenanceForm />} />
            <Route path="/maintenance/:id/edit" element={<MaintenanceForm />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/accounting" element={<Accounting />} />
            <Route path="/accounting/transaction/new" element={<TransactionForm />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/pricing/new" element={<PricingConfig />} />
            <Route path="/settings/pricing/:id/edit" element={<PricingConfig />} />
            <Route path="/settings/extra-services/new" element={<ExtraServiceForm />} />
            <Route path="/settings/extra-services/:id/edit" element={<ExtraServiceForm />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings/locations" element={<Locations />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
