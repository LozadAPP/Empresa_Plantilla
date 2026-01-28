import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import {
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem, Location } from '../../types/inventory';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface MapViewProps {
  onViewDetails?: (item: InventoryItem) => void;
}

const MapView: React.FC<MapViewProps> = ({ onViewDetails }) => {
  const { isDarkMode } = useCustomTheme();

  // Cargar Google Maps API con useJsApiLoader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showLocations, setShowLocations] = useState(true);
  const [showItems, setShowItems] = useState(true);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsResponse, locationsResponse] = await Promise.all([
        inventoryService.getAllItems({
          limit: 1000,
          status: statusFilter || undefined,
        }),
        inventoryService.getAllLocations(),
      ]);

      setItems(itemsResponse.data || []);
      setLocations(locationsResponse.data || []);
    } catch (err) {
      setError('Error al cargar datos del mapa');
      console.error('Error loading map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Centro del mapa (Ciudad de México por defecto)
  const mapCenter = useMemo(() => {
    if (items.length > 0) {
      const lat =
        items.reduce((sum, item) => sum + item.currentLocationCoordinates.lat, 0) /
        items.length;
      const lng =
        items.reduce((sum, item) => sum + item.currentLocationCoordinates.lng, 0) /
        items.length;
      return { lat, lng };
    }
    return { lat: 19.432608, lng: -99.133209 }; // CDMX
  }, [items]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      clickableIcons: false,
      styles: isDarkMode
        ? [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#263c3f' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#6b9a76' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#746855' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1f2835' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#f3d19c' }],
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#2f3948' }],
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }],
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#515c6d' }],
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#17263c' }],
            },
          ]
        : [],
    }),
    [isDarkMode]
  );

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

  // Agrupar items por ubicación
  const itemsByLocation = useMemo(() => {
    const grouped: Record<string, InventoryItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.currentLocationId]) {
        grouped[item.currentLocationId] = [];
      }
      grouped[item.currentLocationId].push(item);
    });
    return grouped;
  }, [items]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Alert severity="warning">
        Por favor configura la variable de entorno VITE_GOOGLE_MAPS_API_KEY para usar el
        mapa
      </Alert>
    );
  }

  return (
    <Box>
      {/* Controles */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="available">Disponible</MenuItem>
          <MenuItem value="rented">Rentado</MenuItem>
          <MenuItem value="maintenance">Mantenimiento</MenuItem>
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={showLocations}
              onChange={(e) => setShowLocations(e.target.checked)}
              color="primary"
            />
          }
          label="Mostrar Ubicaciones"
        />

        <FormControlLabel
          control={
            <Switch
              checked={showItems}
              onChange={(e) => setShowItems(e.target.checked)}
              color="primary"
            />
          }
          label="Mostrar Artículos"
        />

        <Box sx={{ ml: 'auto' }}>
          <Chip
            icon={<InventoryIcon />}
            label={`${items.length} artículos`}
            sx={{ mr: 1 }}
          />
          <Chip
            icon={<LocationIcon />}
            label={`${locations.length} ubicaciones`}
          />
        </Box>
      </Box>

      {/* Mapa */}
      <Box
        sx={{
          height: '600px',
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
        }}
      >
        {loading || !isLoaded ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              {!isLoaded ? 'Cargando mapa...' : 'Cargando datos...'}
            </Typography>
          </Box>
        ) : loadError ? (
          <Alert severity="error">Error al cargar Google Maps: {loadError.message}</Alert>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={12}
            options={mapOptions}
          >
            {/* Markers de ubicaciones */}
            {showLocations &&
              locations.map((location) => (
                <Marker
                  key={`location-${location.id}`}
                  position={{
                    lat: location.coordinates.lat,
                    lng: location.coordinates.lng,
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#8b5cf6',
                    fillOpacity: 0.6,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }}
                  onClick={() => setSelectedMarker(`location-${location.id}`)}
                >
                  {selectedMarker === `location-${location.id}` && (
                    <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                      <Card
                        sx={{
                          minWidth: 250,
                          boxShadow: 'none',
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                            {location.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {location.address}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 0.5 }}
                          >
                            {location.city}, {location.state}
                          </Typography>
                          <Chip
                            label={`${itemsByLocation[location.id]?.length || 0} artículos`}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </InfoWindow>
                  )}
                </Marker>
              ))}

            {/* Markers de artículos */}
            {showItems &&
              items.map((item) => (
                <Marker
                  key={`item-${item.id}`}
                  position={{
                    lat: item.currentLocationCoordinates.lat,
                    lng: item.currentLocationCoordinates.lng,
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 4,
                    fillColor: getStatusColor(item.status),
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 1,
                  }}
                  onClick={() => setSelectedMarker(`item-${item.id}`)}
                >
                  {selectedMarker === `item-${item.id}` && (
                    <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                      <Card
                        sx={{
                          minWidth: 300,
                          boxShadow: 'none',
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                            {item.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip label={item.categoryName} size="small" />
                            <Chip
                              label={getStatusLabel(item.status)}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(item.status),
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Serie: {item.serialNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Ubicación: {item.currentLocationName}
                          </Typography>
                          {onViewDetails && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#8b5cf6',
                                cursor: 'pointer',
                                display: 'block',
                                mt: 1,
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                              onClick={() => {
                                setSelectedMarker(null);
                                onViewDetails(item);
                              }}
                            >
                              Ver detalles →
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </InfoWindow>
                  )}
                </Marker>
              ))}
          </GoogleMap>
        )}
      </Box>

      {/* Leyenda */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#8b5cf6',
              border: '2px solid #fff',
            }}
          />
          <Typography variant="caption">Ubicaciones</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '12px solid #10b981',
            }}
          />
          <Typography variant="caption">Disponible</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '12px solid #3b82f6',
            }}
          />
          <Typography variant="caption">Rentado</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '12px solid #f59e0b',
            }}
          />
          <Typography variant="caption">Mantenimiento</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MapView;
