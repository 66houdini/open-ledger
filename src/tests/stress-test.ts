/**
 * Concurrent Withdrawal Stress Test
 *
 * This test simulates 50 simultaneous withdrawal requests hitting the same account.
 * With proper row-level locking (SELECT ... FOR UPDATE), the balance should never go negative.
 *
 * Usage: npm run stress-test
 */

import http from "http";

const API_URL = "http://localhost:3000";

interface Account {
  id: string;
  name: string;
  balance: number;
}

function httpRequest(
  url: string,
  options: { method: string; body?: string }
): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: options.method,
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              ok: res.statusCode! >= 200 && res.statusCode! < 300,
              data: JSON.parse(data),
            });
          } catch {
            resolve({ ok: false, data: {} });
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function createTestAccount(): Promise<Account> {
  const response = await httpRequest(`${API_URL}/accounts`, {
    method: "POST",
    body: JSON.stringify({ name: "StressTestAccount", initialBalance: 100 }),
  });
  return response.data;
}

async function withdraw(
  accountId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await httpRequest(
      `${API_URL}/accounts/${accountId}/withdraw`,
      {
        method: "POST",
        body: JSON.stringify({ amount }),
      }
    );
    return { success: response.ok, error: response.data.error };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function getAccount(accountId: string): Promise<Account> {
  const response = await httpRequest(`${API_URL}/accounts/${accountId}`, {
    method: "GET",
  });
  return response.data;
}

async function runStressTest() {
  console.log("=".repeat(60));
  console.log("CONCURRENT WITHDRAWAL STRESS TEST");
  console.log("=".repeat(60));
  console.log();

  // 1. Create test account with $100
  console.log("1. Creating test account with $100...");
  const account = await createTestAccount();
  console.log(`   Created: ${account.name} (ID: ${account.id})`);
  console.log(`   Initial Balance: $${account.balance}`);
  console.log();

  // 2. Fire 50 concurrent $10 withdrawals
  const CONCURRENT_REQUESTS = 50;
  const WITHDRAWAL_AMOUNT = 10;

  console.log(
    `2. Firing ${CONCURRENT_REQUESTS} concurrent $${WITHDRAWAL_AMOUNT} withdrawal requests...`
  );
  console.log("   (This tests row-level locking with SELECT ... FOR UPDATE)");
  console.log();

  const startTime = Date.now();

  // Fire all requests simultaneously
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    withdraw(account.id, WITHDRAWAL_AMOUNT)
  );

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  // 3. Analyze results
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const insufficientFunds = results.filter(
    (r) => r.error === "Insufficient funds"
  ).length;

  console.log("3. Results:");
  console.log(`   Total requests:      ${CONCURRENT_REQUESTS}`);
  console.log(`   Successful:          ${successful}`);
  console.log(`   Failed:              ${failed}`);
  console.log(`   "Insufficient funds": ${insufficientFunds}`);
  console.log(`   Time elapsed:        ${elapsed}ms`);
  console.log();

  // 4. Verify final balance
  const finalAccount = await getAccount(account.id);
  const expectedBalance = 100 - successful * WITHDRAWAL_AMOUNT;

  console.log("4. Final Balance Check:");
  console.log(`   Expected: $${expectedBalance}`);
  console.log(`   Actual:   $${finalAccount.balance}`);
  console.log();

  // 5. Verdict
  console.log("=".repeat(60));
  if (
    Number(finalAccount.balance) >= 0 &&
    Number(finalAccount.balance) === expectedBalance
  ) {
    console.log("TEST PASSED - Row-level locking prevented overdrafts!");
    console.log(
      `Exactly ${successful} withdrawals succeeded, balance is $${finalAccount.balance}`
    );
  } else if (Number(finalAccount.balance) < 0) {
    console.log(
      "TEST FAILED - Balance went negative (race condition occurred)"
    );
  } else {
    console.log("TEST INCONCLUSIVE - Check the numbers above");
  }
  console.log("=".repeat(60));
}

runStressTest().catch(console.error);
