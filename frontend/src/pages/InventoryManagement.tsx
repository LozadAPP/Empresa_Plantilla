import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as EntryIcon,
  TrendingDown as ExitIcon,
  Build as MaintenanceIcon,
  Description as DocumentIcon,
  Map as MapIcon,
  History as HistoryIcon,
  MoveToInbox as MovementsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { StyledKPI } from '../components/styled';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useSnackbar } from 'notistack';
import inventoryService from '../services/inventoryService';
import MovementTable from '../components/inventory/MovementTable';
import MovementForm from '../components/inventory/MovementForm';
import ItemDetailsModal from '../components/inventory/ItemDetailsModal';
import MapView from '../components/inventory/MapView';
import DocumentsTable from '../components/inventory/DocumentsTable';
import MovementHistoryTable from '../components/inventory/MovementHistoryTable';
import { InventoryItem } from '../types/inventory';

const InventoryManagement: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [currentTab, setCurrentTab] = useState(0);

  // Estados para modales
  const [movementFormOpen, setMovementFormOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para KPIs con datos reales del backend
  const [kpiData, setKpiData] = useState({
    totalItems: 0,
    inWarehouse: 0,
    rented: 0,
    maintenance: 0,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  // Cargar KPIs del backend
  useEffect(() => {
    loadKpis();
  }, []);

  const loadKpis = async () => {
    setLoadingKpis(true);
    try {
      const response = await inventoryService.getInventoryStats();
      setKpiData({
        totalItems: response.data.totalItems,
        inWarehouse: response.data.inWarehouse,
        rented: response.data.rented,
        maintenance: response.data.maintenance,
      });
    } catch (error: any) {
      console.error('Error loading KPIs:', error);
      enqueueSnackbar(error?.response?.data?.message || 'Error al cargar las estadísticas', { variant: 'error' });
    } finally {
      setLoadingKpis(false);
    }
  };

  // Handlers
  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setDetailsModalOpen(true);
  };

  const handleNewMovement = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setMovementFormOpen(true);
  };

  const handleMovementSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setMovementFormOpen(false);
    loadKpis(); // Recargar KPIs después de crear movimiento
    enqueueSnackbar('Movimiento creado exitosamente', { variant: 'success' });
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedItem(null);
  };

  const handleNewMovementFromDetails = (item: InventoryItem) => {
    setDetailsModalOpen(false);
    setSelectedItem(item);
    setMovementFormOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Gestión de Inventario
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Control de movimientos y ubicación de artículos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleNewMovement()}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            backgroundColor: '#8b5cf6',
            '&:hover': {
              backgroundColor: '#7c3aed',
            },
          }}
        >
          Nuevo Movimiento
        </Button>
      </Box>

      {/* KPIs - 4 Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 4,
        }}
      >
        {loadingKpis ? (
          // Mostrar loading state en cada KPI
          <>
            {[1, 2, 3, 4].map((index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
                  border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 120,
                }}
              >
                <CircularProgress size={32} sx={{ color: '#8b5cf6' }} />
              </Paper>
            ))}
          </>
        ) : (
          // Mostrar KPIs con datos reales
          <>
            {/* KPI 1: Total de Artículos */}
            <StyledKPI
              icon={<InventoryIcon />}
              label="Total de Artículos"
              value={kpiData.totalItems}
              subtitle="en el sistema"
              color="#8b5cf6"
            />

            {/* KPI 2: En Almacén */}
            <StyledKPI
              icon={<EntryIcon />}
              label="En Almacén"
              value={kpiData.inWarehouse}
              subtitle="disponibles"
              color="#10b981"
            />

            {/* KPI 3: Rentados/En Campo */}
            <StyledKPI
              icon={<ExitIcon />}
              label="Rentados"
              value={kpiData.rented}
              subtitle="en campo"
              color="#3b82f6"
            />

            {/* KPI 4: Mantenimiento */}
            <StyledKPI
              icon={<MaintenanceIcon />}
              label="Mantenimiento"
              value={kpiData.maintenance}
              subtitle="en servicio"
              color="#f59e0b"
            />
          </>
        )}
      </Box>

      {/* Tabs Section */}
      <Paper
        sx={{
          borderRadius: 3,
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
        }}
      >
        {/* Tab Headers */}
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            pt: 2,
          }}
        >
          <Tab
            icon={<MovementsIcon />}
            label="Movimientos"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<DocumentIcon />}
            label="Documentos"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<MapIcon />}
            label="Mapa"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<HistoryIcon />}
            label="Historial"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {/* Tab 0: Movimientos */}
          {currentTab === 0 && (
            <MovementTable key={refreshKey} onViewDetails={handleViewDetails} />
          )}

          {/* Tab 1: Documentos */}
          {currentTab === 1 && (
            <DocumentsTable key={refreshKey} />
          )}

          {/* Tab 2: Mapa */}
          {currentTab === 2 && (
            <MapView onViewDetails={handleViewDetails} />
          )}

          {/* Tab 3: Historial */}
          {currentTab === 3 && (
            <MovementHistoryTable
              key={refreshKey}
              onViewDetails={(itemId) => {
                // Fetch item by ID and open details modal
                inventoryService.getItemById(itemId).then(response => {
                  handleViewDetails(response.data);
                }).catch(error => {
                  console.error('Error loading item:', error);
                });
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Modales */}
      <MovementForm
        open={movementFormOpen}
        onClose={() => setMovementFormOpen(false)}
        onSuccess={handleMovementSuccess}
        preselectedItem={selectedItem}
      />

      <ItemDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetails}
        item={selectedItem}
        onNewMovement={handleNewMovementFromDetails}
      />
    </Box>
  );
};

export default InventoryManagement;
