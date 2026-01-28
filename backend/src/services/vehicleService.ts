import { Op } from 'sequelize';
import { Vehicle, VehicleType, Location, Rental } from '../models';

interface VehicleFilters {
  status?: string;
  location_id?: number;
  vehicle_type_id?: number;
  condition?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
  minYear?: number;
  maxYear?: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface VehicleData {
  make: string;
  model: string;
  license_plate: string;
  vin: string;
  year: number;
  color?: string;
  vehicle_type_id: number;
  location_id: number;
  purchase_price: number;
  current_value: number;
  monthly_depreciation: number;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  engine?: string;
  power?: string;
  purchase_date?: Date;
  insurance_expiry?: Date;
  next_maintenance?: Date;
  condition?: string;
  is_premium?: boolean;
  has_driver?: boolean;
  notes?: string;
}

class VehicleService {
  /**
   * Get all vehicles with filters and pagination
   */
  async getAll(filters: VehicleFilters, pagination: PaginationOptions) {
    const { page, limit, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.location_id) {
      where.location_id = filters.location_id;
    }

    if (filters.vehicle_type_id) {
      where.vehicle_type_id = filters.vehicle_type_id;
    }

    if (filters.condition) {
      where.condition = filters.condition;
    }

    if (filters.search) {
      where[Op.or] = [
        { make: { [Op.iLike]: `%${filters.search}%` } },
        { model: { [Op.iLike]: `%${filters.search}%` } },
        { license_plate: { [Op.iLike]: `%${filters.search}%` } },
        { vin: { [Op.iLike]: `%${filters.search}%` } },
        { color: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    if (filters.minValue || filters.maxValue) {
      where.current_value = {};
      if (filters.minValue) where.current_value[Op.gte] = filters.minValue;
      if (filters.maxValue) where.current_value[Op.lte] = filters.maxValue;
    }

    if (filters.minYear || filters.maxYear) {
      where.year = {};
      if (filters.minYear) where.year[Op.gte] = filters.minYear;
      if (filters.maxYear) where.year[Op.lte] = filters.maxYear;
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where,
      include: [
        { model: VehicleType, as: 'vehicleType' },
        { model: Location, as: 'location' }
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get available vehicles
   */
  async getAvailable(location_id?: number) {
    const where: any = { status: 'available' };
    if (location_id) where.location_id = location_id;

    return Vehicle.findAll({
      where,
      include: [
        { model: VehicleType, as: 'vehicleType' },
        { model: Location, as: 'location' }
      ],
      order: [['make', 'ASC'], ['model', 'ASC']]
    });
  }

  /**
   * Get vehicle by ID
   */
  async getById(id: number) {
    return Vehicle.findByPk(id, {
      include: [
        { model: VehicleType, as: 'vehicleType' },
        { model: Location, as: 'location' }
      ]
    });
  }

  /**
   * Get vehicle by license plate
   */
  async getByLicensePlate(license_plate: string) {
    return Vehicle.findOne({
      where: { license_plate },
      include: [
        { model: VehicleType, as: 'vehicleType' },
        { model: Location, as: 'location' }
      ]
    });
  }

  /**
   * Create new vehicle
   */
  async create(data: VehicleData) {
    // Check if license plate already exists
    const existing = await Vehicle.findOne({
      where: { license_plate: data.license_plate }
    });

    if (existing) {
      throw new Error('License plate already exists');
    }

    // Check if VIN already exists
    const existingVin = await Vehicle.findOne({
      where: { vin: data.vin }
    });

    if (existingVin) {
      throw new Error('VIN already exists');
    }

    return Vehicle.create(data as any);
  }

  /**
   * Update vehicle
   */
  async update(id: number, data: Partial<VehicleData>) {
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // If updating license plate, check uniqueness
    if (data.license_plate && data.license_plate !== vehicle.license_plate) {
      const existing = await Vehicle.findOne({
        where: { license_plate: data.license_plate }
      });
      if (existing) {
        throw new Error('License plate already exists');
      }
    }

    await vehicle.update(data as any);
    return this.getById(id);
  }

  /**
   * Update vehicle status
   */
  async updateStatus(id: number, status: 'available' | 'rented' | 'maintenance') {
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    await vehicle.update({ status });
    return vehicle;
  }

  /**
   * Delete vehicle
   * Validates that vehicle has no active rentals before deletion
   */
  async delete(id: number) {
    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Check if vehicle is currently rented
    if (vehicle.status === 'rented') {
      throw new Error('No se puede eliminar un vehículo que está rentado. Primero completa la devolución.');
    }

    // Check for active rentals in database
    const activeRentals = await Rental.count({
      where: {
        vehicle_id: id,
        status: 'active'
      }
    });

    if (activeRentals > 0) {
      throw new Error(`El vehículo tiene ${activeRentals} renta(s) activa(s). No se puede eliminar.`);
    }

    await vehicle.destroy();
    return { message: 'Vehicle deleted successfully' };
  }

  /**
   * Get vehicle statistics
   */
  async getStatistics(location_id?: number) {
    const where: any = {};
    if (location_id) where.location_id = location_id;

    const [available, rented, maintenance, total] = await Promise.all([
      Vehicle.count({ where: { ...where, status: 'available' } }),
      Vehicle.count({ where: { ...where, status: 'rented' } }),
      Vehicle.count({ where: { ...where, status: 'maintenance' } }),
      Vehicle.count({ where })
    ]);

    return {
      available,
      rented,
      maintenance,
      total,
      occupancyRate: total > 0 ? ((rented / total) * 100).toFixed(2) : 0
    };
  }

  /**
   * Get vehicles by type statistics
   */
  async getByTypeStatistics() {
    const types = await VehicleType.findAll({
      include: [{
        model: Vehicle,
        as: 'vehicles'
      }]
    });

    return types.map((type: any) => ({
      id: type.id,
      name: type.name,
      total: type.vehicles?.length || 0,
      available: type.vehicles?.filter((v: any) => v.status === 'available').length || 0,
      rented: type.vehicles?.filter((v: any) => v.status === 'rented').length || 0,
      maintenance: type.vehicles?.filter((v: any) => v.status === 'maintenance').length || 0
    }));
  }
}

export default new VehicleService();
