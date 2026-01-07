import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { transfer, withdraw, deposit } from "../services/ledger";

const router = Router();

// Create a new account
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, initialBalance = 0 } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const account = await prisma.account.create({
      data: {
        name,
        balance: initialBalance,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Get all accounts
router.get("/", async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(accounts);
  } catch (error) {
    console.error("Get accounts error:", error);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// Get account by ID with transaction history
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (error) {
    console.error("Get account error:", error);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// Transfer between accounts
router.post("/transfer", async (req: Request, res: Response) => {
  try {
    const { from, to, amount, description } = req.body;

    if (!from || !to || !amount) {
      return res
        .status(400)
        .json({ error: "from, to, and amount are required" });
    }

    const transaction = await transfer(
      from,
      to,
      parseFloat(amount),
      description
    );
    res.json({ success: true, transaction });
  } catch (error: any) {
    console.error("Transfer error:", error);
    res.status(400).json({ error: error.message || "Transfer failed" });
  }
});

// Withdraw from account
router.post("/:id/withdraw", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const result = await withdraw(id, parseFloat(amount));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Withdraw error:", error);
    res.status(400).json({ error: error.message || "Withdrawal failed" });
  }
});

// Deposit to account
router.post("/:id/deposit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const result = await deposit(id, parseFloat(amount));
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Deposit error:", error);
    res.status(400).json({ error: error.message || "Deposit failed" });
  }
});

export default router;
