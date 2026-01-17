import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/utils/errors";

export interface CreateAccountInput {
  name: string;
  initialBalance?: number;
}

export interface AccountWithEntries {
  id: string;
  name: string;
  balance: any;
  createdAt: Date;
  updatedAt: Date;
  entries: Array<{
    id: string;
    amount: any;
    type: string;
    createdAt: Date;
    transaction: {
      id: string;
      description: string | null;
      createdAt: Date;
    };
  }>;
}

/**
 * Create a new account
 */
export async function createAccount(input: CreateAccountInput) {
  const { name, initialBalance = 0 } = input;

  if (!name) {
    throw new HttpError(400, "Name is required");
  }

  const account = await prisma.account.create({
    data: {
      name,
      balance: initialBalance,
    },
  });

  return account;
}

/**
 * Get all accounts
 */
export async function getAllAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
  });

  return accounts;
}

/**
 * Get account by ID with transaction history
 */
export async function getAccountById(id: string): Promise<AccountWithEntries> {
  if (!id) {
    throw new HttpError(400, "Account ID is required");
  }

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      entries: {
        include: { transaction: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  return account;
}

/**
 * Check if account exists
 */
export async function accountExists(id: string): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { id },
    select: { id: true },
  });

  return !!account;
}
