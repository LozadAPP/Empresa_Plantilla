/**
 * Componente RentalTable - Tabla de rentas (CHAT 2)
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Assignment as RentalsIcon
} from '@mui/icons-material';
import RentalStatusChip from './RentalStatusChip';
import { Rental } from '../../types/rental';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface RentalTableProps {
  rentals: Rental[];
  loading?: boolean;
  pagination?: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  onEdit?: (rental: Rental) => void;
  onCancel?: (rental: Rental) => void;
}

const RentalTable: React.FC<RentalTableProps> = ({
  rentals,
  loading: _loading = false,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onCancel
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, rental: Rental) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRental(rental);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRental(null);
  };

  const handleView = () => {
    if (selectedRental) {
      navigate(`/rentals/${selectedRental.id}`);
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedRental && onEdit) {
      onEdit(selectedRental);
    }
    handleMenuClose();
  };

  const handleCancel = () => {
    if (selectedRental && onCancel) {
      onCancel(selectedRental);
    }
    handleMenuClose();
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Vehículo</strong></TableCell>
              <TableCell><strong>Fechas</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <RentalsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay rentas registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea una nueva renta para empezar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rentals.map((rental) => (
                <TableRow
                  key={rental.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/rentals/${rental.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {rental.rental_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rental.customer?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.customer?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rental.vehicle?.make} {rental.vehicle?.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.vehicle?.license_plate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(rental.start_date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(rental.end_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrency(rental.total_amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.days} días
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <RentalStatusChip status={rental.status} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, rental)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" /> Ver Detalles
        </MenuItem>
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" /> Editar
          </MenuItem>
        )}
        {onCancel && selectedRental?.status === 'active' && (
          <MenuItem onClick={handleCancel}>
            <CancelIcon sx={{ mr: 1 }} fontSize="small" /> Cancelar
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default RentalTable;
