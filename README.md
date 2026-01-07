# Phase 1: The Data Integrity Challenge

## Goal

Master **Relational Data**, **ACID Compliance**, and **Dockerization**.

### Tech Stack

- **Backend:** Node.js (TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **DevOps:** Docker

---

## Project: A Double-Entry Ledger System (Fintech Core)

Most MERN apps rely on MongoDB (NoSQL), which is forgiving. **Financial systems are not.** In this project, you will build the backend for a banking wallet where money cannot just "disappear" or "appear."

## The Challenge

1.  **Double-Entry Accounting:** Design a DB schema that records every transaction as a credit and a debit.
2.  **Strict ACID Compliance:** If a user transfers money, you must use **Database Transactions** (Prisma Interactive Transactions) to ensure that if the Credit fails, the Debit rolls back.
3.  **Concurrency Control:** Simulate 100 simultaneous requests trying to withdraw from the same account. Use **Row-Level Locking** (`SELECT ... FOR UPDATE`) to prevent negative balances.
4.  **Dockerization:** Containerize the Node app and the Postgres DB using `docker-compose`. Ensure the DB data persists even if the container crashes using **Volumes**.

---

## Why this levels you up

You stop thinking in "JSON objects" and start thinking in **Relational Integrity** and **Race Conditions**.
