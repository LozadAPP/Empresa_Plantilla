import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  OVERLAY_MOUSE_TARGET,
} from '@react-google-maps/api';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Build as MaintenanceIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { InventoryItem, ItemCategory } from '../../types';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Centro de México por defecto
const defaultCenter = {
  lat: 23.6345,
  lng: -102.5528,
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '24px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  gestureHandling: 'cooperative', // Requires Ctrl+scroll to zoom, or click to activate
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// Función auxiliar para obtener color basado en PROXIMIDAD DE MANTENIMIENTO
const getMaintenanceProximityColor = (nextMaintenanceDate?: Date | string): { color: string; status: 'ok' | 'warning' | 'urgent' | 'unknown' } => {
  if (!nextMaintenanceDate) {
    return { color: '#6b7280', status: 'unknown' }; // Gris - Sin fecha programada
  }

  const now = new Date();
  const maintenanceDate = new Date(nextMaintenanceDate);
  const diffTime = maintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // Mantenimiento VENCIDO
    return { color: '#ef4444', status: 'urgent' }; // Rojo
  } else if (diffDays <= 7) {
    // Mantenimiento en menos de 7 días - URGENTE
    return { color: '#ef4444', status: 'urgent' }; // Rojo
  } else if (diffDays <= 30) {
    // Mantenimiento en 7-30 días - ADVERTENCIA
    return { color: '#f59e0b', status: 'warning' }; // Amarillo/Naranja
  } else {
    // Mantenimiento en más de 30 días - OK
    return { color: '#10b981', status: 'ok' }; // Verde
  }
};

// Función para obtener etiqueta de proximidad de mantenimiento
const getMaintenanceLabel = (nextMaintenanceDate?: Date | string): string => {
  if (!nextMaintenanceDate) {
    return 'Sin programar';
  }

  const now = new Date();
  const maintenanceDate = new Date(nextMaintenanceDate);
  const diffTime = maintenanceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Vencido hace ${Math.abs(diffDays)} días`;
  } else if (diffDays === 0) {
    return 'Vence hoy';
  } else if (diffDays === 1) {
    return 'Vence mañana';
  } else if (diffDays <= 7) {
    return `Vence en ${diffDays} días`;
  } else if (diffDays <= 30) {
    return `Vence en ${diffDays} días`;
  } else {
    return `Vence en ${diffDays} días`;
  }
};

// Mantener la función original para el status del chip en InfoWindow
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return '#10b981'; // Green
    case 'rented':
      return '#f59e0b'; // Orange
    case 'maintenance':
      return '#ef4444'; // Red
    case 'sold':
      return '#6b7280'; // Gray
    default:
      return '#8b5cf6'; // Purple
  }
};

interface InventoryMapProps {
  items: InventoryItem[];
  categories: ItemCategory[];
  onItemClick?: (item: InventoryItem) => void;
  selectedItem?: InventoryItem | null;
}

const InventoryMap: React.FC<InventoryMapProps> = ({
  items,
  categories,
  onItemClick,
  selectedItem: externalSelectedItem,
}) => {
  const theme = useTheme();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);
  // CAMBIO CRÍTICO: Usar useRef en lugar de useState para evitar re-renders
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Los items ya vienen filtrados desde el componente padre
  const filteredItems = items;

  // FUNCIÓN PARA AJUSTAR BOUNDS - Reutilizable
  const adjustMapBounds = useCallback((map: google.maps.Map, items: InventoryItem[]) => {
    if (!map || items.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    items.forEach((item) => {
      const position = {
        lat: item.currentLocationCoordinates.lat,
        lng: item.currentLocationCoordinates.lng,
      };
      bounds.extend(position);
    });

    // Ajustar bounds con padding generoso
    map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });

    // Forzar un zoom apropiado después de fitBounds
    setTimeout(() => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 12) {
        map.setZoom(12);
      }
    }, 100);
  }, []);

  // EFECTO: Ajustar bounds cuando cambian los items filtrados
  useEffect(() => {
    const map = mapRef.current;
    if (!map || filteredItems.length === 0) {
      return;
    }

    // Timeout para dar tiempo a que los marcadores se rendericen
    const timeoutId = setTimeout(() => {
      adjustMapBounds(map, filteredItems);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [filteredItems, adjustMapBounds]);

  // Centrar mapa cuando se selecciona un item desde el sidebar (con offset para que popup quede centrado)
  useEffect(() => {
    const map = mapRef.current;
    if (!externalSelectedItem || !map) return;

    const lat = externalSelectedItem.currentLocationCoordinates.lat;
    const lng = externalSelectedItem.currentLocationCoordinates.lng;

    // Primero hacer zoom y setear el item
    map.setZoom(12);
    setSelectedItem(externalSelectedItem);

    // Luego aplicar el pan con offset para centrar el popup
    setTimeout(() => {
      const mapDiv = map.getDiv();
      const mapHeight = mapDiv.offsetHeight;
      // Offset del 25% de la altura del mapa para centrar mejor el popup
      const pixelOffset = mapHeight * 0.25;
      const currentZoom = map.getZoom() || 12;
      const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, currentZoom);
      const offsetLat = (pixelOffset * metersPerPixel) / 111320;
      map.panTo({ lat: lat + offsetLat, lng: lng });
    }, 100);
  }, [externalSelectedItem]);

  // Ref para guardar los marcadores nativos de Google Maps
  const markersRef = useRef<google.maps.Marker[]>([]);
  // Ref para guardar los marcadores de "aura/glow"
  const glowMarkersRef = useRef<google.maps.Marker[]>([]);
  // Ref para guardar los intervalos de animación (parpadeo)
  const animationIntervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // Función de easing para animación más natural (ease-in-out cubic)
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Función para crear MARCADORES NATIVOS de Google Maps con COLOR POR MANTENIMIENTO y ANIMACIÓN CON AURA
  const createNativeMarkers = useCallback((map: google.maps.Map, items: InventoryItem[]) => {

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Limpiar marcadores de glow anteriores
    glowMarkersRef.current.forEach(marker => marker.setMap(null));
    glowMarkersRef.current = [];

    // Limpiar intervalos de animación anteriores
    animationIntervalsRef.current.forEach(interval => clearInterval(interval));
    animationIntervalsRef.current = [];

    items.forEach((item, idx) => {
      const lat = Number(item.currentLocationCoordinates?.lat);
      const lng = Number(item.currentLocationCoordinates?.lng);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      // USAR COLOR BASADO EN PROXIMIDAD DE MANTENIMIENTO
      const { color, status: maintenanceStatus } = getMaintenanceProximityColor(item.nextMaintenanceDate);

      // Para marcadores con animación, crear un "aura" detrás
      let glowMarker: google.maps.Marker | null = null;
      if (maintenanceStatus === 'urgent' || maintenanceStatus === 'warning') {
        glowMarker = new window.google.maps.Marker({
          map: map,
          position: { lat, lng },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: color,
            fillOpacity: 0.15,
            strokeColor: color,
            strokeWeight: 1,
            strokeOpacity: 0.3,
          },
          zIndex: maintenanceStatus === 'urgent' ? 90 : 40,
          clickable: false, // No intercepta clicks
        });
        glowMarkersRef.current.push(glowMarker);
      }

      // Crear marcador principal con icono SVG
      const marker = new window.google.maps.Marker({
        map: map,
        position: { lat, lng },
        title: `${item.name} - ${getMaintenanceLabel(item.nextMaintenanceDate)}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
          strokeOpacity: 1,
        },
        zIndex: maintenanceStatus === 'urgent' ? 100 : (maintenanceStatus === 'warning' ? 50 : 10),
      });

      // OPTIMIZADO: Animación removida para mejor rendimiento
      // Los marcadores urgentes/warning se muestran con color estático
      // La leyenda del mapa muestra la animación CSS (más eficiente)
      // Si se necesita animación en marcadores, usar CSS animations en lugar de setInterval

      // Agregar evento de click
      marker.addListener('click', () => {
        setSelectedItem(item);
        // Centrar el mapa para que el popup quede visible (25% offset para mejor centrado)
        setTimeout(() => {
          const map = mapRef.current;
          if (map) {
            const lat = item.currentLocationCoordinates.lat;
            const lng = item.currentLocationCoordinates.lng;
            const mapDiv = map.getDiv();
            const mapHeight = mapDiv.offsetHeight;
            const pixelOffset = mapHeight * 0.25; // 25% para centrar mejor
            const currentZoom = map.getZoom() || 10;
            const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, currentZoom);
            const offsetLat = (pixelOffset * metersPerPixel) / 111320;
            map.panTo({ lat: lat + offsetLat, lng: lng });
          }
        }, 50);
      });

      markersRef.current.push(marker);
    });
  }, []);

  // Callback optimizado - usa ref para evitar re-renders
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;

    // CRÍTICO: Crear marcadores NATIVOS después de que el mapa esté listo
    setTimeout(() => {
      createNativeMarkers(mapInstance, filteredItems);
      adjustMapBounds(mapInstance, filteredItems);
    }, 500);
  }, [filteredItems, adjustMapBounds, createNativeMarkers]);

  // Efecto para actualizar marcadores cuando cambian los items filtrados
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Recrear marcadores cuando cambian los items
    createNativeMarkers(map, filteredItems);
  }, [filteredItems, isLoaded, createNativeMarkers]);

  const onUnmount = useCallback(() => {
    // Limpiar intervalos de animación
    animationIntervalsRef.current.forEach(interval => clearInterval(interval));
    animationIntervalsRef.current = [];
    // Limpiar marcadores de glow
    glowMarkersRef.current.forEach(marker => marker.setMap(null));
    glowMarkersRef.current = [];
    // Limpiar marcadores principales al desmontar
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, []);

  // Handlers memoizados para evitar recreación
  const handleInfoWindowClose = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleViewDetails = useCallback(() => {
    if (selectedItem && onItemClick) {
      onItemClick(selectedItem);
      setSelectedItem(null);
    }
  }, [selectedItem, onItemClick]);

  // Obtener label del estado
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      available: 'Disponible',
      rented: 'Rentado',
      maintenance: 'Mantenimiento',
      sold: 'Vendido',
      retired: 'Retirado',
    };
    return labels[status] || status;
  };

  // NOTA: Los círculos ahora se crean de forma NATIVA en createNativeCircles()
  // No usamos componentes de React para evitar problemas con la librería

  if (loadError) {
    return (
      <Alert severity="error">
        Error al cargar Google Maps. Verifica tu API Key.
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Leyenda de Mantenimiento - Colapsable, abajo a la izquierda */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 28,
          left: 16,
          zIndex: 1,
        }}
      >
        <Paper
          sx={{
            borderRadius: '12px',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: 180,
          }}
        >
          {/* Lista expandible (se muestra arriba del botón) */}
          <Box
            sx={{
              maxHeight: legendOpen ? 200 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
            }}
          >
            <Stack spacing={0.5} sx={{ px: 2, py: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
                <Typography variant="caption" color="text.secondary">+30 días</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ position: 'relative', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Aura - OPTIMIZADO: Solo animar cuando legend está abierta */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#f59e0b',
                      opacity: 0.2,
                      // OPTIMIZADO: animation solo cuando legendOpen
                      animation: legendOpen ? 'breatheAura 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                      '@keyframes breatheAura': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 0.15 },
                        '50%': { transform: 'scale(1.6)', opacity: 0.08 },
                      },
                    }}
                  />
                  {/* Punto principal */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#f59e0b',
                      border: '1.5px solid white',
                      boxShadow: '0 0 4px rgba(245, 158, 11, 0.4)',
                      // OPTIMIZADO: animation solo cuando legendOpen
                      animation: legendOpen ? 'breatheMain 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                      '@keyframes breatheMain': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(0.9)', opacity: 0.85 },
                      },
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">7-30 días</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ position: 'relative', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Aura - OPTIMIZADO: Solo animar cuando legend está abierta */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#ef4444',
                      // OPTIMIZADO: animation solo cuando legendOpen
                      animation: legendOpen ? 'breatheAuraFast 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                      '@keyframes breatheAuraFast': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 0.2 },
                        '50%': { transform: 'scale(1.7)', opacity: 0.08 },
                      },
                    }}
                  />
                  {/* Punto principal */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#ef4444',
                      border: '1.5px solid white',
                      boxShadow: '0 0 4px rgba(239, 68, 68, 0.5)',
                      // OPTIMIZADO: animation solo cuando legendOpen
                      animation: legendOpen ? 'breatheMainFast 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                      '@keyframes breatheMainFast': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                        '50%': { transform: 'scale(0.9)', opacity: 0.85 },
                      },
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">&lt;7 días / Vencido</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#6b7280' }} />
                <Typography variant="caption" color="text.secondary">Sin programar</Typography>
              </Stack>
            </Stack>
            <Divider />
          </Box>

          {/* Botón para expandir/colapsar */}
          <Box
            onClick={() => setLegendOpen(!legendOpen)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <MaintenanceIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {filteredItems.length} artículos
              </Typography>
            </Stack>
            {legendOpen ? (
              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            ) : (
              <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={6}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Los círculos se crean de forma NATIVA en createNativeCircles() */}
        {/* No como componentes de React */}

        {/* Custom Popup usando OverlayView - Control TOTAL sin elementos nativos de Google */}
        {selectedItem && (
          <OverlayViewF
            position={{
              lat: selectedItem.currentLocationCoordinates.lat,
              lng: selectedItem.currentLocationCoordinates.lng,
            }}
            mapPaneName={OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(width, height) => ({
              x: -(width / 2),
              y: -height - 20, // Posicionar arriba del marcador
            })}
          >
            <Box sx={{ position: 'relative' }}>
              {/* Contenedor principal */}
              <Paper
                elevation={8}
                sx={{
                  minWidth: 300,
                  maxWidth: 340,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Botón X para cerrar - Rojo para mejor visibilidad */}
                <Box
                  onClick={handleInfoWindowClose}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      bgcolor: '#dc2626',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '14px', color: 'white', fontWeight: 700, lineHeight: 1 }}>✕</Typography>
                </Box>

                {/* Header con borde lateral */}
                <Box
                  sx={{
                    position: 'relative',
                    borderLeft: `4px solid ${getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color}`,
                    p: '12px 12px 10px',
                  }}
                >
                  {/* Badge de estado - Ahora en la esquina IZQUIERDA */}
                  <Box
                    sx={{
                      py: 0.4,
                      px: 1.25,
                      borderRadius: '16px',
                      bgcolor: getStatusColor(selectedItem.status),
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      display: 'inline-flex',
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {getStatusLabel(selectedItem.status)}
                    </Typography>
                  </Box>

                  {/* Título */}
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#111827',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.3,
                      pr: '40px',
                      mb: 0.4,
                    }}
                  >
                    {selectedItem.name}
                  </Typography>

                {/* Metadata */}
                <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap">
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    {selectedItem.type}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: theme.palette.mode === 'dark' ? '#4b5563' : '#d1d5db' }}>•</Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#a78bfa' : '#8b5cf6',
                      fontFamily: 'monospace',
                    }}
                  >
                    {selectedItem.serialNumber}
                  </Typography>
                </Stack>
              </Box>

              {/* Divider */}
              <Divider />

              {/* Contenido */}
              <Box sx={{ p: 1.5 }}>
                {/* Ubicación Actual */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1.25,
                    p: 1,
                    borderRadius: '10px',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #f3f4f6',
                  }}
                >
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '8px',
                      bgcolor: '#8b5cf6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    <LocationIcon sx={{ fontSize: 17, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.65rem', color: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af', mb: 0.2, fontWeight: 500 }}>
                      Ubicación Actual
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: theme.palette.mode === 'dark' ? '#f3f4f6' : '#1f2937' }}>
                      {selectedItem.currentLocationCity}, {selectedItem.currentLocationState}
                    </Typography>
                  </Box>
                </Box>

                {/* Próximo Mantenimiento */}
                <Box
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    bgcolor: `${getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color}08`,
                    border: `2px solid ${getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color}30`,
                    p: 1.25,
                    mb: 1.25,
                    boxShadow: `0 2px 10px ${getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color}12`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '10px',
                        bgcolor: getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 3px 10px ${getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color}35`,
                      }}
                    >
                      <MaintenanceIcon sx={{ fontSize: 20, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px',
                          mb: 0.2,
                        }}
                      >
                        Próximo Mantenimiento
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: getMaintenanceProximityColor(selectedItem.nextMaintenanceDate).color,
                          lineHeight: 1.2,
                        }}
                      >
                        {getMaintenanceLabel(selectedItem.nextMaintenanceDate)}
                      </Typography>
                      {selectedItem.nextMaintenanceDate && (
                        <Typography sx={{ fontSize: '0.65rem', color: theme.palette.mode === 'dark' ? '#d1d5db' : '#9ca3af', mt: 0.2, fontWeight: 500 }}>
                          {new Date(selectedItem.nextMaintenanceDate).toLocaleDateString('es-MX', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Botón Ver Detalles */}
                {onItemClick && (
                  <Box
                    onClick={handleViewDetails}
                    sx={{
                      width: '100%',
                      py: 1.25,
                      px: 2,
                      borderRadius: '10px',
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      letterSpacing: '0.2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.75,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 3px 10px rgba(139, 92, 246, 0.3)'
                        : '0 3px 10px rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 5px 15px rgba(139, 92, 246, 0.4)'
                          : '0 5px 15px rgba(0, 0, 0, 0.2)',
                      },
                    }}
                  >
                    Ver Información Completa
                    <span style={{ fontSize: '0.95rem' }}>→</span>
                  </Box>
                )}
              </Box>
            </Paper>

              {/* Flecha/Triángulo apuntando hacia abajo - mismo color que el contenedor */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: `12px solid ${theme.palette.background.paper}`,
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
                }}
              />
            </Box>
          </OverlayViewF>
        )}
      </GoogleMap>
    </Box>
  );
};

export default InventoryMap;
