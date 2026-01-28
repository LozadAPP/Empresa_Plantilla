import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TextField, Select, MenuItem, FormControl,
  InputLabel, Chip, IconButton, CircularProgress, Typography, Grid
} from '@mui/material';
import { Download as DownloadIcon, Description as DocIcon } from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import inventoryService from '../../services/inventoryService';
import { InventoryMovement } from '../../types/inventory';
import { useSnackbar } from 'notistack';

interface DocumentsTableProps {
  refreshKey?: number;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ refreshKey }) => {
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [documents, setDocuments] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // Filtros
  const [filters, setFilters] = useState({
    documentType: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [page, rowsPerPage, filters, refreshKey]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAllMovements({
        page: page + 1,
        limit: rowsPerPage,
        documentGenerated: true,
        movementType: filters.documentType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        sortBy: 'movementDate',
        sortOrder: 'DESC'
      });
      setDocuments(response.data);
      setTotal(response.pagination.total);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cargar los documentos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (movement: InventoryMovement) => {
    try {
      const response = await inventoryService.downloadMovementDocument(movement.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${movement.movementNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Documento descargado exitosamente', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al descargar el documento', { variant: 'error' });
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  return (
    <Box>
      {/* Filtros */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Documento</InputLabel>
            <Select
              value={filters.documentType}
              label="Tipo de Documento"
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="entry">Entrada</MenuItem>
              <MenuItem value="exit">Salida</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Desde"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Hasta"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
              <TableCell>N° Documento</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Artículo</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell align="center">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <DocIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No hay documentos generados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.movementNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.documentType === 'entry' ? 'Entrada' : 'Salida'}
                      size="small"
                      color={doc.documentType === 'entry' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>{new Date(doc.movementDate).toLocaleDateString()}</TableCell>
                  <TableCell>{doc.itemName}</TableCell>
                  <TableCell>{doc.toLocationName || doc.fromLocationName}</TableCell>
                  <TableCell>{doc.userName}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadDocument(doc)}
                      title="Descargar PDF"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>
    </Box>
  );
};

export default DocumentsTable;
