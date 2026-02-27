/**
 * EventDetailPopover — Detalle de evento al hacer clic en el calendario
 * Desktop: Popover anclado al evento
 * Mobile: Dialog (bottom sheet) para evitar overflow
 */
import React from 'react';
import {
  Popover,
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Stack,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenIcon,
  DirectionsCar as RentalIcon,
  Build as MaintenanceIcon,
  RequestQuote as QuoteIcon,
  Shield as VehicleAlertIcon,
  AssignmentReturn as ReturnIcon,
  PersonSearch as LeadFollowUpIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  AttachMoney as MoneyIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useCurrency } from '../../contexts/CurrencyContext';
import { formatDate } from '../../utils/formatters';
import { CalendarEvent, CalendarEventType, CALENDAR_TYPE_LABELS } from '../../types/calendar';

// ── Icon map ─────────────────────────────────────────
const TYPE_ICONS: Record<CalendarEventType, React.ReactElement> = {
  rental: <RentalIcon />,
  maintenance: <MaintenanceIcon />,
  quote: <QuoteIcon />,
  vehicle_alert: <VehicleAlertIcon />,
  return: <ReturnIcon />,
  lead_follow_up: <LeadFollowUpIcon />,
};

// ── Status labels (Spanish) ──────────────────────────
const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  reserved: 'Reservada',
  overdue: 'Vencida',
  pending_approval: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
  scheduled: 'Programado',
  in_progress: 'En Progreso',
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
  converted: 'Convertida',
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

// ── Detail row component ─────────────────────────────
const DetailRow: React.FC<{
  icon: React.ReactElement;
  label: string;
  value: React.ReactNode;
  color?: string;
}> = ({ icon, label, value, color }) => {
  const styles = useThemeStyles();
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
      <Box sx={{ color: color || styles.text.muted, mt: 0.2, '& > svg': { fontSize: 18 } }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ color: styles.text.muted, display: 'block', fontSize: '0.7rem', lineHeight: 1.3 }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: styles.text.primary, fontWeight: 500, wordBreak: 'break-word' }}
        >
          {value || 'N/A'}
        </Typography>
      </Box>
    </Stack>
  );
};

// ── Props ────────────────────────────────────────────
interface EventDetailPopoverProps {
  event: CalendarEvent | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const EventDetailPopover: React.FC<EventDetailPopoverProps> = ({
  event,
  anchorEl,
  onClose,
  onNavigate,
}) => {
  const theme = useTheme();
  const styles = useThemeStyles();
  const { formatCurrency } = useCurrency();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!event) return null;

  const { type, color, metadata, entityPath } = event;
  const typeLabel = CALENDAR_TYPE_LABELS[type];
  const typeIcon = TYPE_ICONS[type];

  // ── Build content based on event type ──────────────
  const renderContent = () => {
    switch (type) {
      case 'rental':
        return (
          <>
            {metadata.status && (
              <DetailRow
                icon={<TagIcon />}
                label="Estado"
                value={
                  <Chip
                    label={STATUS_LABELS[metadata.status] || metadata.status}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: alpha(color, 0.15),
                      color: color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                }
              />
            )}
            {metadata.customerName && (
              <DetailRow icon={<PersonIcon />} label="Cliente" value={metadata.customerName} />
            )}
            {metadata.vehicleName && (
              <DetailRow
                icon={<RentalIcon />}
                label="Vehículo"
                value={`${metadata.vehicleName}${metadata.licensePlate ? ` (${metadata.licensePlate})` : ''}`}
              />
            )}
            {metadata.startDate && (
              <DetailRow icon={<DateIcon />} label="Inicio" value={formatDate(metadata.startDate)} />
            )}
            {metadata.endDate && (
              <DetailRow icon={<DateIcon />} label="Fin" value={formatDate(metadata.endDate)} />
            )}
            {metadata.days && (
              <DetailRow icon={<DateIcon />} label="Días" value={`${metadata.days} días`} />
            )}
            {metadata.dailyRate && (
              <DetailRow icon={<MoneyIcon />} label="Tarifa diaria" value={formatCurrency(metadata.dailyRate)} />
            )}
            {metadata.totalAmount && (
              <DetailRow icon={<MoneyIcon />} label="Total" value={formatCurrency(metadata.totalAmount)} color="#10b981" />
            )}
          </>
        );

      case 'maintenance':
        return (
          <>
            {metadata.status && (
              <DetailRow
                icon={<TagIcon />}
                label="Estado"
                value={
                  <Chip
                    label={STATUS_LABELS[metadata.status] || metadata.status}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: alpha(color, 0.15),
                      color: color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                }
              />
            )}
            {metadata.priority && (
              <DetailRow
                icon={<TagIcon />}
                label="Prioridad"
                value={
                  <Chip
                    label={STATUS_LABELS[metadata.priority] || metadata.priority}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: alpha(color, 0.15),
                      color: color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                }
              />
            )}
            {metadata.vehicleName && (
              <DetailRow
                icon={<RentalIcon />}
                label="Vehículo"
                value={`${metadata.vehicleName}${metadata.licensePlate ? ` (${metadata.licensePlate})` : ''}`}
              />
            )}
            {metadata.typeName && (
              <DetailRow icon={<MaintenanceIcon />} label="Tipo" value={metadata.typeName} />
            )}
            {metadata.workshopName && (
              <DetailRow icon={<MaintenanceIcon />} label="Taller" value={metadata.workshopName} />
            )}
            {metadata.technicianName && (
              <DetailRow icon={<PersonIcon />} label="Técnico" value={metadata.technicianName} />
            )}
            {metadata.scheduledDate && (
              <DetailRow icon={<DateIcon />} label="Fecha programada" value={formatDate(metadata.scheduledDate)} />
            )}
          </>
        );

      case 'quote':
        return (
          <>
            {metadata.status && (
              <DetailRow
                icon={<TagIcon />}
                label="Estado"
                value={
                  <Chip
                    label={STATUS_LABELS[metadata.status] || metadata.status}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: alpha(color, 0.15),
                      color: color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                }
              />
            )}
            {metadata.customerName && (
              <DetailRow icon={<PersonIcon />} label="Cliente" value={metadata.customerName} />
            )}
            {metadata.vehicleName && (
              <DetailRow icon={<RentalIcon />} label="Vehículo" value={metadata.vehicleName} />
            )}
            {metadata.totalAmount && (
              <DetailRow icon={<MoneyIcon />} label="Total" value={formatCurrency(metadata.totalAmount)} color="#10b981" />
            )}
            {metadata.validUntil && (
              <DetailRow icon={<DateIcon />} label="Válida hasta" value={formatDate(metadata.validUntil)} color="#f59e0b" />
            )}
          </>
        );

      case 'vehicle_alert':
        return (
          <>
            <DetailRow
              icon={<VehicleAlertIcon />}
              label="Tipo de alerta"
              value={
                metadata.alertType === 'insurance_expiry'
                  ? 'Vencimiento de Seguro'
                  : 'Mantenimiento Programado'
              }
              color="#ef4444"
            />
            {metadata.vehicleName && (
              <DetailRow
                icon={<RentalIcon />}
                label="Vehículo"
                value={`${metadata.vehicleName}${metadata.licensePlate ? ` (${metadata.licensePlate})` : ''}`}
              />
            )}
            {metadata.expiryDate && (
              <DetailRow icon={<DateIcon />} label="Fecha de vencimiento" value={formatDate(metadata.expiryDate)} color="#ef4444" />
            )}
            {metadata.maintenanceDate && (
              <DetailRow icon={<DateIcon />} label="Fecha de mantenimiento" value={formatDate(metadata.maintenanceDate)} color="#f97316" />
            )}
          </>
        );

      case 'return':
        return (
          <>
            {metadata.status && (
              <DetailRow
                icon={<TagIcon />}
                label="Estado de renta"
                value={
                  <Chip
                    label={STATUS_LABELS[metadata.status] || metadata.status}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: alpha(color, 0.15),
                      color: color,
                      border: `1px solid ${alpha(color, 0.3)}`,
                    }}
                  />
                }
              />
            )}
            {metadata.customerName && (
              <DetailRow icon={<PersonIcon />} label="Cliente" value={metadata.customerName} />
            )}
            {metadata.vehicleName && (
              <DetailRow
                icon={<RentalIcon />}
                label="Vehículo"
                value={`${metadata.vehicleName}${metadata.licensePlate ? ` (${metadata.licensePlate})` : ''}`}
              />
            )}
            {metadata.endDate && (
              <DetailRow icon={<DateIcon />} label="Devolución esperada" value={formatDate(metadata.endDate)} color="#06b6d4" />
            )}
          </>
        );

      default:
        return null;
    }
  };

  // ── Shared inner content ───────────────────────────
  const innerContent = (
    <Box sx={{ width: isMobile ? '100%' : 340, maxWidth: '100%' }}>
      {/* Header with color bar */}
      <Box
        sx={{
          borderTop: `4px solid ${color}`,
          px: 2.5,
          pt: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: alpha(color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              flexShrink: 0,
              '& > svg': { fontSize: 20 },
            }}
          >
            {typeIcon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: color,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                letterSpacing: '0.05em',
              }}
            >
              {typeLabel}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: styles.text.headingStrong,
                fontWeight: 700,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.title.replace(/^[^\w]+ /, '')}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: styles.text.muted, mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: styles.border.subtle }} />

      {/* Metadata */}
      <Box sx={{ px: 2.5, py: 2 }}>
        {renderContent()}
      </Box>

      <Divider sx={{ borderColor: styles.border.subtle }} />

      {/* Action button */}
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="small"
          endIcon={<OpenIcon fontSize="small" />}
          onClick={() => onNavigate(entityPath)}
          sx={{
            borderRadius: '10px',
            borderColor: alpha(color, 0.4),
            color: color,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            '&:hover': {
              borderColor: color,
              background: alpha(color, 0.08),
            },
          }}
        >
          {type === 'rental'
            ? 'Ver Renta'
            : type === 'maintenance'
            ? 'Ver Mantenimiento'
            : type === 'quote'
            ? 'Ver Cotización'
            : type === 'vehicle_alert'
            ? 'Ver Vehículo'
            : 'Ver Renta'}
        </Button>
      </Box>
    </Box>
  );

  // ── Mobile: Dialog | Desktop: Popover ──────────────
  if (isMobile) {
    return (
      <Dialog
        open={!!event}
        onClose={onClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: styles.glass.backgroundSolid,
            borderRadius: '16px',
            border: `1px solid ${styles.glass.border}`,
            m: 2,
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>{innerContent}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover
      open={!!event && !!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            background: styles.glass.backgroundSolid,
            borderRadius: '16px',
            border: `1px solid ${styles.glass.border}`,
            boxShadow: styles.shadow.elevated,
            overflow: 'hidden',
          },
        },
      }}
    >
      {innerContent}
    </Popover>
  );
};

export default EventDetailPopover;
