import { Router, Request, Response } from "express";
import { withErrors, json } from "../lib/utils/with-errors";
import { HttpError } from "../lib/utils/errors";
import * as accountService from "./services/account.service";
import * as ledgerService from "./services/ledger.service";

const accountsRouter = Router();
accountsRouter.post(
  "/",
  withErrors(async (req: Request) => {
    const { name, initialBalance } = req.body;
    const account = await accountService.createAccount({
      name,
      initialBalance,
    });
    return json(201, { success: true, data: account });
  }),
);

accountsRouter.get(
  "/",
  withErrors(async () => {
    const accounts = await accountService.getAllAccounts();
    return json(200, { success: true, data: accounts });
  }),
);

accountsRouter.get(
  "/:id",
  withErrors(async (req: Request) => {
    const { id } = req.params;
    if (!id) {
      throw new HttpError(400, "Account ID is required");
    }
    const account = await accountService.getAccountById(id);
    return json(200, { success: true, data: account });
  }),
);

accountsRouter.post(
  "/transfer",
  withErrors(async (req: Request) => {
    const { from, to, amount, description } = req.body;

    if (!from || !to || !amount) {
      throw new HttpError(400, "from, to, and amount are required");
    }

    const transaction = await ledgerService.transfer(
      from,
      to,
      parseFloat(amount),
      description,
    );
    return json(200, { success: true, data: { transaction } });
  }),
);

accountsRouter.post(
  "/:id/withdraw",
  withErrors(async (req: Request) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      throw new HttpError(400, "Account ID is required");
    }

    if (!amount) {
      throw new HttpError(400, "Amount is required");
    }

    const result = await ledgerService.withdraw(id, parseFloat(amount));
    return json(200, { success: true, data: result });
  }),
);

accountsRouter.post(
  "/:id/deposit",
  withErrors(async (req: Request) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (!id) {
      throw new HttpError(400, "Account ID is required");
    }

    if (!amount) {
      throw new HttpError(400, "Amount is required");
    }

    const result = await ledgerService.deposit(id, parseFloat(amount));
    return json(200, { success: true, data: result });
  }),
);

export default accountsRouter;
