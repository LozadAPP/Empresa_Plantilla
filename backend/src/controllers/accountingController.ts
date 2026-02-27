import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Transaction from '../models/Transaction';
import TransactionLine from '../models/TransactionLine';
import Account from '../models/Account';
import Location from '../models/Location';
import User from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import logger from '../config/logger';
import { AuthRequest } from '../types';
import { recalculateMultipleAccounts } from '../services/balanceService';

const BANK_ACCOUNT_ID = 4; // 1120 - Bancos (counter-account for auto-generated lines)

// ====================================
// ACCOUNTS
// ====================================

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const { accountType, isActive } = req.query;

    const where: any = {};
    if (accountType) where.accountType = accountType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const accounts = await Account.findAll({
      where,
      include: [
        {
          model: Account,
          as: 'parentAccount',
          attributes: ['id', 'accountCode', 'accountName'],
        },
        {
          model: Account,
          as: 'subAccounts',
          attributes: ['id', 'accountCode', 'accountName', 'balance'],
        },
      ],
      order: [['accountCode', 'ASC']],
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    logger.error('Error fetching accounts', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching accounts',
      error: 'Error interno del servidor',
    });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { accountCode, accountName, accountType, parentAccountId, description } = req.body;

    const account = await Account.create({
      accountCode,
      accountName,
      accountType,
      parentAccountId,
      description,
      balance: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: account,
    });
  } catch (error: any) {
    logger.error('Error creating account', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: 'Error interno del servidor',
    });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;

    // Whitelist of allowed fields for update
    const allowedFields = ['accountName', 'accountType', 'parentAccountId', 'description', 'isActive'];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const account = await Account.findByPk(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    await account.update(updates);

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: account,
    });
  } catch (error: any) {
    logger.error('Error updating account', { error });
    res.status(500).json({
      success: false,
      message: 'Error updating account',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// TRANSACTIONS
// ====================================

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      transactionType,
      status,
      accountId,
      locationId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const where: any = {};

    if (transactionType) where.transactionType = transactionType;
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;
    if (locationId) where.locationId = locationId;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate as string);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate as string);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        {
          model: Account,
          as: 'account',
          attributes: ['id', 'accountCode', 'accountName', 'accountType'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'city'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'first_name', 'last_name'],
        },
        {
          model: TransactionLine,
          as: 'lines',
          include: [{
            model: Account,
            as: 'account',
            attributes: ['id', 'accountCode', 'accountName', 'accountType'],
          }],
        },
      ],
      order: [['transactionDate', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching transactions', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: 'Error interno del servidor',
    });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const {
      transactionType,
      accountId,
      destinationAccountId,
      amount,
      description,
      referenceType,
      referenceId,
      paymentMethod,
      transactionDate,
      locationId,
      notes,
      lines: customLines,
    } = req.body;

    const userId = req.user!.id;

    // Validate transfer-specific fields
    if (transactionType === 'transfer') {
      if (!destinationAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Las transferencias requieren una cuenta destino',
        });
      }
      if (Number(destinationAccountId) === Number(accountId)) {
        return res.status(400).json({
          success: false,
          message: 'La cuenta destino debe ser diferente a la cuenta origen',
        });
      }
      const destAccount = await Account.findByPk(destinationAccountId);
      if (!destAccount) {
        return res.status(404).json({
          success: false,
          message: 'La cuenta destino no existe',
        });
      }
    }

    // Validate custom lines if provided (advanced mode)
    if (customLines && Array.isArray(customLines) && customLines.length > 0) {
      const totalDebit = customLines.reduce((sum: number, l: any) => sum + Number(l.debit || 0), 0);
      const totalCredit = customLines.reduce((sum: number, l: any) => sum + Number(l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Las líneas no están balanceadas: Débitos (${totalDebit}) ≠ Créditos (${totalCredit})`,
        });
      }
    }

    // Generate unique transaction code
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timeComponent = String(now.getTime()).slice(-6);
    const randomComponent = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const transactionCode = `TRX-${year}${month}${day}-${timeComponent}${randomComponent}`;

    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.create({
        transactionCode,
        transactionType,
        accountId,
        destinationAccountId: transactionType === 'transfer' ? destinationAccountId : null,
        amount,
        description,
        referenceType,
        referenceId,
        paymentMethod,
        transactionDate: transactionDate || new Date(),
        status: 'pending',
        locationId,
        notes,
        createdBy: userId,
      }, { transaction: t });

      // Create double-entry lines
      if (customLines && Array.isArray(customLines) && customLines.length > 0) {
        // Advanced mode: use custom lines from frontend
        await TransactionLine.bulkCreate(
          customLines.map((l: any) => ({
            transactionId: transaction.id,
            accountId: l.accountId,
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
            description: l.description || '',
          })),
          { transaction: t }
        );
      } else {
        // Simple mode: auto-generate 2 lines based on type
        const lineAmount = Number(amount);
        const linesToCreate: Array<{ transactionId: number; accountId: number; debit: number; credit: number; description: string }> = [];

        if (transactionType === 'income') {
          linesToCreate.push(
            { transactionId: transaction.id, accountId: BANK_ACCOUNT_ID, debit: lineAmount, credit: 0, description: 'Ingreso a banco' },
            { transactionId: transaction.id, accountId: Number(accountId), debit: 0, credit: lineAmount, description: description || '' },
          );
        } else if (transactionType === 'expense') {
          linesToCreate.push(
            { transactionId: transaction.id, accountId: Number(accountId), debit: lineAmount, credit: 0, description: description || '' },
            { transactionId: transaction.id, accountId: BANK_ACCOUNT_ID, debit: 0, credit: lineAmount, description: 'Pago desde banco' },
          );
        } else if (transactionType === 'transfer') {
          linesToCreate.push(
            { transactionId: transaction.id, accountId: Number(destinationAccountId), debit: lineAmount, credit: 0, description: 'Transferencia recibida' },
            { transactionId: transaction.id, accountId: Number(accountId), debit: 0, credit: lineAmount, description: 'Transferencia enviada' },
          );
        }

        await TransactionLine.bulkCreate(linesToCreate, { transaction: t });
      }

      await t.commit();

      const transactionWithDetails = await Transaction.findByPk(transaction.id, {
        include: [
          { model: Account, as: 'account' },
          { model: Location, as: 'location' },
          {
            model: TransactionLine,
            as: 'lines',
            include: [{ model: Account, as: 'account', attributes: ['id', 'accountCode', 'accountName', 'accountType'] }],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transactionWithDetails,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error creating transaction', { error });
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: 'Error interno del servidor',
    });
  }
};

export const approveTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const userId = req.user!.id;

    const transaction = await Transaction.findByPk(id, {
      include: [{ model: TransactionLine, as: 'lines' }],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction already processed',
      });
    }

    // Validate double-entry lines exist and are balanced
    const lines = (transaction as any).lines || [];
    if (lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La transacción no tiene líneas contables. No se puede aprobar.',
      });
    }

    const totalDebit = lines.reduce((sum: number, l: any) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + Number(l.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Transacción desbalanceada: Débitos (${totalDebit}) ≠ Créditos (${totalCredit})`,
      });
    }

    const t = await sequelize.transaction();

    try {
      // Mark transaction as completed
      await transaction.update({
        status: 'completed',
        approvedBy: userId,
        approvedAt: new Date(),
      }, { transaction: t });

      // Recalculate balance for each affected account from GL lines
      const affectedAccountIds = lines.map((l: any) => l.accountId);
      await recalculateMultipleAccounts(affectedAccountIds, t);

      await t.commit();

      res.json({
        success: true,
        message: 'Transaction approved successfully',
        data: transaction,
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error('Error approving transaction', { error });
    res.status(500).json({
      success: false,
      message: 'Error approving transaction',
      error: 'Error interno del servidor',
    });
  }
};

export const cancelTransaction = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findByPk(id, { transaction: t });
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Cannot cancel already completed or cancelled transactions
    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${transaction.status} transaction`,
      });
    }

    await transaction.update({
      status: 'cancelled',
      notes: reason,
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: transaction,
    });
  } catch (error: any) {
    await t.rollback();
    logger.error('Error cancelling transaction', { error });
    res.status(500).json({
      success: false,
      message: 'Error cancelling transaction',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// MIGRATION: Single-entry → Double-entry
// ====================================

export const migrateToDoubleEntry = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();

  try {
    // Idempotent: if lines already exist, refuse to run again
    const existingLines = await TransactionLine.count({ transaction: t });
    if (existingLines > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Migración ya completada. Existen ${existingLines} líneas contables.`,
      });
    }

    // Fetch all existing transactions
    const transactions = await Transaction.findAll({ transaction: t });

    // Create 2 lines per transaction
    const linesToCreate: Array<{ transactionId: number; accountId: number; debit: number; credit: number; description: string }> = [];

    for (const trx of transactions) {
      const amount = Number(trx.amount);

      if (trx.transactionType === 'income') {
        linesToCreate.push(
          { transactionId: trx.id, accountId: BANK_ACCOUNT_ID, debit: amount, credit: 0, description: 'Migración: Ingreso a banco' },
          { transactionId: trx.id, accountId: trx.accountId, debit: 0, credit: amount, description: `Migración: ${trx.description}` },
        );
      } else if (trx.transactionType === 'expense') {
        linesToCreate.push(
          { transactionId: trx.id, accountId: trx.accountId, debit: amount, credit: 0, description: `Migración: ${trx.description}` },
          { transactionId: trx.id, accountId: BANK_ACCOUNT_ID, debit: 0, credit: amount, description: 'Migración: Pago desde banco' },
        );
      } else if (trx.transactionType === 'transfer' && trx.destinationAccountId) {
        linesToCreate.push(
          { transactionId: trx.id, accountId: trx.destinationAccountId, debit: amount, credit: 0, description: 'Migración: Transferencia recibida' },
          { transactionId: trx.id, accountId: trx.accountId, debit: 0, credit: amount, description: 'Migración: Transferencia enviada' },
        );
      }
    }

    await TransactionLine.bulkCreate(linesToCreate, { transaction: t });

    // Recalculate ALL account balances from lines (only completed transactions)
    const accounts = await Account.findAll({ transaction: t });
    const allAccountIds = accounts.map(a => a.id);
    await recalculateMultipleAccounts(allAccountIds, t);

    await t.commit();

    logger.info(`Double-entry migration complete: ${linesToCreate.length} lines for ${transactions.length} transactions`);

    res.json({
      success: true,
      message: `Migración completada. Se crearon ${linesToCreate.length} líneas contables para ${transactions.length} transacciones. Saldos recalculados.`,
    });
  } catch (error: any) {
    await t.rollback();
    logger.error('Error during double-entry migration', { error });
    res.status(500).json({
      success: false,
      message: 'Error durante la migración a partida doble',
    });
  }
};

// ====================================
// REPORTS
// ====================================

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const assets = await Account.findAll({
      where: { accountType: 'asset', isActive: true },
      attributes: ['id', 'accountCode', 'accountName', 'balance'],
      order: [['accountCode', 'ASC']],
    });

    const liabilities = await Account.findAll({
      where: { accountType: 'liability', isActive: true },
      attributes: ['id', 'accountCode', 'accountName', 'balance'],
      order: [['accountCode', 'ASC']],
    });

    const equity = await Account.findAll({
      where: { accountType: 'equity', isActive: true },
      attributes: ['id', 'accountCode', 'accountName', 'balance'],
      order: [['accountCode', 'ASC']],
    });

    // Calculate net income dynamically: income balances - expense balances
    const incomeAccounts = await Account.findAll({
      where: { accountType: 'income', isActive: true },
      attributes: ['balance'],
    });
    const expenseAccounts = await Account.findAll({
      where: { accountType: 'expense', isActive: true },
      attributes: ['balance'],
    });

    const totalIncome = incomeAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const netIncome = totalIncome - totalExpenses;

    const totalAssets = assets.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalEquityAccounts = equity.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalEquity = totalEquityAccounts + netIncome;

    res.json({
      success: true,
      data: {
        assets: {
          accounts: assets,
          total: totalAssets,
        },
        liabilities: {
          accounts: liabilities,
          total: totalLiabilities,
        },
        equity: {
          accounts: equity,
          total: totalEquity,
          netIncome,
        },
        balanceCheck: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      },
    });
  } catch (error: any) {
    logger.error('Error generating balance sheet', { error });
    res.status(500).json({
      success: false,
      message: 'Error generating balance sheet',
      error: 'Error interno del servidor',
    });
  }
};

export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { asOfDate } = req.query;

    // Build date filter for transactions
    const transactionWhere: any = { status: 'completed' };
    if (asOfDate) {
      transactionWhere.transactionDate = { [Op.lte]: new Date(asOfDate as string) };
    }

    // Get all active accounts
    const accounts = await Account.findAll({
      where: { isActive: true },
      attributes: ['id', 'accountCode', 'accountName', 'accountType'],
      order: [['accountCode', 'ASC']],
    });

    // Aggregate debits and credits per account from transaction_lines of completed transactions
    const lineAggregates = await TransactionLine.findAll({
      attributes: [
        'accountId',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('TransactionLine.debit')), 0), 'totalDebit'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('TransactionLine.credit')), 0), 'totalCredit'],
      ],
      include: [{
        model: Transaction,
        as: 'transaction',
        attributes: [],
        where: transactionWhere,
      }],
      group: ['TransactionLine.account_id'],
      raw: true,
    });

    // Build a map for quick lookup
    const aggregateMap = new Map<number, { totalDebit: number; totalCredit: number }>();
    for (const row of lineAggregates as any[]) {
      aggregateMap.set(row.accountId, {
        totalDebit: Number(row.totalDebit),
        totalCredit: Number(row.totalCredit),
      });
    }

    // Build rows - only include accounts with activity
    const rows = accounts
      .map(acc => {
        const agg = aggregateMap.get(acc.id);
        if (!agg) return null;
        return {
          accountId: acc.id,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          accountType: acc.accountType,
          debit: agg.totalDebit,
          credit: agg.totalCredit,
        };
      })
      .filter(Boolean);

    const totalDebit = rows.reduce((sum, r: any) => sum + r.debit, 0);
    const totalCredit = rows.reduce((sum, r: any) => sum + r.credit, 0);

    res.json({
      success: true,
      data: {
        rows,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    logger.error('Error generating trial balance', { error });
    res.status(500).json({
      success: false,
      message: 'Error generating trial balance',
      error: 'Error interno del servidor',
    });
  }
};

export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {
      status: 'completed',
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = new Date(startDate as string);
      if (endDate) where.transactionDate[Op.lte] = new Date(endDate as string);
    }

    const incomeTransactions = await Transaction.findAll({
      where: { ...where, transactionType: 'income' },
      include: [{ model: Account, as: 'account' }],
    });

    const expenseTransactions = await Transaction.findAll({
      where: { ...where, transactionType: 'expense' },
      include: [{ model: Account, as: 'account' }],
    });

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const netIncome = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        income: {
          transactions: incomeTransactions,
          total: totalIncome,
        },
        expenses: {
          transactions: expenseTransactions,
          total: totalExpenses,
        },
        netIncome,
      },
    });
  } catch (error: any) {
    logger.error('Error generating income statement', { error });
    res.status(500).json({
      success: false,
      message: 'Error generating income statement',
      error: 'Error interno del servidor',
    });
  }
};
