import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem, ItemCategory } from '../../types/inventory';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface MovementTableProps {
  onViewDetails?: (item: InventoryItem) => void;
}

const MovementTable: React.FC<MovementTableProps> = ({ onViewDetails }) => {
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, rowsPerPage, filters]);

  const loadCategories = async () => {
    try {
      const response = await inventoryService.getAllCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAllItems({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
      });

      setItems(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: '#10b981',
      rented: '#3b82f6',
      maintenance: '#f59e0b',
      sold: '#8b5cf6',
      retired: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      rented: 'Rentado',
      maintenance: 'Mantenimiento',
      sold: 'Vendido',
      retired: 'Retirado',
    };
    return labels[status] || status;
  };

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre o serie..."
          size="small"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        <TextField
          select
          size="small"
          label="Categoría"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Estado"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="available">Disponible</MenuItem>
          <MenuItem value="rented">Rentado</MenuItem>
          <MenuItem value="maintenance">Mantenimiento</MenuItem>
          <MenuItem value="sold">Vendido</MenuItem>
          <MenuItem value="retired">Retirado</MenuItem>
        </TextField>
      </Box>

      {/* Tabla */}
      <TableContainer
        sx={{
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
          borderRadius: 3,
          border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Artículo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Serie</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ubicación Actual</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                  <CircularProgress size={40} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Cargando artículos...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron artículos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: isDarkMode ? '#2d2d44' : '#f8f9fa',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => onViewDetails && onViewDetails(item)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.categoryName}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {item.serialNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <LocationIcon fontSize="small" sx={{ mt: 0.5, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {item.currentLocationName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.currentLocationCity}, {item.currentLocationState}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(item.status)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(item.status),
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(item.currentValue)}
                    </Typography>
                    {item.rentalPriceDaily && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatCurrency(item.rentalPriceDaily)}/día
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails && onViewDetails(item);
                      }}
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default MovementTable;
