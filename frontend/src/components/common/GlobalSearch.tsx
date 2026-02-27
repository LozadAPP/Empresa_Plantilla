import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
  ListSubheader,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Assignment as RentalIcon,
  RequestQuote as QuoteIcon,
  Receipt as InvoiceIcon,
  Business as SupplierIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { customerService } from '../../services/customerService';
import { vehicleService } from '../../services/vehicleService';
import { rentalService } from '../../services/rentalService';
import { quoteService } from '../../services/quoteService';
import { invoiceService } from '../../services/invoiceService';
import { supplierService } from '../../services/supplierService';

interface SearchResult {
  id: string;
  type: 'customer' | 'vehicle' | 'rental' | 'quote' | 'invoice' | 'supplier';
  label: string;
  sublabel: string;
  path: string;
}

const TYPE_CONFIG: Record<SearchResult['type'], { icon: React.ElementType; label: string; color: string }> = {
  customer: { icon: PersonIcon, label: 'Clientes', color: '#8b5cf6' },
  vehicle: { icon: CarIcon, label: 'Vehículos', color: '#3b82f6' },
  rental: { icon: RentalIcon, label: 'Rentas', color: '#10b981' },
  quote: { icon: QuoteIcon, label: 'Cotizaciones', color: '#f59e0b' },
  invoice: { icon: InvoiceIcon, label: 'Facturas', color: '#ef4444' },
  supplier: { icon: SupplierIcon, label: 'Proveedores', color: '#06b6d4' },
};

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useCustomTheme();

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const searchCounterRef = useRef(0);

  // Bug 1 fix: Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const searchAll = useCallback(async (term: string) => {
    const currentSearch = ++searchCounterRef.current;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        customerService.search(term, 3),
        vehicleService.getAll({ page: 1, limit: 3, filters: { search: term } }),
        rentalService.getAll({ search: term, limit: 3 }),
        quoteService.getAll({ search: term, limit: 3 }),
        invoiceService.getAll({ search: term, limit: 3 }),
        supplierService.getAll({ search: term, limit: 3 }),
      ]);

      const mapped: SearchResult[] = [];

      // Customers: { success, data: Customer[] }
      if (results[0].status === 'fulfilled' && results[0].value.success) {
        const customers = results[0].value.data || [];
        for (const c of customers) {
          mapped.push({
            id: `customer-${c.id}`,
            type: 'customer',
            label: c.name,
            sublabel: c.email || c.phone || c.customer_type,
            path: `/customers/${c.id}`,
          });
        }
      }

      // Vehicles: { success, data: Vehicle[], pagination }
      if (results[1].status === 'fulfilled' && results[1].value.data) {
        const vehicles = Array.isArray(results[1].value.data) ? results[1].value.data : [];
        for (const v of vehicles) {
          mapped.push({
            id: `vehicle-${v.id}`,
            type: 'vehicle',
            label: `${v.make} ${v.model} (${v.year})`,
            sublabel: v.license_plate,
            path: `/inventory/${v.id}`,
          });
        }
      }

      // Rentals: { success, data: { rentals: Rental[] } }
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        const rentals = results[2].value.data?.rentals || [];
        for (const r of rentals) {
          mapped.push({
            id: `rental-${r.id}`,
            type: 'rental',
            label: r.rental_code,
            sublabel: r.customer?.name || r.status,
            path: `/rentals/${r.id}`,
          });
        }
      }

      // Quotes: { success, data: { quotes: Quote[] } }
      if (results[3].status === 'fulfilled' && results[3].value.success) {
        const quotes = results[3].value.data?.quotes || [];
        for (const q of quotes) {
          mapped.push({
            id: `quote-${q.id}`,
            type: 'quote',
            label: q.quote_code,
            sublabel: q.customer?.name || q.status,
            path: `/quotes/${q.id}`,
          });
        }
      }

      // Invoices: { success, data: { invoices: Invoice[] } }
      if (results[4].status === 'fulfilled' && results[4].value.success) {
        const invoices = results[4].value.data?.invoices || [];
        for (const inv of invoices) {
          mapped.push({
            id: `invoice-${inv.id}`,
            type: 'invoice',
            label: inv.invoice_code,
            sublabel: inv.customer?.name || inv.status,
            path: `/invoices/${inv.id}`,
          });
        }
      }

      // Suppliers: { success, data: Supplier[], pagination }
      if (results[5].status === 'fulfilled' && results[5].value.success) {
        const suppliersList = results[5].value.data || [];
        for (const s of suppliersList) {
          mapped.push({
            id: `supplier-${s.id}`,
            type: 'supplier',
            label: s.name,
            sublabel: s.rfc || s.supplier_type || '',
            path: `/suppliers/${s.id}`,
          });
        }
      }

      // Bug 2 fix: Only apply results if this is still the latest search
      if (currentSearch !== searchCounterRef.current) return;
      setOptions(mapped);
    } catch {
      if (currentSearch !== searchCounterRef.current) return;
      setOptions([]);
    } finally {
      if (currentSearch === searchCounterRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (value.length < 2) {
      setOptions([]);
      return;
    }
    timerRef.current = setTimeout(() => searchAll(value), 300);
  };

  const handleSelect = (_event: React.SyntheticEvent, value: SearchResult | string | null) => {
    if (value && typeof value !== 'string') {
      navigate(value.path);
      setInputValue('');
      setOptions([]);
    }
  };

  return (
    <>
      {/* Desktop search (sm+) */}
      <Autocomplete<SearchResult, false, false, true>
        freeSolo
        value={null}
        options={options}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleSelect}
        filterOptions={(x) => x}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        groupBy={(option) => TYPE_CONFIG[option.type].label}
        loading={loading}
        noOptionsText={inputValue.length >= 2 ? 'Sin resultados' : 'Escribe para buscar...'}
        slotProps={{
          popper: { sx: { zIndex: 1400 } },
        }}
        PaperComponent={(props) => (
          <Paper
            {...props}
            sx={{
              bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
              borderRadius: '12px',
              mt: 0.5,
              boxShadow: isDarkMode
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.12)',
            }}
          />
        )}
        renderGroup={(params) => (
          <li key={params.key}>
            <ListSubheader
              sx={{
                bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
                color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#6b7280',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: '32px',
              }}
            >
              {params.group}
            </ListSubheader>
            {params.children}
          </li>
        )}
        renderOption={(props, option) => {
          const config = TYPE_CONFIG[option.type];
          const Icon = config.icon;
          return (
            <Box
              component="li"
              {...props}
              key={option.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)',
                },
              }}
            >
              <Icon sx={{ color: config.color, fontSize: 20, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {option.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {option.sublabel}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Buscar..."
            size="small"
            inputProps={{ ...params.inputProps, 'aria-label': 'Buscar en el sistema' }}
            sx={{
              display: { xs: 'none', sm: 'block' },
              maxWidth: { sm: 200, md: 280 },
              flex: { sm: 1, md: 'none' },
              transition: 'max-width 0.3s ease',
              '&:focus-within': {
                maxWidth: { sm: 240, md: 320 },
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                height: '40px',
                fontSize: '0.875rem',
                transition: 'box-shadow 0.2s ease',
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb',
                  transition: 'border-color 0.2s ease',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#d1d5db',
                },
                '&.Mui-focused': {
                  boxShadow: isDarkMode
                    ? '0 0 0 3px rgba(0, 117, 255, 0.15)'
                    : '0 0 0 3px rgba(0, 117, 255, 0.08)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0075ff',
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#111827',
                '&::placeholder': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
                  opacity: 1,
                },
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
                      fontSize: 20,
                      transition: 'color 0.2s ease',
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} sx={{ color: '#8b5cf6' }} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          display: { xs: 'none', sm: 'block' },
          maxWidth: { sm: 200, md: 280 },
          flex: { sm: 1, md: 'none' },
          '& .MuiAutocomplete-endAdornment': {
            display: 'none',
          },
        }}
      />

      {/* Mobile search icon — placeholder for now (same cosmetic icon) */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          alignItems: 'center',
        }}
      >
        {/* Mobile search can be added later as a dialog/drawer */}
      </Box>
    </>
  );
};

export default GlobalSearch;
