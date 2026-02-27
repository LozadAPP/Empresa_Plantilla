import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import locationService, { LocationDropdown } from '../services/locationService';

interface LocationContextType {
  selectedLocationId: number | null;
  selectedLocationName: string;
  locations: LocationDropdown[];
  setLocationId: (id: number | null) => void;
  isAllLocations: boolean;
  canChangeLocation: boolean;
  loading: boolean;
}

const LOCATION_STORAGE_KEY = 'movicar-location';

const ROLES_WITH_GLOBAL_ACCESS = ['admin', 'director_general'];

const LocationContext = createContext<LocationContextType>({
  selectedLocationId: null,
  selectedLocationName: 'Todas las sucursales',
  locations: [],
  setLocationId: () => {},
  isAllLocations: true,
  canChangeLocation: false,
  loading: true,
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationDropdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved === null || saved === 'null') return null;
    const parsed = parseInt(saved, 10);
    return isNaN(parsed) ? null : parsed;
  });

  const canChangeLocation = useMemo(() => {
    if (!user?.roles) return false;
    return user.roles.some((role: string) => ROLES_WITH_GLOBAL_ACCESS.includes(role));
  }, [user?.roles]);

  // Load locations on mount
  useEffect(() => {
    let mounted = true;
    const loadLocations = async () => {
      try {
        const response = await locationService.getLocationsDropdown();
        if (mounted && response.data) {
          setLocations(response.data);
        }
      } catch {
        // Silent fail - locations will be empty
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadLocations();
    return () => { mounted = false; };
  }, []);

  // Enforce location lock for non-admin users once locations are loaded
  useEffect(() => {
    if (loading || !user) return;

    if (!canChangeLocation && user.location_id) {
      setSelectedLocationId(user.location_id);
      localStorage.setItem(LOCATION_STORAGE_KEY, String(user.location_id));
    }
  }, [loading, user, canChangeLocation]);

  // Persist selection to localStorage
  useEffect(() => {
    localStorage.setItem(LOCATION_STORAGE_KEY, String(selectedLocationId));
  }, [selectedLocationId]);

  const setLocationId = useCallback((id: number | null) => {
    if (!canChangeLocation) return;
    setSelectedLocationId(id);
  }, [canChangeLocation]);

  const selectedLocationName = useMemo(() => {
    if (selectedLocationId === null) return 'Todas las sucursales';
    const loc = locations.find(l => l.id === selectedLocationId);
    return loc ? loc.name : 'Sucursal';
  }, [selectedLocationId, locations]);

  const contextValue = useMemo(
    () => ({
      selectedLocationId,
      selectedLocationName,
      locations,
      setLocationId,
      isAllLocations: selectedLocationId === null,
      canChangeLocation,
      loading,
    }),
    [selectedLocationId, selectedLocationName, locations, setLocationId, canChangeLocation, loading]
  );

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};
