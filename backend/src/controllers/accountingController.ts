import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Transaction from '../models/Transaction';
import Account from '../models/Account';
import Location from '../models/Location';
import User from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';

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
    console.error('Error fetching accounts:', error);
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
    console.error('Error creating account:', error);
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
    console.error('Error updating account:', error);
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
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: 'Error interno del servidor',
    });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
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
    } = req.body;

    const userId = (req as any).user.id;

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
      // Verify destination account exists
      const destAccount = await Account.findByPk(destinationAccountId);
      if (!destAccount) {
        return res.status(404).json({
          success: false,
          message: 'La cuenta destino no existe',
        });
      }
    }

    // Generate unique transaction code using timestamp to avoid race conditions
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timeComponent = String(now.getTime()).slice(-6); // Last 6 digits of timestamp
    const randomComponent = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const transactionCode = `TRX-${year}${month}${day}-${timeComponent}${randomComponent}`;

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
    });

    const transactionWithDetails = await Transaction.findByPk(transaction.id, {
      include: [
        {
          model: Account,
          as: 'account',
        },
        {
          model: Location,
          as: 'location',
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transactionWithDetails,
    });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: 'Error interno del servidor',
    });
  }
};

export const approveTransaction = async (req: Request, res: Response) => {
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
    const userId = (req as any).user.id;

    const transaction = await Transaction.findByPk(id);

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

    // Get the associated account (source account)
    const sourceAccount = await Account.findByPk(transaction.accountId);
    if (!sourceAccount) {
      return res.status(404).json({
        success: false,
        message: 'Associated account not found',
      });
    }

    // For transfers, also get the destination account
    let destinationAccount = null;
    if (transaction.transactionType === 'transfer') {
      if (!transaction.destinationAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Transfer transactions require a destination account',
        });
      }
      destinationAccount = await Account.findByPk(transaction.destinationAccountId);
      if (!destinationAccount) {
        return res.status(404).json({
          success: false,
          message: 'Destination account not found',
        });
      }
    }

    // Use database transaction to ensure atomicity
    const t = await sequelize.transaction();

    try {
      // Update transaction status
      await transaction.update({
        status: 'completed',
        approvedBy: userId,
        approvedAt: new Date(),
      }, { transaction: t });

      // Update account balance based on transaction type
      if (transaction.transactionType === 'transfer' && destinationAccount) {
        // For transfers: debit source, credit destination
        const newSourceBalance = Number(sourceAccount.balance) - Number(transaction.amount);
        const newDestBalance = Number(destinationAccount.balance) + Number(transaction.amount);

        await sourceAccount.update({ balance: newSourceBalance }, { transaction: t });
        await destinationAccount.update({ balance: newDestBalance }, { transaction: t });
      } else {
        // For income/expense: single account update
        const newBalance = transaction.transactionType === 'income'
          ? Number(sourceAccount.balance) + Number(transaction.amount)
          : Number(sourceAccount.balance) - Number(transaction.amount);

        await sourceAccount.update({ balance: newBalance }, { transaction: t });
      }

      // Commit the transaction
      await t.commit();

      res.json({
        success: true,
        message: 'Transaction approved successfully',
        data: transaction,
      });
    } catch (error) {
      // Rollback in case of error
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error approving transaction:', error);
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
    console.error('Error cancelling transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling transaction',
      error: 'Error interno del servidor',
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

    const totalAssets = assets.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + Number(acc.balance), 0);

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
        },
        balanceCheck: totalAssets === totalLiabilities + totalEquity,
      },
    });
  } catch (error: any) {
    console.error('Error generating balance sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating balance sheet',
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
    console.error('Error generating income statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating income statement',
      error: 'Error interno del servidor',
    });
  }
};
