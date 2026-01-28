/**
 * Hook para gestión del formulario de devolución
 * Encapsula estado, validaciones y handlers
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { differenceInDays } from 'date-fns';
import { useSnackbar } from 'notistack';
import { AppDispatch } from '../store';
import { createReturn } from '../store/slices/returnSlice';
import { CreateReturnDTO, VehicleCondition } from '../types/return';
import rentalService from '../services/rentalService';
import { getErrorMessage, safeDivide, safeNumber } from '../utils/formatters';
import { getDamageByValue } from '../constants/damages';

export interface PenaltyCalculation {
  isOnTime: boolean;
  daysLate: number;
  lateFee: number;
  cleaningCost: number;
  damageCost: number;
  totalPenalty: number;
  depositAmount: number;
  depositRefund: number;
}

interface UseReturnFormOptions {
  rentalId: string | null;
}

export const useReturnForm = ({ rentalId }: UseReturnFormOptions) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [rental, setRental] = useState<any>(null);
  const [selectedDamageType, setSelectedDamageType] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState<CreateReturnDTO>({
    rental_id: Number(rentalId) || 0,
    return_date: new Date().toISOString().slice(0, 16),
    return_location_id: undefined,
    end_mileage: 0,
    fuel_level: 'full',
    vehicle_condition: 'excellent' as VehicleCondition,
    damage_description: '',
    damage_cost: 0,
    cleaning_required: false,
    inspection_notes: '',
    photos: []
  });

  // Cargar datos de la renta
  useEffect(() => {
    if (rentalId) {
      loadRental();
    }
  }, [rentalId]);

  const loadRental = async () => {
    try {
      const response = await rentalService.getById(Number(rentalId));
      setRental(response.data);
      setFormData(prev => ({
        ...prev,
        rental_id: response.data.id,
        return_location_id: response.data.return_location_id || response.data.location_id,
        end_mileage: response.data.start_mileage || 0
      }));
    } catch (error) {
      console.error('Error loading rental:', error);
      enqueueSnackbar('Error al cargar la renta', { variant: 'error' });
      navigate('/rentals');
    }
  };

  // Cálculo de penalidades en tiempo real
  const penaltyCalculation = useMemo((): PenaltyCalculation | null => {
    if (!rental) return null;

    const returnDate = new Date(formData.return_date || new Date());
    const expectedEndDate = new Date(rental.end_date);
    const daysLate = Math.max(0, differenceInDays(returnDate, expectedEndDate));
    const isOnTime = daysLate === 0;

    const lateFee = daysLate > 0 ? daysLate * rental.daily_rate * 1.5 : 0;
    const cleaningCost = formData.cleaning_required ? 50 : 0;
    const damageCost = Number(formData.damage_cost) || 0;
    const totalPenalty = lateFee + cleaningCost + damageCost;
    const depositAmount = rental.deposit_amount || 0;
    const depositRefund = Math.max(0, depositAmount - totalPenalty);

    return {
      isOnTime,
      daysLate,
      lateFee,
      cleaningCost,
      damageCost,
      totalPenalty,
      depositAmount,
      depositRefund
    };
  }, [rental, formData.return_date, formData.cleaning_required, formData.damage_cost]);

  // Handler genérico para cambios de formulario
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Handler para cambio de tipo de daño
  const handleDamageTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const damageType = e.target.value;
    setSelectedDamageType(damageType);

    if (damageType !== 'custom') {
      const damage = getDamageByValue(damageType);
      if (damage) {
        setFormData(prev => ({
          ...prev,
          damage_description: damage.label,
          damage_cost: damage.cost
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        damage_description: '',
        damage_cost: 0
      }));
    }
  }, []);

  // Handler para subida de fotos
  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Handler para eliminar foto
  const removePhoto = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Validación y submit del formulario
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.end_mileage) {
      enqueueSnackbar('Por favor ingresa el kilometraje final', { variant: 'warning' });
      return;
    }

    if (rental && formData.end_mileage < (rental.start_mileage || 0)) {
      enqueueSnackbar(
        `El kilometraje final (${formData.end_mileage} km) no puede ser menor que el inicial (${rental.start_mileage} km)`,
        { variant: 'error' }
      );
      return;
    }

    if (rental && formData.end_mileage && safeNumber(rental.days) > 0) {
      const kmDiff = formData.end_mileage - safeNumber(rental.start_mileage);
      const kmPerDay = safeDivide(kmDiff, rental.days);

      if (kmPerDay > 500) {
        if (!confirm(
          `⚠️ ADVERTENCIA: El vehículo recorrió ${kmDiff} km en ${rental.days} días (${Math.round(kmPerDay)} km/día).\n\n¿Está correcto el kilometraje final?`
        )) {
          return;
        }
      }
    }

    setShowConfirmModal(true);
  }, [formData, rental, enqueueSnackbar]);

  // Confirmar y enviar
  const confirmSubmit = useCallback(async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await dispatch(createReturn(formData)).unwrap();
      enqueueSnackbar('¡Devolución registrada exitosamente!', { variant: 'success' });
      navigate(`/rentals/${rentalId}`);
    } catch (error: unknown) {
      enqueueSnackbar(`Error: ${getErrorMessage(error)}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dispatch, formData, rentalId, navigate, enqueueSnackbar]);

  // Cancelar y volver
  const handleCancel = useCallback(() => {
    navigate(`/rentals/${rentalId}`);
  }, [navigate, rentalId]);

  // Cerrar modal
  const closeConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  return {
    // Estado
    loading,
    rental,
    formData,
    selectedDamageType,
    showConfirmModal,
    penaltyCalculation,
    // Handlers
    handleChange,
    handleDamageTypeChange,
    handlePhotoUpload,
    removePhoto,
    handleSubmit,
    confirmSubmit,
    handleCancel,
    closeConfirmModal
  };
};
