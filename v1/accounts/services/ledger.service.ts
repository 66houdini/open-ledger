import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";

/**
 * Transfer money between two accounts using double-entry bookkeeping.
 * This is an ACID transaction - if any part fails, everything rolls back.
 */
export async function transfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string,
) {
  const decimalAmount = new Decimal(amount);

  if (decimalAmount.lte(0)) {
    throw new Error("Amount must be positive");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Lock both accounts to prevent concurrent modifications
    const [fromAccount, toAccount] = await Promise.all([
      tx.$queryRaw<{ id: string; balance: Decimal }[]>`
        SELECT id, balance FROM "Account" WHERE id = ${fromAccountId} FOR UPDATE
      `,
      tx.$queryRaw<{ id: string; balance: Decimal }[]>`
        SELECT id, balance FROM "Account" WHERE id = ${toAccountId} FOR UPDATE
      `,
    ]);

    if (!fromAccount[0]) throw new Error("Source account not found");
    if (!toAccount[0]) throw new Error("Destination account not found");

    const fromBalance = new Decimal(fromAccount[0].balance.toString());
    if (fromBalance.lt(decimalAmount)) {
      throw new Error("Insufficient funds");
    }

    // 2. Create the transaction record
    const transaction = await tx.transaction.create({
      data: {
        description:
          description || `Transfer from ${fromAccountId} to ${toAccountId}`,
      },
    });

    // 3. Create double-entry: DEBIT from source, CREDIT to destination
    await tx.entry.createMany({
      data: [
        {
          amount: decimalAmount.toNumber(),
          type: "DEBIT",
          accountId: fromAccountId,
          transactionId: transaction.id,
        },
        {
          amount: decimalAmount.toNumber(),
          type: "CREDIT",
          accountId: toAccountId,
          transactionId: transaction.id,
        },
      ],
    });

    // 4. Update account balances
    await Promise.all([
      tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: decimalAmount.toNumber() } },
      }),
      tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: decimalAmount.toNumber() } },
      }),
    ]);

    return transaction;
  });
}

/**
 * Withdraw money from an account with row-level locking.
 * Prevents race conditions when multiple requests hit the same account.
 */
export async function withdraw(accountId: string, amount: number) {
  const decimalAmount = new Decimal(amount);

  if (decimalAmount.lte(0)) {
    throw new Error("Amount must be positive");
  }

  return await prisma.$transaction(async (tx) => {
    // Lock the account row to prevent concurrent withdrawals
    const accounts = await tx.$queryRaw<{ id: string; balance: Decimal }[]>`
      SELECT id, balance FROM "Account" WHERE id = ${accountId} FOR UPDATE
    `;

    if (!accounts[0]) throw new Error("Account not found");

    const currentBalance = new Decimal(accounts[0].balance.toString());
    if (currentBalance.lt(decimalAmount)) {
      throw new Error("Insufficient funds");
    }

    // Create withdrawal transaction
    const transaction = await tx.transaction.create({
      data: { description: `Withdrawal from ${accountId}` },
    });

    // Create DEBIT entry (money leaving the account)
    await tx.entry.create({
      data: {
        amount: decimalAmount.toNumber(),
        type: "DEBIT",
        accountId,
        transactionId: transaction.id,
      },
    });

    // Update balance
    const updatedAccount = await tx.account.update({
      where: { id: accountId },
      data: { balance: { decrement: decimalAmount.toNumber() } },
    });

    return { transaction, account: updatedAccount };
  });
}

/**
 * Deposit money into an account.
 */
export async function deposit(accountId: string, amount: number) {
  const decimalAmount = new Decimal(amount);

  if (decimalAmount.lte(0)) {
    throw new Error("Amount must be positive");
  }

  return await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error("Account not found");

    const transaction = await tx.transaction.create({
      data: { description: `Deposit to ${accountId}` },
    });

    await tx.entry.create({
      data: {
        amount: decimalAmount.toNumber(),
        type: "CREDIT",
        accountId,
        transactionId: transaction.id,
      },
    });

    const updatedAccount = await tx.account.update({
      where: { id: accountId },
      data: { balance: { increment: decimalAmount.toNumber() } },
    });

    return { transaction, account: updatedAccount };
  });
}
