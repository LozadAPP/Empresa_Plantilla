import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import Expense from '../models/Expense';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import Location from '../models/Location';
import User from '../models/User';
import Supplier from '../models/Supplier';
import { CodeGenerator } from '../services/codeGenerator';
import { WebSocketService } from '../services/websocketService';
import logger from '../config/logger';
import { AuthRequest } from '../types';

// Mapa subcategoria → account_id (basado en cuentas existentes 5000-5400)
const SUBCATEGORY_ACCOUNT_MAP: Record<string, number> = {
  sueldos: 43,
  imss: 44,
  renta_oficinas: 45,
  servicios: 46,
  papeleria: 47,
  publicidad: 48,
  honorarios: 49,
  mantenimiento_vehiculos: 51,
  combustible: 52,
  seguros_vehiculos: 53,
  tenencias: 54,
  depreciacion: 55,
  lavado: 56,
  intereses: 58,
  comisiones_bancarias: 59,
  otros: 60,
};

// Categorias padre → account_id
const CATEGORY_ACCOUNT_MAP: Record<string, number> = {
  operacion: 42,    // 5100 - Gastos de Operación
  vehiculos: 50,    // 5200 - Gastos de Vehículos
  financieros: 57,  // 5300 - Gastos Financieros
  otros: 60,        // 5400 - Otros Gastos
};

const includeRelations = [
  { model: Account, as: 'account', attributes: ['id', 'accountCode', 'accountName'] },
  { model: Location, as: 'location', attributes: ['id', 'name'] },
  { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
  { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
  { model: Supplier, as: 'supplier', attributes: ['id', 'supplierCode', 'name', 'rfc'] },
];

// ====================================
// CREATE
// ====================================

export const createExpense = async (req: AuthRequest, res: Response) => {
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
      category, subcategory, account_id, description, amount,
      tax_amount = 0, payment_method, receipt_number,
      supplier_id, supplier_name, supplier_rfc, expense_date, due_date,
      is_recurring = false, recurrence_period, reference_type,
      reference_id, location_id, notes,
    } = req.body;

    // Auto-fill supplier name/rfc from supplier record if supplier_id provided
    let finalSupplierName = supplier_name;
    let finalSupplierRfc = supplier_rfc;
    let finalSupplierId = supplier_id;
    if (supplier_id) {
      const supplier = await Supplier.findByPk(supplier_id);
      if (supplier) {
        finalSupplierName = supplier.name;
        finalSupplierRfc = supplier.rfc || supplier_rfc;
      }
    }

    // Auto-detect account_id from subcategory if not provided
    let resolvedAccountId = account_id;
    if (!resolvedAccountId && subcategory) {
      resolvedAccountId = SUBCATEGORY_ACCOUNT_MAP[subcategory];
    }
    if (!resolvedAccountId && category) {
      resolvedAccountId = CATEGORY_ACCOUNT_MAP[category];
    }

    const totalAmount = Number(amount) + Number(tax_amount || 0);

    // Generate codes
    const [expenseCode, transactionCode] = await Promise.all([
      CodeGenerator.generateExpenseCode(),
      CodeGenerator.generateTransactionCode(),
    ]);

    // Create expense + linked transaction atomically
    const t = await sequelize.transaction();

    try {
      // Create the linked transaction
      const transaction = await Transaction.create({
        transactionCode,
        transactionType: 'expense',
        accountId: resolvedAccountId,
        amount: totalAmount,
        description,
        referenceType: 'expense',
        paymentMethod: payment_method,
        transactionDate: expense_date || new Date(),
        status: 'pending',
        locationId: location_id,
        createdBy: userId,
      }, { transaction: t });

      // Create the expense
      const expense = await Expense.create({
        expenseCode,
        category,
        subcategory,
        accountId: resolvedAccountId,
        description,
        amount,
        taxAmount: tax_amount || 0,
        totalAmount,
        paymentMethod: payment_method,
        receiptNumber: receipt_number,
        supplierId: finalSupplierId,
        supplierName: finalSupplierName,
        supplierRfc: finalSupplierRfc,
        expenseDate: expense_date || new Date(),
        dueDate: due_date,
        isRecurring: is_recurring,
        recurrencePeriod: recurrence_period,
        referenceType: reference_type,
        referenceId: reference_id,
        transactionId: transaction.id,
        locationId: location_id,
        createdBy: userId,
        notes,
      }, { transaction: t });

      // Update transaction referenceId with expense id
      await transaction.update({ referenceId: expense.id.toString() }, { transaction: t });

      await t.commit();

      // Fetch with relations
      const created = await Expense.findByPk(expense.id, { include: includeRelations });

      WebSocketService.notifyExpenseCreated(created || expense);

      res.status(201).json({
        success: true,
        message: 'Gasto registrado exitosamente',
        data: created,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error creating expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al registrar el gasto',
    });
  }
};

// ====================================
// LIST
// ====================================

export const getExpenses = async (req: AuthRequest, res: Response) => {
  try {
    const {
      category, status, start_date, end_date,
      location_id, search, page = '1', limit = '20',
    } = req.query;

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (location_id) where.locationId = location_id;

    if (start_date || end_date) {
      where.expenseDate = {};
      if (start_date) where.expenseDate[Op.gte] = start_date;
      if (end_date) where.expenseDate[Op.lte] = end_date;
    }

    if (search) {
      where[Op.or] = [
        { expenseCode: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { supplierName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await Expense.findAndCountAll({
      where,
      include: includeRelations,
      order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']],
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
    logger.error('Error fetching expenses', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener los gastos',
    });
  }
};

// ====================================
// GET BY ID
// ====================================

export const getExpenseById = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        ...includeRelations,
        { model: Transaction, as: 'transaction', attributes: ['id', 'transactionCode', 'status'] },
      ],
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado',
      });
    }

    res.json({ success: true, data: expense });
  } catch (error: any) {
    logger.error('Error fetching expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener el gasto',
    });
  }
};

// ====================================
// UPDATE
// ====================================

export const updateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado',
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden editar gastos pendientes',
      });
    }

    const {
      category, subcategory, account_id, description, amount,
      tax_amount, payment_method, receipt_number, supplier_id,
      supplier_name, supplier_rfc, expense_date, due_date, is_recurring,
      recurrence_period, reference_type, reference_id, location_id, notes,
    } = req.body;

    // Auto-fill supplier name/rfc if supplier_id changed
    let updatedSupplierName = supplier_name !== undefined ? supplier_name : expense.supplierName;
    let updatedSupplierRfc = supplier_rfc !== undefined ? supplier_rfc : expense.supplierRfc;
    const updatedSupplierId = supplier_id !== undefined ? supplier_id : expense.supplierId;
    if (supplier_id && supplier_id !== expense.supplierId) {
      const supplier = await Supplier.findByPk(supplier_id);
      if (supplier) {
        updatedSupplierName = supplier.name;
        updatedSupplierRfc = supplier.rfc || updatedSupplierRfc;
      }
    }

    // Recalculate account if subcategory changed
    let resolvedAccountId = account_id || expense.accountId;
    if (subcategory && subcategory !== expense.subcategory) {
      resolvedAccountId = SUBCATEGORY_ACCOUNT_MAP[subcategory] || resolvedAccountId;
    }

    const newAmount = amount !== undefined ? Number(amount) : Number(expense.amount);
    const newTax = tax_amount !== undefined ? Number(tax_amount) : Number(expense.taxAmount);
    const totalAmount = newAmount + newTax;

    const t = await sequelize.transaction();

    try {
      await expense.update({
        category: category || expense.category,
        subcategory: subcategory !== undefined ? subcategory : expense.subcategory,
        accountId: resolvedAccountId,
        description: description || expense.description,
        amount: newAmount,
        taxAmount: newTax,
        totalAmount,
        paymentMethod: payment_method !== undefined ? payment_method : expense.paymentMethod,
        receiptNumber: receipt_number !== undefined ? receipt_number : expense.receiptNumber,
        supplierId: updatedSupplierId,
        supplierName: updatedSupplierName,
        supplierRfc: updatedSupplierRfc,
        expenseDate: expense_date || expense.expenseDate,
        dueDate: due_date !== undefined ? due_date : expense.dueDate,
        isRecurring: is_recurring !== undefined ? is_recurring : expense.isRecurring,
        recurrencePeriod: recurrence_period !== undefined ? recurrence_period : expense.recurrencePeriod,
        referenceType: reference_type !== undefined ? reference_type : expense.referenceType,
        referenceId: reference_id !== undefined ? reference_id : expense.referenceId,
        locationId: location_id !== undefined ? location_id : expense.locationId,
        notes: notes !== undefined ? notes : expense.notes,
      }, { transaction: t });

      // Sync linked transaction
      if (expense.transactionId) {
        await Transaction.update({
          accountId: resolvedAccountId,
          amount: totalAmount,
          description: description || expense.description,
          paymentMethod: payment_method !== undefined ? payment_method : expense.paymentMethod,
          transactionDate: expense_date || expense.expenseDate,
          locationId: location_id !== undefined ? location_id : expense.locationId,
        }, { where: { id: expense.transactionId }, transaction: t });
      }

      await t.commit();

      const updated = await Expense.findByPk(expense.id, { include: includeRelations });

      res.json({
        success: true,
        message: 'Gasto actualizado exitosamente',
        data: updated,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error updating expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el gasto',
    });
  }
};

// ====================================
// DELETE
// ====================================

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado',
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar gastos pendientes',
      });
    }

    const t = await sequelize.transaction();

    try {
      // Delete linked transaction first
      if (expense.transactionId) {
        await Transaction.destroy({ where: { id: expense.transactionId }, transaction: t });
      }
      await expense.destroy({ transaction: t });
      await t.commit();

      res.json({
        success: true,
        message: 'Gasto eliminado exitosamente',
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error deleting expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el gasto',
    });
  }
};

// ====================================
// APPROVE
// ====================================

export const approveExpense = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado',
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aprobar gastos pendientes',
      });
    }

    const account = expense.accountId ? await Account.findByPk(expense.accountId) : null;
    const linkedTransaction = expense.transactionId
      ? await Transaction.findByPk(expense.transactionId)
      : null;

    const t = await sequelize.transaction();

    try {
      // Update expense status
      await expense.update({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      }, { transaction: t });

      // Approve linked transaction
      if (linkedTransaction && linkedTransaction.status === 'pending') {
        await linkedTransaction.update({
          status: 'completed',
          approvedBy: userId,
          approvedAt: new Date(),
        }, { transaction: t });
      }

      // Update account balance (expense accounts SUM when spending)
      if (account) {
        const newBalance = Number(account.balance) + Number(expense.totalAmount);
        await account.update({ balance: newBalance }, { transaction: t });
      }

      await t.commit();

      const updated = await Expense.findByPk(expense.id, { include: includeRelations });

      WebSocketService.notifyExpenseApproved(updated || expense);

      res.json({
        success: true,
        message: 'Gasto aprobado exitosamente',
        data: updated,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error approving expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al aprobar el gasto',
    });
  }
};

// ====================================
// REJECT
// ====================================

export const rejectExpense = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Gasto no encontrado',
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden rechazar gastos pendientes',
      });
    }

    const t = await sequelize.transaction();

    try {
      await expense.update({
        status: 'rejected',
        rejectionReason: req.body.rejection_reason,
      }, { transaction: t });

      // Cancel linked transaction
      if (expense.transactionId) {
        await Transaction.update(
          { status: 'cancelled' },
          { where: { id: expense.transactionId }, transaction: t },
        );
      }

      await t.commit();

      const updated = await Expense.findByPk(expense.id, { include: includeRelations });

      res.json({
        success: true,
        message: 'Gasto rechazado',
        data: updated,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error rejecting expense', { error });
    res.status(500).json({
      success: false,
      message: 'Error al rechazar el gasto',
    });
  }
};

// ====================================
// SUMMARY
// ====================================

export const getExpenseSummary = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

    const [byCategory, totals] = await Promise.all([
      // By category (current month, approved)
      Expense.findAll({
        where: {
          status: 'approved',
          expenseDate: { [Op.between]: [firstDayOfMonth, lastDayOfMonth] },
        },
        attributes: [
          'category',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'total'],
        ],
        group: ['category'],
        raw: true,
      }),

      // Overall totals
      Expense.findOne({
        attributes: [
          [fn('COUNT', literal("CASE WHEN status = 'pending' THEN 1 END")), 'pendingCount'],
          [fn('COALESCE', fn('SUM', literal("CASE WHEN status = 'pending' THEN total_amount ELSE 0 END")), 0), 'pendingTotal'],
          [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'approved' AND expense_date >= '${firstDayOfMonth.toISOString().split('T')[0]}' AND expense_date <= '${lastDayOfMonth.toISOString().split('T')[0]}' THEN total_amount ELSE 0 END`)), 0), 'monthTotal'],
          [fn('COALESCE', fn('SUM', literal(`CASE WHEN status = 'approved' AND expense_date >= '${firstDayOfYear.toISOString().split('T')[0]}' THEN total_amount ELSE 0 END`)), 0), 'yearTotal'],
        ],
        raw: true,
      }),
    ]);

    const totalsData = totals as any || {};

    res.json({
      success: true,
      data: {
        byCategory,
        pendingCount: parseInt(totalsData.pendingCount) || 0,
        pendingTotal: parseFloat(totalsData.pendingTotal) || 0,
        monthTotal: parseFloat(totalsData.monthTotal) || 0,
        yearTotal: parseFloat(totalsData.yearTotal) || 0,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching expense summary', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de gastos',
    });
  }
};

// ====================================
// CATEGORIES
// ====================================

export const getExpenseCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = [
      {
        category: 'operacion',
        label: 'Gastos de Operación',
        subcategories: [
          { name: 'sueldos', label: 'Sueldos y Salarios', accountId: 43 },
          { name: 'imss', label: 'Cuotas Patronales IMSS', accountId: 44 },
          { name: 'renta_oficinas', label: 'Renta de Oficinas', accountId: 45 },
          { name: 'servicios', label: 'Servicios Públicos', accountId: 46 },
          { name: 'papeleria', label: 'Papelería y Útiles', accountId: 47 },
          { name: 'publicidad', label: 'Publicidad y Marketing', accountId: 48 },
          { name: 'honorarios', label: 'Honorarios Profesionales', accountId: 49 },
        ],
      },
      {
        category: 'vehiculos',
        label: 'Gastos de Vehículos',
        subcategories: [
          { name: 'mantenimiento_vehiculos', label: 'Mantenimiento de Vehículos', accountId: 51 },
          { name: 'combustible', label: 'Combustible', accountId: 52 },
          { name: 'seguros_vehiculos', label: 'Seguros de Vehículos', accountId: 53 },
          { name: 'tenencias', label: 'Tenencias y Verificaciones', accountId: 54 },
          { name: 'depreciacion', label: 'Depreciación de Vehículos', accountId: 55 },
          { name: 'lavado', label: 'Lavado de Vehículos', accountId: 56 },
        ],
      },
      {
        category: 'financieros',
        label: 'Gastos Financieros',
        subcategories: [
          { name: 'intereses', label: 'Intereses Pagados', accountId: 58 },
          { name: 'comisiones_bancarias', label: 'Comisiones Bancarias', accountId: 59 },
        ],
      },
      {
        category: 'otros',
        label: 'Otros Gastos',
        subcategories: [
          { name: 'otros', label: 'Otros Gastos', accountId: 60 },
        ],
      },
    ];

    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error fetching expense categories', { error });
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías',
    });
  }
};
