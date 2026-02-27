import { Response } from 'express';
import { validationResult } from 'express-validator';
import customerService from '../services/customerService';
import { AuthRequest } from '../types';
import { AuditLog } from '../models';
import logger from '../config/logger';

class CustomerController {
  /**
   * GET /customers
   * Get all customers with filters and pagination
   */
  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 25,
        sortBy = 'name',
        sortOrder = 'ASC',
        customer_type,
        is_active,
        search,
        city,
        country,
        minCreditLimit,
        maxCreditLimit
      } = req.query;

      const filters = {
        customer_type: customer_type as string,
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        search: search as string,
        city: city as string,
        country: country as string,
        minCreditLimit: minCreditLimit ? parseFloat(minCreditLimit as string) : undefined,
        maxCreditLimit: maxCreditLimit ? parseFloat(maxCreditLimit as string) : undefined
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      };

      const result = await customerService.getAll(filters, pagination);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error('Get customers error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /customers/active
   * Get active customers for dropdown
   */
  async getActive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const customers = await customerService.getActive();

      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      logger.error('Get active customers error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /customers/search
   * Search customers
   */
  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { q, limit = 10 } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const customers = await customerService.search(q as string, parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error: any) {
      logger.error('Search customers error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /customers/statistics
   * Get customer statistics
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await customerService.getStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Get statistics error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /customers/:id
   * Get customer by ID
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await customerService.getById(parseInt(id));

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      logger.error('Get customer error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /customers
   * Create new customer
   */
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const customer = await customerService.create(req.body);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'customer',
          entity_id: customer.id,
          action: 'create',
          new_values: req.body,
          ip_address: req.ip
        });
      }

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer
      });
    } catch (error: any) {
      logger.error('Create customer error', { error });
      res.status(400).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * PUT /customers/:id
   * Update customer
   */
  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const oldCustomer = await customerService.getById(parseInt(id));

      if (!oldCustomer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      const customer = await customerService.update(parseInt(id), req.body);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'customer',
          entity_id: parseInt(id),
          action: 'update',
          old_values: oldCustomer.toJSON(),
          new_values: req.body,
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully',
        data: customer
      });
    } catch (error: any) {
      logger.error('Update customer error', { error });
      res.status(400).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * PATCH /customers/:id/toggle-active
   * Toggle customer active status
   */
  async toggleActive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await customerService.toggleActive(parseInt(id));

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'customer',
          entity_id: parseInt(id),
          action: 'update',
          new_values: { is_active: customer.is_active },
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: `Customer ${customer.is_active ? 'activated' : 'deactivated'} successfully`,
        data: customer
      });
    } catch (error: any) {
      logger.error('Toggle active error', { error });
      res.status(400).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * PATCH /customers/:id/credit-limit
   * Update customer credit limit
   */
  async updateCreditLimit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { credit_limit } = req.body;

      if (credit_limit === undefined || credit_limit < 0) {
        res.status(400).json({
          success: false,
          message: 'Valid credit limit is required'
        });
        return;
      }

      const customer = await customerService.updateCreditLimit(parseInt(id), credit_limit);

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'customer',
          entity_id: parseInt(id),
          action: 'update',
          new_values: { credit_limit },
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Credit limit updated successfully',
        data: customer
      });
    } catch (error: any) {
      logger.error('Update credit limit error', { error });
      res.status(400).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * DELETE /customers/:id
   * Delete customer
   */
  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customer = await customerService.getById(parseInt(id));

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      await customerService.delete(parseInt(id));

      // Audit log
      if (req.user) {
        await AuditLog.create({
          user_id: req.user.id,
          entity_type: 'customer',
          entity_id: parseInt(id),
          action: 'delete',
          old_values: customer.toJSON(),
          ip_address: req.ip
        });
      }

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete customer error', { error });
      res.status(400).json({
        success: false,
        message: error.message || 'Error al eliminar cliente'
      });
    }
  }

  /**
   * GET /customers/:id/rentals
   * Get rental history for a customer
   */
  async getRentals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const customer = await customerService.getById(parseInt(id));

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
        return;
      }

      const result = await customerService.getRentals(
        parseInt(id),
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      );

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error('Get customer rentals error', { error });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default new CustomerController();
