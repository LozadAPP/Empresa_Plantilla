/**
 * Balance Service — Recalcula saldos de cuentas desde transaction_lines (partida doble).
 *
 * Regla de saldos normales:
 *   - Activos y Gastos    → saldo = SUM(debit) - SUM(credit)  (debit-normal)
 *   - Pasivos, Patrimonio e Ingresos → saldo = SUM(credit) - SUM(debit) (credit-normal)
 */
import { Transaction as SequelizeTransaction } from 'sequelize';
import sequelize from '../config/database';
import Account from '../models/Account';
import TransactionLine from '../models/TransactionLine';
import Transaction from '../models/Transaction';
import logger from '../config/logger';

const DEBIT_NORMAL_TYPES = ['asset', 'expense'];

export async function recalculateAccountBalance(
  accountId: number,
  dbTransaction?: SequelizeTransaction
): Promise<number> {
  const account = await Account.findByPk(accountId, { transaction: dbTransaction });
  if (!account) return 0;

  const result = await TransactionLine.findOne({
    attributes: [
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('transaction_line.debit')), 0), 'totalDebit'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('transaction_line.credit')), 0), 'totalCredit'],
    ],
    include: [{
      model: Transaction,
      as: 'transaction',
      attributes: [],
      where: { status: 'completed' },
    }],
    where: { accountId },
    raw: true,
    transaction: dbTransaction,
  }) as any;

  const totalDebit = Number(result?.totalDebit || 0);
  const totalCredit = Number(result?.totalCredit || 0);

  const newBalance = DEBIT_NORMAL_TYPES.includes(account.accountType)
    ? totalDebit - totalCredit
    : totalCredit - totalDebit;

  await account.update({ balance: newBalance }, { transaction: dbTransaction });

  logger.debug(`Balance recalculated for account ${account.accountCode}: ${newBalance}`);

  return newBalance;
}

export async function recalculateMultipleAccounts(
  accountIds: number[],
  dbTransaction?: SequelizeTransaction
): Promise<void> {
  const uniqueIds = [...new Set(accountIds)];
  for (const id of uniqueIds) {
    await recalculateAccountBalance(id, dbTransaction);
  }
}
