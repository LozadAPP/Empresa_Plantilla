/**
 * Formulario para Crear/Editar Renta (CHAT 2)
 * VERSIÓN MEJORADA - Con todos los campos necesarios para operación real
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { AppDispatch } from '../store';
import { createRental } from '../store/slices/rentalSlice';
import { CreateRentalDTO, PaymentMethod } from '../types/rental';
import customerService from '../services/customerService';
import vehicleService from '../services/vehicleService';
import { differenceInDays } from 'date-fns';

const RentalForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateRentalDTO>({
    customer_id: 0,
    vehicle_id: 0,
    location_id: 0,
    return_location_id: undefined,
    start_date: '',
    end_date: '',
    insurance_amount: 0,
    deposit_amount: 0,
    payment_method: undefined,
    start_mileage: undefined,
    fuel_level_start: '',
    discount_percentage: 0,
    extras_amount: 0,
    notes: ''
  });

  const [calculated, setCalculated] = useState({
    days: 0,
    subtotal: 0,
    discount: 0,
    insurance: 0,
    extras: 0,
    subtotalWithExtras: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    loadCustomers();
    loadVehicles();
    loadLocations();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [
    formData.start_date,
    formData.end_date,
    formData.vehicle_id,
    formData.insurance_amount,
    formData.discount_percentage,
    formData.extras_amount
  ]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll({});
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await vehicleService.getAvailable();
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadLocations = async () => {
    try {
      // TODO: Crear servicio de locations cuando CHAT 1 lo implemente
      // Por ahora, usamos datos dummy
      setLocations([
        { id: 1, name: 'CDMX - Norte', city: 'Ciudad de México' },
        { id: 2, name: 'CDMX - Sur', city: 'Ciudad de México' },
        { id: 3, name: 'Guadalajara', city: 'Guadalajara' },
        { id: 4, name: 'Monterrey', city: 'Monterrey' },
        { id: 5, name: 'Cancún', city: 'Cancún' }
      ]);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const calculateTotals = () => {
    if (!formData.start_date || !formData.end_date || !formData.vehicle_id) return;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    // CORREGIDO: Usar differenceInDays + 1 (misma lógica que backend)
    const days = Math.max(1, differenceInDays(end, start) + 1);

    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicle_id));
    if (!selectedVehicle) return;

    const dailyRate = selectedVehicle.daily_rate || 0;

    // Subtotal (días * tarifa)
    const subtotal = days * dailyRate;

    // Descuento
    const discountPercentage = Number(formData.discount_percentage) || 0;
    const discount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discount;

    // Extras (seguro + extras)
    const insurance = Number(formData.insurance_amount) || 0;
    const extras = Number(formData.extras_amount) || 0;
    const subtotalWithExtras = subtotalAfterDiscount + insurance + extras;

    // IVA (16%)
    const tax = subtotalWithExtras * 0.16;

    // Total
    const total = subtotalWithExtras + tax;

    setCalculated({
      days,
      subtotal,
      discount,
      insurance,
      extras,
      subtotalWithExtras,
      tax,
      total
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Normalizar fechas a formato ISO (yyyy-MM-dd)
    if (name === 'start_date' || name === 'end_date') {
      // Si ya es formato ISO, usar tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
        return;
      }

      // Si es formato MM/DD/YYYY (localización US), convertir a ISO
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [month, day, year] = value.split('/');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, [name]: isoDate }));
        return;
      }

      // Si es formato DD/MM/YYYY (localización EU), convertir a ISO
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        const parts = value.split('/');
        // Asumir DD/MM/YYYY si el primer número es > 12
        if (Number.parseInt(parts[0], 10) > 12) {
          const [day, month, year] = parts;
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          setFormData(prev => ({ ...prev, [name]: isoDate }));
          return;
        }
      }

      // Valor vacío o cualquier otro caso
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.customer_id || !formData.vehicle_id || !formData.location_id) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' });
      return;
    }

    // Validar formato de fechas (debe ser yyyy-MM-dd)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(formData.start_date) || !isoDateRegex.test(formData.end_date)) {
      enqueueSnackbar('Formato de fecha inválido. Use el selector de calendario.', { variant: 'warning' });
      return;
    }

    // Validar fechas
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      enqueueSnackbar('La fecha de inicio no puede ser en el pasado', { variant: 'warning' });
      return;
    }

    if (endDate <= startDate) {
      enqueueSnackbar('La fecha de fin debe ser después de la fecha de inicio', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await dispatch(createRental(formData)).unwrap();
      enqueueSnackbar('¡Renta creada exitosamente!', { variant: 'success' });
      navigate('/rentals');
    } catch (error: any) {
      enqueueSnackbar(`Error: ${error}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Nueva Renta</h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completa todos los campos para crear una nueva renta</p>
      </div>

      <form onSubmit={handleSubmit} data-testid="rental-form" className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>

        {/* SECCIÓN 1: Información Básica */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>
            1. Información Básica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Cliente */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Cliente *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                data-testid="rental-customer-select"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="">Seleccionar cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehículo */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Vehículo *
              </label>
              <select
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleChange}
                required
                data-testid="rental-vehicle-select"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="">Seleccionar vehículo</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.plate}) - ${vehicle.daily_rate}/día
                  </option>
                ))}
              </select>
            </div>

            {/* Location Pickup */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sucursal de Recolección *
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                required
                data-testid="rental-location-select"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="">Seleccionar sucursal</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Dropoff */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sucursal de Devolución (opcional)
              </label>
              <select
                name="return_location_id"
                value={formData.return_location_id || ''}
                onChange={handleChange}
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="">Misma sucursal de recolección</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </option>
                ))}
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Si el cliente devolverá en otra sucursal (one-way rental)
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Fechas y Condiciones Iniciales */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>
            2. Fechas y Condiciones Iniciales del Vehículo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Fecha inicio */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Fecha de Inicio *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                data-testid="rental-start-date-input"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Fecha de Fin *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                data-testid="rental-end-date-input"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
            </div>

            {/* Kilometraje Inicial */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kilometraje Inicial (KM) *
              </label>
              <input
                type="number"
                name="start_mileage"
                value={formData.start_mileage || ''}
                onChange={handleChange}
                required
                min="0"
                placeholder="Ej: 45000"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Registra el KM actual del vehículo antes de entregarlo
              </p>
            </div>

            {/* Nivel de Combustible Inicial */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nivel de Combustible Inicial *
              </label>
              <select
                name="fuel_level_start"
                value={formData.fuel_level_start}
                onChange={handleChange}
                required
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
              >
                <option value="">Seleccionar nivel</option>
                <option value="Empty">Vacío</option>
                <option value="1/4">1/4 Tanque</option>
                <option value="1/2">1/2 Tanque</option>
                <option value="3/4">3/4 Tanque</option>
                <option value="Full">Tanque Lleno</option>
              </select>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Nivel de combustible al momento de entregar el vehículo
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Costos y Pagos */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>
            3. Costos y Método de Pago
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Descuento */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Descuento (%)
              </label>
              <input
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                placeholder="Ej: 10 para 10%"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Para clientes frecuentes o promociones especiales
              </p>
            </div>

            {/* Seguro */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Costo del Seguro
              </label>
              <input
                type="number"
                name="insurance_amount"
                value={formData.insurance_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 150"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Seguro opcional (básico, premium, full coverage)
              </p>
            </div>

            {/* Extras */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Extras (GPS, Silla, etc.)
              </label>
              <input
                type="number"
                name="extras_amount"
                value={formData.extras_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 75"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                GPS, silla de bebé, portaequipajes, etc.
              </p>
            </div>

            {/* Depósito */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Depósito de Garantía
              </label>
              <input
                type="number"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 500"
                className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
              />
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Depósito reembolsable al devolver el vehículo
              </p>
            </div>

            {/* Método de Pago */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Método de Pago *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={PaymentMethod.CASH}
                    checked={formData.payment_method === PaymentMethod.CASH}
                    onChange={handleChange}
                    required
                    className="text-blue-600"
                  />
                  <span className="text-sm">Efectivo</span>
                </label>
                <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={PaymentMethod.CREDIT_CARD}
                    checked={formData.payment_method === PaymentMethod.CREDIT_CARD}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Tarjeta Crédito</span>
                </label>
                <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={PaymentMethod.DEBIT_CARD}
                    checked={formData.payment_method === PaymentMethod.DEBIT_CARD}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Tarjeta Débito</span>
                </label>
                <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={PaymentMethod.TRANSFER}
                    checked={formData.payment_method === PaymentMethod.TRANSFER}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Transferencia</span>
                </label>
                <label className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value={PaymentMethod.CHECK}
                    checked={formData.payment_method === PaymentMethod.CHECK}
                    onChange={handleChange}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Cheque</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Notas Adicionales */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 pb-2 border-b ${isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'}`}>
            4. Notas y Observaciones
          </h2>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notas del Operador (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Ej: Cliente solicita GPS adicional. Vehículo con raspón pequeño en puerta trasera derecha (ya documentado)."
              className={`w-full rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border border-gray-300 text-gray-900'}`}
            />
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Cualquier observación importante sobre esta renta
            </p>
          </div>
        </div>

        {/* Resumen de Cálculo */}
        {calculated.days > 0 && (
          <div className={`mb-6 p-6 rounded-lg border ${isDarkMode ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💰 Resumen de Cálculo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Días de renta:</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{calculated.days}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${calculated.subtotal.toFixed(2)}</span>
              </div>
              {calculated.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Descuento:</span>
                  <span className="font-medium">-${calculated.discount.toFixed(2)}</span>
                </div>
              )}
              {calculated.insurance > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Seguro:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${calculated.insurance.toFixed(2)}</span>
                </div>
              )}
              {calculated.extras > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Extras:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${calculated.extras.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>IVA (16%):</span>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${calculated.tax.toFixed(2)}</span>
              </div>
              <div className={`md:col-span-3 pt-3 border-t-2 flex justify-between ${isDarkMode ? 'border-blue-600' : 'border-blue-300'}`}>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>TOTAL A PAGAR:</span>
                <span className="text-2xl font-bold text-blue-500">
                  ${calculated.total.toFixed(2)} MXN
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/rentals')}
            data-testid="rental-cancel-button"
            className={`px-6 py-3 border-2 rounded-lg font-medium transition ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            ← Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || calculated.days === 0}
            data-testid="rental-submit-button"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {loading ? 'Creando Renta...' : '✓ Crear Renta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RentalForm;
