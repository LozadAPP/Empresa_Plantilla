/**
 * CatalogCard — Visual card for displaying a vehicle in the catalog.
 * Uses vehicle-type-based icons with semantic colors instead of photos.
 */
import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Speed as MileageIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Star as PremiumIcon,
  Settings as TransmissionIcon,
} from '@mui/icons-material';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useCurrency } from '../../contexts/CurrencyContext';
import { getVehicleTypeVisual } from '../../utils/vehicleTypeIcons';
import { Vehicle } from '../../types';

// ── Status config ─────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available:   { label: 'Disponible',    color: '#10b981' },
  rented:      { label: 'Rentado',       color: '#3b82f6' },
  maintenance: { label: 'Mantenimiento', color: '#f59e0b' },
};

const CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Regular',
  poor: 'Malo',
};

// ── Props ─────────────────────────────────────────
interface CatalogCardProps {
  vehicle: Vehicle;
  onViewDetail: (id: number) => void;
  onDownloadFicha: (id: number) => void;
  listView?: boolean;
}

const CatalogCard: React.FC<CatalogCardProps> = ({
  vehicle,
  onViewDetail,
  onDownloadFicha,
  listView = false,
}) => {
  const styles = useThemeStyles();
  const { formatCurrency } = useCurrency();
  const typeVisual = getVehicleTypeVisual(vehicle.vehicleType?.name);
  const statusCfg = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.available;

  return (
    <Box
      sx={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${styles.border.subtle}`,
        background: styles.isDarkMode ? 'rgba(6, 11, 40, 0.95)' : '#ffffff',
        boxShadow: styles.isDarkMode
          ? '0 4px 16px rgba(0, 0, 0, 0.3)'
          : '0 2px 12px rgba(0, 0, 0, 0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'pointer',
        display: listView ? 'flex' : 'block',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(typeVisual.color, 0.4),
          boxShadow: styles.isDarkMode
            ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 12px ${alpha(typeVisual.color, 0.15)}`
            : `0 8px 24px rgba(0, 0, 0, 0.1)`,
        },
      }}
      onClick={() => onViewDetail(vehicle.id)}
    >
      {/* ── Icon area ─────────────────────────────── */}
      <Box
        sx={{
          width: listView ? 160 : '100%',
          minHeight: listView ? 'auto' : 140,
          background: `linear-gradient(135deg, ${alpha(typeVisual.color, 0.15)} 0%, ${alpha(typeVisual.color, 0.05)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
          py: listView ? 2 : 3,
        }}
      >
        <typeVisual.Icon sx={{ fontSize: listView ? 48 : 64, color: typeVisual.color, opacity: 0.85 }} />
        {/* Type badge */}
        <Chip
          label={typeVisual.label}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            height: 22,
            fontSize: '0.65rem',
            fontWeight: 700,
            background: alpha(typeVisual.color, 0.2),
            color: typeVisual.color,
            border: `1px solid ${alpha(typeVisual.color, 0.3)}`,
            letterSpacing: '0.03em',
          }}
        />
        {/* Condition badge */}
        <Chip
          label={CONDITION_LABELS[vehicle.condition] || vehicle.condition}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            height: 20,
            fontSize: '0.6rem',
            fontWeight: 600,
            background: styles.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            color: styles.text.secondary,
          }}
        />
      </Box>

      {/* ── Content area ──────────────────────────── */}
      <Box sx={{ p: 2.5, flex: 1, minWidth: 0 }}>
        {/* Title */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: styles.text.headingStrong,
            lineHeight: 1.3,
            mb: 0.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {vehicle.make} {vehicle.model} {vehicle.year}
        </Typography>

        <Typography
          variant="caption"
          sx={{ color: styles.text.muted, display: 'block', mb: 1.5 }}
        >
          {vehicle.license_plate}
          {vehicle.color ? ` · ${vehicle.color}` : ''}
        </Typography>

        {/* Stats row */}
        <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.8,
              borderRadius: '10px',
              background: alpha('#10b981', 0.1),
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <MoneyIcon sx={{ fontSize: 16, color: '#10b981' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
              {formatCurrency(vehicle.daily_rate)}
            </Typography>
            <Typography variant="caption" sx={{ color: styles.text.muted, fontSize: '0.65rem' }}>
              /día
            </Typography>
          </Box>
          <Box
            sx={{
              px: 1.5,
              py: 0.8,
              borderRadius: '10px',
              background: styles.isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <MileageIcon sx={{ fontSize: 16, color: styles.text.muted }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: styles.text.primary, fontSize: '0.85rem' }}>
              {vehicle.mileage?.toLocaleString() || '0'}
            </Typography>
            <Typography variant="caption" sx={{ color: styles.text.muted, fontSize: '0.65rem' }}>
              km
            </Typography>
          </Box>
        </Stack>

        {/* Meta row: status + location + features */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            label={statusCfg.label}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              background: alpha(statusCfg.color, 0.15),
              color: statusCfg.color,
              border: `1px solid ${alpha(statusCfg.color, 0.3)}`,
            }}
          />
          {vehicle.location?.name && (
            <Chip
              icon={<LocationIcon sx={{ fontSize: '14px !important' }} />}
              label={vehicle.location.name}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 500,
                color: styles.text.secondary,
                background: 'transparent',
                border: `1px solid ${styles.border.subtle}`,
                '& .MuiChip-icon': { color: styles.text.muted },
              }}
            />
          )}
          {vehicle.is_premium && (
            <Tooltip title="Vehículo Premium" arrow>
              <Chip
                icon={<PremiumIcon sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
                label="Premium"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  background: alpha('#f59e0b', 0.1),
                  color: '#f59e0b',
                  border: `1px solid ${alpha('#f59e0b', 0.3)}`,
                }}
              />
            </Tooltip>
          )}
          {vehicle.transmission && (
            <Chip
              icon={<TransmissionIcon sx={{ fontSize: '14px !important' }} />}
              label={vehicle.transmission}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 500,
                color: styles.text.secondary,
                background: 'transparent',
                border: `1px solid ${styles.border.subtle}`,
                '& .MuiChip-icon': { color: styles.text.muted },
              }}
            />
          )}
        </Stack>

        {/* Action buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ViewIcon fontSize="small" />}
            onClick={(e) => { e.stopPropagation(); onViewDetail(vehicle.id); }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderColor: alpha(typeVisual.color, 0.4),
              color: typeVisual.color,
              '&:hover': {
                borderColor: typeVisual.color,
                background: alpha(typeVisual.color, 0.08),
              },
            }}
          >
            Ver Detalle
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PdfIcon fontSize="small" />}
            onClick={(e) => { e.stopPropagation(); onDownloadFicha(vehicle.id); }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              borderColor: alpha('#3b82f6', 0.4),
              color: '#3b82f6',
              '&:hover': {
                borderColor: '#3b82f6',
                background: alpha('#3b82f6', 0.08),
              },
            }}
          >
            Ficha PDF
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default CatalogCard;
