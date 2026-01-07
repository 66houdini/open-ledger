# Double-Entry Ledger System

A production-ready fintech backend demonstrating **ACID-compliant transactions**, **double-entry bookkeeping**, and **row-level locking** for concurrent access control.

Built with Node.js, TypeScript, Express, PostgreSQL, and Prisma.

## Features

- **Double-Entry Accounting** — Every transaction creates balanced debit/credit entries
- **ACID Transactions** — Atomic operations with automatic rollback on failure
- **Row-Level Locking** — Prevents race conditions during concurrent withdrawals
- **Docker Ready** — One command to run the full stack

## Tech Stack

| Layer     | Technology    |
| --------- | ------------- |
| Runtime   | Node.js 20    |
| Language  | TypeScript    |
| Framework | Express       |
| Database  | PostgreSQL 15 |
| ORM       | Prisma        |
| Container | Docker        |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/fintech-ledger.git
cd fintech-ledger
npm install
```

### 2. Start PostgreSQL

```bash
docker run --name fintech-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ledger \
  -p 5432:5432 -d postgres:15-alpine
```

### 3. Setup Database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

## API Reference

### Accounts

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| `POST` | `/accounts`     | Create account           |
| `GET`  | `/accounts`     | List all accounts        |
| `GET`  | `/accounts/:id` | Get account with history |

### Transactions

| Method | Endpoint                 | Description               |
| ------ | ------------------------ | ------------------------- |
| `POST` | `/accounts/transfer`     | Transfer between accounts |
| `POST` | `/accounts/:id/withdraw` | Withdraw from account     |
| `POST` | `/accounts/:id/deposit`  | Deposit to account        |

### Examples

**Create Account**

```bash
curl -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "initialBalance": 1000}'
```

**Transfer Money**

```bash
curl -X POST http://localhost:3000/accounts/transfer \
  -H "Content-Type: application/json" \
  -d '{"from": "alice-id", "to": "bob-id", "amount": 100}'
```

## Database Schema

```
Account          Transaction        Entry
--------         -----------        -----
id (uuid)        id (uuid)          id (uuid)
name             description        amount
balance          createdAt          type (DEBIT/CREDIT)
createdAt                           accountId
updatedAt                           transactionId
```

Every transaction creates **two entries** (debit + credit) that must balance.

## Key Concepts

### Double-Entry Bookkeeping

```
Transfer $100: Alice → Bob

| Account | Debit | Credit |
|---------|-------|--------|
| Alice   | $100  |        |
| Bob     |       | $100   |
```

### ACID Compliance

```typescript
await prisma.$transaction(async (tx) => {
  // Lock accounts, validate balance, create entries
  // If ANY step fails, everything rolls back
});
```

### Row-Level Locking

```sql
SELECT * FROM "Account" WHERE id = $1 FOR UPDATE;
-- Prevents concurrent modifications until transaction commits
```

## Docker Deployment

```bash
docker-compose up -d
```

This starts:

- **app** — Node.js API on port 3000
- **db** — PostgreSQL on port 5432

## Project Structure

```
├── src/
│   ├── index.ts          # Express server
│   ├── routes/
│   │   └── accounts.ts   # API endpoints
│   ├── services/
│   │   └── ledger.ts     # ACID transactions
│   └── lib/
│       └── prisma.ts     # Prisma client
├── prisma/
│   └── schema.prisma     # Database models
├── docker-compose.yml
└── Dockerfile
```

## Scripts

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start dev server with hot reload |
| `npm run build`      | Build for production             |
| `npm start`          | Run production build             |
| `npx prisma studio`  | Open database GUI                |
| `npx prisma db push` | Push schema to database          |

## License

MIT
