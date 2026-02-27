/**
 * Calendar.tsx — Calendario unificado con eventos de 5 entidades
 * Sprint 13: Usa FullCalendar v6 con custom header, filter chips, dark/light mode
 */
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Button,
  Paper,
  Stack,
  Alert,
  useMediaQuery,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  DirectionsCar as RentalIcon,
  Build as MaintenanceIcon,
  RequestQuote as QuoteIcon,
  Shield as VehicleAlertIcon,
  AssignmentReturn as ReturnIcon,
  PersonSearch as LeadFollowUpIcon,
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { calendarService } from '../services/calendarService';
import {
  CalendarEvent,
  CalendarFilters,
  DEFAULT_CALENDAR_FILTERS,
  CALENDAR_COLORS,
  CALENDAR_TYPE_LABELS,
  CalendarEventType,
} from '../types/calendar';
import EventDetailPopover from '../components/calendar/EventDetailPopover';

// ── Filter chip config ───────────────────────────────
const FILTER_CHIPS: {
  key: keyof CalendarFilters;
  label: string;
  icon: React.ReactElement;
  color: string;
}[] = [
  { key: 'rental', label: 'Rentas', icon: <RentalIcon fontSize="small" />, color: CALENDAR_COLORS.rental.active },
  { key: 'maintenance', label: 'Mantenimiento', icon: <MaintenanceIcon fontSize="small" />, color: CALENDAR_COLORS.maintenance.scheduled },
  { key: 'quote', label: 'Cotizaciones', icon: <QuoteIcon fontSize="small" />, color: CALENDAR_COLORS.quote.sent },
  { key: 'vehicleAlert', label: 'Alertas Vehículos', icon: <VehicleAlertIcon fontSize="small" />, color: CALENDAR_COLORS.vehicleAlert.insurance },
  { key: 'return', label: 'Devoluciones', icon: <ReturnIcon fontSize="small" />, color: CALENDAR_COLORS.return.due },
  { key: 'leadFollowUp', label: 'Seguimientos CRM', icon: <LeadFollowUpIcon fontSize="small" />, color: CALENDAR_COLORS.leadFollowUp.new },
];

// ── View config ──────────────────────────────────────
type CalendarViewKey = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth';

interface ViewOption {
  key: CalendarViewKey;
  label: string;
  minBreakpoint: 'xs' | 'sm' | 'md';
}

const VIEW_OPTIONS: ViewOption[] = [
  { key: 'dayGridMonth', label: 'Mes', minBreakpoint: 'xs' },
  { key: 'timeGridWeek', label: 'Semana', minBreakpoint: 'sm' },
  { key: 'timeGridDay', label: 'Día', minBreakpoint: 'md' },
  { key: 'listMonth', label: 'Lista', minBreakpoint: 'xs' },
];

const Calendar: React.FC = () => {
  const theme = useTheme();
  const styles = useThemeStyles();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // ── State ──────────────────────────────────────────
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_CALENDAR_FILTERS);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentView, setCurrentView] = useState<CalendarViewKey>(
    isMobile ? 'listMonth' : 'dayGridMonth'
  );

  // Popover state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);

  // ── Refs ───────────────────────────────────────────
  const calendarRef = useRef<FullCalendar>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const currentRangeRef = useRef<{ start: string; end: string } | null>(null);

  // ── Fetch events ───────────────────────────────────
  const fetchEvents = useCallback(
    async (rangeStart: string, rangeEnd: string) => {
      setLoading(true);
      setErrors([]);
      try {
        const result = await calendarService.getEvents(rangeStart, rangeEnd, filters);
        setEvents(result.events);
        if (result.errors.length > 0) {
          setErrors(result.errors);
          result.errors.forEach((err) =>
            enqueueSnackbar(err, { variant: 'warning', autoHideDuration: 4000 })
          );
        }
      } catch {
        enqueueSnackbar('Error al cargar eventos del calendario', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [filters, enqueueSnackbar]
  );

  // ── Debounced datesSet handler ─────────────────────
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      const rangeStart = format(dateInfo.start, 'yyyy-MM-dd');
      const rangeEnd = format(dateInfo.end, 'yyyy-MM-dd');
      currentRangeRef.current = { start: rangeStart, end: rangeEnd };

      // Update title from FullCalendar's view title
      setCurrentTitle(dateInfo.view.title);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchEvents(rangeStart, rangeEnd);
      }, 300);
    },
    [fetchEvents]
  );

  // Re-fetch when filters change (if we have a range)
  useEffect(() => {
    if (currentRangeRef.current) {
      fetchEvents(currentRangeRef.current.start, currentRangeRef.current.end);
    }
  }, [filters, fetchEvents]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Navigation handlers ────────────────────────────
  const handlePrev = useCallback(() => {
    calendarRef.current?.getApi().prev();
  }, []);

  const handleNext = useCallback(() => {
    calendarRef.current?.getApi().next();
  }, []);

  const handleToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);

  const handleViewChange = useCallback((viewKey: CalendarViewKey) => {
    setCurrentView(viewKey);
    calendarRef.current?.getApi().changeView(viewKey);
  }, []);

  // ── Filter toggle ──────────────────────────────────
  const toggleFilter = useCallback((key: keyof CalendarFilters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Event click → popover ──────────────────────────
  const handleEventClick = useCallback((info: EventClickArg) => {
    info.jsEvent.preventDefault();
    const fcEvent = info.event;
    const calEvent = events.find((e) => e.id === fcEvent.id);
    if (calEvent) {
      setSelectedEvent(calEvent);
      setPopoverAnchor(info.el);
    }
  }, [events]);

  const handleClosePopover = useCallback(() => {
    setSelectedEvent(null);
    setPopoverAnchor(null);
  }, []);

  const handleNavigateToEntity = useCallback(
    (path: string) => {
      handleClosePopover();
      navigate(path);
    },
    [navigate, handleClosePopover]
  );

  // ── Available views based on screen size ───────────
  const availableViews = useMemo(() => {
    if (isMobile) return VIEW_OPTIONS.filter((v) => v.minBreakpoint === 'xs');
    if (isTablet) return VIEW_OPTIONS.filter((v) => v.minBreakpoint !== 'md');
    return VIEW_OPTIONS;
  }, [isMobile, isTablet]);

  // ── FullCalendar CSS variable overrides ────────────
  const calendarSx = useMemo(
    () => ({
      position: 'relative',

      // FullCalendar CSS variable overrides for dark/light mode
      '--fc-border-color': styles.border.default,
      '--fc-today-bg-color': styles.isDarkMode
        ? 'rgba(0, 117, 255, 0.08)'
        : 'rgba(0, 117, 255, 0.04)',
      '--fc-page-bg-color': 'transparent',
      '--fc-neutral-bg-color': styles.isDarkMode
        ? 'rgba(255, 255, 255, 0.03)'
        : 'rgba(0, 0, 0, 0.02)',
      '--fc-list-event-hover-bg-color': styles.isDarkMode
        ? 'rgba(0, 117, 255, 0.12)'
        : 'rgba(0, 117, 255, 0.06)',
      '--fc-highlight-color': styles.isDarkMode
        ? 'rgba(0, 117, 255, 0.15)'
        : 'rgba(0, 117, 255, 0.08)',

      // Column headers
      '& .fc-col-header-cell': {
        background: styles.isDarkMode
          ? 'rgba(0, 117, 255, 0.06)'
          : 'rgba(0, 117, 255, 0.03)',
        borderBottom: `1px solid ${styles.border.default}`,
      },
      '& .fc-col-header-cell-cushion': {
        color: styles.text.secondary,
        fontWeight: 600,
        fontSize: '0.8rem',
        textTransform: 'uppercase' as const,
        py: 1,
      },

      // Day numbers
      '& .fc-daygrid-day-number': {
        color: styles.text.secondary,
        fontSize: '0.85rem',
        fontWeight: 500,
        padding: '4px 8px',
      },
      '& .fc-day-today .fc-daygrid-day-number': {
        color: '#0075ff',
        fontWeight: 700,
      },

      // Event pills
      '& .fc-event': {
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 500,
        px: 0.5,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: styles.isDarkMode
            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
      '& .fc-daygrid-event': {
        borderLeft: '3px solid',
        borderLeftColor: 'inherit',
      },

      // More events link
      '& .fc-daygrid-more-link': {
        color: styles.primary.main,
        fontWeight: 600,
        fontSize: '0.75rem',
      },

      // List view
      '& .fc-list': {
        border: 'none',
      },
      '& .fc-list-day-cushion': {
        background: styles.isDarkMode
          ? 'rgba(0, 117, 255, 0.08)'
          : 'rgba(0, 117, 255, 0.04)',
      },
      '& .fc-list-day-text, & .fc-list-day-side-text': {
        color: styles.text.primary,
        fontWeight: 600,
      },
      '& .fc-list-event td': {
        borderColor: styles.border.subtle,
      },
      '& .fc-list-event-title a': {
        color: styles.text.primary,
      },
      '& .fc-list-event-dot': {
        borderRadius: '50%',
      },

      // Time grid
      '& .fc-timegrid-slot-label-cushion': {
        color: styles.text.muted,
        fontSize: '0.75rem',
      },
      '& .fc-timegrid-axis-cushion': {
        color: styles.text.muted,
      },

      // Scrollbar
      '& .fc-scroller::-webkit-scrollbar': {
        width: '6px',
      },
      '& .fc-scroller::-webkit-scrollbar-thumb': {
        background: styles.isDarkMode
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.15)',
        borderRadius: '3px',
      },
    }),
    [styles]
  );

  // ── Render ─────────────────────────────────────────
  return (
    <Box sx={{ ...styles.responsive.pagePadding }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: styles.glass.background,
          backdropFilter: styles.glass.blur,
          border: `1px solid ${styles.glass.border}`,
          borderRadius: '16px',
          p: { xs: 2, sm: 3 },
          mb: 3,
        }}
      >
        {/* Title Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          mb={2}
        >
          {/* Left: Icon + Navigation */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarIcon sx={{ color: styles.primary.main, fontSize: 28 }} />
            <IconButton onClick={handlePrev} size="small" sx={{ color: styles.text.secondary }}>
              <PrevIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                color: styles.text.headingStrong,
                fontWeight: 700,
                minWidth: { xs: 'auto', sm: '200px' },
                textAlign: 'center',
                textTransform: 'capitalize',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              {currentTitle}
            </Typography>
            <IconButton onClick={handleNext} size="small" sx={{ color: styles.text.secondary }}>
              <NextIcon />
            </IconButton>
            <Tooltip title="Ir a hoy">
              <Button
                variant="outlined"
                size="small"
                onClick={handleToday}
                startIcon={<TodayIcon />}
                sx={{
                  borderRadius: '10px',
                  borderColor: styles.border.default,
                  color: styles.text.secondary,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: styles.primary.main,
                    color: styles.primary.main,
                    background: styles.primary.background,
                  },
                }}
              >
                Hoy
              </Button>
            </Tooltip>
          </Stack>

          {/* Right: View Switcher */}
          <Stack direction="row" spacing={0.5}>
            {availableViews.map((view) => (
              <Chip
                key={view.key}
                label={view.label}
                size="small"
                onClick={() => handleViewChange(view.key)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  background:
                    currentView === view.key
                      ? styles.primary.main
                      : styles.isDarkMode
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  color:
                    currentView === view.key ? '#ffffff' : styles.text.secondary,
                  border: `1px solid ${
                    currentView === view.key
                      ? styles.primary.main
                      : styles.border.subtle
                  }`,
                  '&:hover': {
                    background:
                      currentView === view.key
                        ? styles.primary.main
                        : styles.primary.background,
                  },
                }}
              />
            ))}
          </Stack>
        </Stack>

        {/* Filter Chips */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-thumb': {
              background: styles.isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '2px',
            },
          }}
        >
          {FILTER_CHIPS.map((chip) => {
            const active = filters[chip.key];
            return (
              <Chip
                key={chip.key}
                icon={chip.icon}
                label={chip.label}
                size="small"
                onClick={() => toggleFilter(chip.key)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: active
                    ? alpha(chip.color, styles.isDarkMode ? 0.2 : 0.12)
                    : styles.isDarkMode
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(0, 0, 0, 0.03)',
                  color: active ? chip.color : styles.text.muted,
                  border: `1px solid ${
                    active ? alpha(chip.color, 0.5) : styles.border.subtle
                  }`,
                  '& .MuiChip-icon': {
                    color: active ? chip.color : styles.text.muted,
                  },
                  '&:hover': {
                    background: alpha(chip.color, styles.isDarkMode ? 0.15 : 0.08),
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {/* Error alerts */}
      {errors.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: '12px' }}
          onClose={() => setErrors([])}
        >
          Algunos datos no se pudieron cargar: {errors.join(', ')}
        </Alert>
      )}

      {/* Calendar */}
      <Paper
        elevation={0}
        sx={{
          background: styles.glass.background,
          backdropFilter: styles.glass.blur,
          border: `1px solid ${styles.glass.border}`,
          borderRadius: '16px',
          p: { xs: 1, sm: 2 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: styles.isDarkMode
                ? 'rgba(6, 11, 40, 0.6)'
                : 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
            }}
          >
            <CircularProgress size={40} sx={{ color: styles.primary.main }} />
          </Box>
        )}

        {/* FullCalendar component */}
        <Box sx={calendarSx}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={isMobile ? 'listMonth' : 'dayGridMonth'}
            locale="es"
            headerToolbar={false}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            nowIndicator={true}
            weekends={true}
            fixedWeekCount={false}
            stickyHeaderDates={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false,
            }}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              list: 'Lista',
            }}
            noEventsContent={() => (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CalendarIcon
                  sx={{ fontSize: 48, color: styles.text.muted, mb: 1 }}
                />
                <Typography variant="body2" sx={{ color: styles.text.muted }}>
                  No hay eventos en este período
                </Typography>
              </Box>
            )}
          />
        </Box>
      </Paper>

      {/* Event Detail Popover */}
      <EventDetailPopover
        event={selectedEvent}
        anchorEl={popoverAnchor}
        onClose={handleClosePopover}
        onNavigate={handleNavigateToEntity}
      />
    </Box>
  );
};

export default Calendar;
