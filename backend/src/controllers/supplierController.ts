import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op, fn, col, literal } from 'sequelize';
import Supplier from '../models/Supplier';
import Expense from '../models/Expense';
import MaintenanceOrder from '../models/MaintenanceOrder';
import User from '../models/User';
import { CodeGenerator } from '../services/codeGenerator';
import { WebSocketService } from '../services/websocketService';
import logger from '../config/logger';
import { AuthRequest } from '../types';

const includeRelations = [
  { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
];

// ====================================
// CREATE
// ====================================

export const createSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const userId = req.user!.id;
    const {
      name, rfc, contact_person, email, phone, address,
      city, state, country, zip_code, supplier_type,
      category, bank_name, bank_account, clabe,
      payment_terms, credit_limit, rating, notes,
    } = req.body;

    const supplierCode = await CodeGenerator.generateSupplierCode();

    const supplier = await Supplier.create({
      supplierCode,
      name,
      rfc,
      contactPerson: contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      zipCode: zip_code,
      supplierType: supplier_type || 'services',
      category,
      bankName: bank_name,
      bankAccount: bank_account,
      clabe,
      paymentTerms: payment_terms || 0,
      creditLimit: credit_limit || 0,
      rating,
      notes,
      createdBy: userId,
    });

    const created = await Supplier.findByPk(supplier.id, { include: includeRelations });

    WebSocketService.notifySupplierCreated(created || supplier);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: created,
    });
  } catch (error: any) {
    logger.error('Error creating supplier', { error });
    res.status(500).json({
      success: false,
      message: 'Error al crear el proveedor',
    });
  }
};

// ====================================
// LIST
// ====================================

export const getSuppliers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      supplier_type, category, is_active, search,
      page = '1', limit = '20',
    } = req.query;

    const where: any = {};

    if (supplier_type) where.supplierType = supplier_type;
    if (category) where.category = category;
    if (is_active !== undefined && is_active !== '') {
      where.isActive = is_active === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { rfc: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { supplierCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await Supplier.findAndCountAll({
      where,
      include: includeRelations,
      order: [['name', 'ASC']],
      limit: limitNum,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching suppliers', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proveedores',
    });
  }
};

// ====================================
// GET BY ID
// ====================================

export const getSupplierById = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id, {
      include: includeRelations,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado',
      });
    }

    // Count linked expenses and maintenance orders
    const [expensesCount, maintenanceCount, totalSpent] = await Promise.all([
      Expense.count({ where: { supplierId: supplier.id } }),
      MaintenanceOrder.count({ where: { supplierId: supplier.id } }),
      Expense.findOne({
        where: { supplierId: supplier.id, status: 'approved' },
        attributes: [[fn('COALESCE', fn('SUM', col('total_amount')), 0), 'total']],
        raw: true,
      }),
    ]);

    const data = {
      ...supplier.toJSON(),
      expenses_count: expensesCount,
      maintenance_count: maintenanceCount,
      total_spent: parseFloat((totalSpent as any)?.total) || 0,
    };

    res.json({ success: true, data });
  } catch (error: any) {
    logger.error('Error fetching supplier', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener el proveedor',
    });
  }
};

// ====================================
// UPDATE
// ====================================

export const updateSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado',
      });
    }

    const {
      name, rfc, contact_person, email, phone, address,
      city, state, country, zip_code, supplier_type,
      category, bank_name, bank_account, clabe,
      payment_terms, credit_limit, rating, notes,
    } = req.body;

    await supplier.update({
      name: name !== undefined ? name : supplier.name,
      rfc: rfc !== undefined ? rfc : supplier.rfc,
      contactPerson: contact_person !== undefined ? contact_person : supplier.contactPerson,
      email: email !== undefined ? email : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      address: address !== undefined ? address : supplier.address,
      city: city !== undefined ? city : supplier.city,
      state: state !== undefined ? state : supplier.state,
      country: country !== undefined ? country : supplier.country,
      zipCode: zip_code !== undefined ? zip_code : supplier.zipCode,
      supplierType: supplier_type !== undefined ? supplier_type : supplier.supplierType,
      category: category !== undefined ? category : supplier.category,
      bankName: bank_name !== undefined ? bank_name : supplier.bankName,
      bankAccount: bank_account !== undefined ? bank_account : supplier.bankAccount,
      clabe: clabe !== undefined ? clabe : supplier.clabe,
      paymentTerms: payment_terms !== undefined ? payment_terms : supplier.paymentTerms,
      creditLimit: credit_limit !== undefined ? credit_limit : supplier.creditLimit,
      rating: rating !== undefined ? rating : supplier.rating,
      notes: notes !== undefined ? notes : supplier.notes,
    });

    const updated = await Supplier.findByPk(supplier.id, { include: includeRelations });

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updated,
    });
  } catch (error: any) {
    logger.error('Error updating supplier', { error });
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el proveedor',
    });
  }
};

// ====================================
// TOGGLE ACTIVE
// ====================================

export const toggleSupplierActive = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado',
      });
    }

    await supplier.update({ isActive: !supplier.isActive });

    res.json({
      success: true,
      message: supplier.isActive ? 'Proveedor activado' : 'Proveedor desactivado',
      data: { id: supplier.id, isActive: supplier.isActive },
    });
  } catch (error: any) {
    logger.error('Error toggling supplier status', { error });
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del proveedor',
    });
  }
};

// ====================================
// DELETE
// ====================================

export const deleteSupplier = async (req: AuthRequest, res: Response) => {
  try {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado',
      });
    }

    // Check for linked expenses or maintenance orders
    const [expensesCount, maintenanceCount] = await Promise.all([
      Expense.count({ where: { supplierId: supplier.id } }),
      MaintenanceOrder.count({ where: { supplierId: supplier.id } }),
    ]);

    if (expensesCount > 0 || maintenanceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar: tiene ${expensesCount} gastos y ${maintenanceCount} órdenes de mantenimiento vinculados. Desactívelo en su lugar.`,
      });
    }

    await supplier.destroy();

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('Error deleting supplier', { error });
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el proveedor',
    });
  }
};

// ====================================
// DROPDOWN (active only, minimal)
// ====================================

export const getSupplierDropdown = async (_req: AuthRequest, res: Response) => {
  try {
    const suppliers = await Supplier.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'rfc', 'supplierType', 'supplierCode'],
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    logger.error('Error fetching supplier dropdown', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener los proveedores',
    });
  }
};

// ====================================
// STATS
// ====================================

export const getSupplierStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [counts, topBySpending] = await Promise.all([
      // Counts by type and status
      Supplier.findOne({
        attributes: [
          [fn('COUNT', col('id')), 'total'],
          [fn('COUNT', literal("CASE WHEN is_active THEN 1 END")), 'active'],
          [fn('COUNT', literal("CASE WHEN NOT is_active THEN 1 END")), 'inactive'],
          [fn('COUNT', literal("CASE WHEN supplier_type = 'services' THEN 1 END")), 'services'],
          [fn('COUNT', literal("CASE WHEN supplier_type = 'products' THEN 1 END")), 'products'],
          [fn('COUNT', literal("CASE WHEN supplier_type = 'both' THEN 1 END")), 'bothType'],
        ],
        raw: true,
      }),

      // Top 5 by total spending
      Supplier.findAll({
        attributes: [
          'id', 'name', 'supplierCode',
          [fn('COALESCE', fn('SUM', col('expenses.total_amount')), 0), 'total_spent'],
        ],
        include: [{
          model: Expense,
          as: 'expenses',
          attributes: [],
          where: { status: 'approved' },
          required: false,
        }],
        group: ['Supplier.id'],
        order: [[literal('total_spent'), 'DESC']],
        limit: 5,
        subQuery: false,
      }),
    ]);

    const c = counts as any || {};

    res.json({
      success: true,
      data: {
        total: parseInt(c.total) || 0,
        active: parseInt(c.active) || 0,
        inactive: parseInt(c.inactive) || 0,
        byType: {
          services: parseInt(c.services) || 0,
          products: parseInt(c.products) || 0,
          both: parseInt(c.bothType) || 0,
        },
        topBySpending: topBySpending.map((s: any) => ({
          id: s.id,
          name: s.name,
          supplier_code: s.supplierCode,
          total_spent: parseFloat(s.getDataValue('total_spent')) || 0,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching supplier stats', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
    });
  }
};
