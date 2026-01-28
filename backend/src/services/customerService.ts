import { Op } from 'sequelize';
import { Customer, Rental, Vehicle, Payment, User } from '../models';

interface CustomerFilters {
  customer_type?: string;
  is_active?: boolean;
  search?: string;
  city?: string;
  country?: string;
  minCreditLimit?: number;
  maxCreditLimit?: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface CustomerData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  customer_type?: 'individual' | 'corporate' | 'government';
  credit_limit?: number;
  payment_terms?: number;
  discount_percentage?: number;
  notes?: string;
}

class CustomerService {
  /**
   * Get all customers with filters and pagination
   */
  async getAll(filters: CustomerFilters, pagination: PaginationOptions) {
    const { page, limit, sortBy = 'name', sortOrder = 'ASC' } = pagination;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.customer_type) {
      where.customer_type = filters.customer_type;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters.city) {
      where.city = { [Op.iLike]: `%${filters.city}%` };
    }

    if (filters.country) {
      where.country = { [Op.iLike]: `%${filters.country}%` };
    }

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { contact_person: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { phone: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    if (filters.minCreditLimit || filters.maxCreditLimit) {
      where.credit_limit = {};
      if (filters.minCreditLimit) where.credit_limit[Op.gte] = filters.minCreditLimit;
      if (filters.maxCreditLimit) where.credit_limit[Op.lte] = filters.maxCreditLimit;
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
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
   * Get active customers for dropdown
   */
  async getActive() {
    return Customer.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'contact_person', 'email', 'credit_limit'],
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get customer by ID
   */
  async getById(id: number) {
    return Customer.findByPk(id);
  }

  /**
   * Get customer by email
   */
  async getByEmail(email: string) {
    return Customer.findOne({ where: { email } });
  }

  /**
   * Create new customer
   */
  async create(data: CustomerData) {
    // Check if email already exists (if provided)
    if (data.email) {
      const existing = await Customer.findOne({
        where: { email: data.email }
      });
      if (existing) {
        throw new Error('Email already registered');
      }
    }

    return Customer.create(data as any);
  }

  /**
   * Update customer
   */
  async update(id: number, data: Partial<CustomerData>) {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // If updating email, check uniqueness
    if (data.email && data.email !== customer.email) {
      const existing = await Customer.findOne({
        where: { email: data.email }
      });
      if (existing) {
        throw new Error('Email already registered');
      }
    }

    await customer.update(data);
    return customer;
  }

  /**
   * Toggle customer active status
   */
  async toggleActive(id: number) {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.update({ is_active: !customer.is_active });
    return customer;
  }

  /**
   * Delete customer
   * Validates that customer has no active rentals or pending payments before deletion
   */
  async delete(id: number) {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check for active rentals
    const activeRentals = await Rental.count({
      where: {
        customer_id: id,
        status: 'active'
      }
    });

    if (activeRentals > 0) {
      throw new Error(`El cliente tiene ${activeRentals} renta(s) activa(s). No se puede eliminar.`);
    }

    // Check for pending payments
    const pendingPayments = await Payment.findAll({
      where: {
        rental_id: {
          [Op.in]: await Rental.findAll({
            where: { customer_id: id },
            attributes: ['id']
          }).then(rentals => rentals.map(r => r.id))
        },
        status: 'pending'
      }
    });

    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    if (pendingAmount > 0) {
      throw new Error(`El cliente tiene pagos pendientes por $${pendingAmount.toFixed(2)}. No se puede eliminar.`);
    }

    await customer.destroy();
    return { message: 'Customer deleted successfully' };
  }

  /**
   * Update customer credit limit
   */
  async updateCreditLimit(id: number, creditLimit: number) {
    const customer = await Customer.findByPk(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    await customer.update({ credit_limit: creditLimit });
    return customer;
  }

  /**
   * Get customer statistics
   */
  async getStatistics() {
    const [total, active, individual, corporate, government] = await Promise.all([
      Customer.count(),
      Customer.count({ where: { is_active: true } }),
      Customer.count({ where: { customer_type: 'individual' } }),
      Customer.count({ where: { customer_type: 'corporate' } }),
      Customer.count({ where: { customer_type: 'government' } })
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byType: {
        individual,
        corporate,
        government
      }
    };
  }

  /**
   * Search customers
   */
  async search(query: string, limit: number = 10) {
    return Customer.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { contact_person: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: ['id', 'name', 'contact_person', 'email', 'phone', 'credit_limit'],
      limit,
      order: [['name', 'ASC']]
    });
  }

  /**
   * Get rental history for a customer with pagination
   */
  async getRentals(customerId: number, pagination: { page: number; limit: number }) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const { count, rows } = await Rental.findAndCountAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'year', 'license_plate']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'transaction_date', 'payment_method', 'status']
        }
      ],
      order: [['start_date', 'DESC']],
      limit,
      offset
    });

    // Calculate summary statistics
    const allRentals = await Rental.findAll({
      where: { customer_id: customerId },
      attributes: ['total_amount', 'status']
    });

    const totalSpent = allRentals.reduce((sum, rental: any) => sum + (rental.total_amount || 0), 0);
    const totalRentals = allRentals.length;
    const activeRentals = allRentals.filter((r: any) => r.status === 'active').length;
    const completedRentals = allRentals.filter((r: any) => r.status === 'completed').length;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      },
      summary: {
        totalSpent,
        totalRentals,
        activeRentals,
        completedRentals
      }
    };
  }
}

export default new CustomerService();
