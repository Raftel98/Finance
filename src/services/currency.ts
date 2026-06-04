import { prisma } from "@/lib/prisma";
export { SUPPORTED_CURRENCIES, CURRENCY_LABELS } from "@/lib/constants";
export type { SupportedCurrency } from "@/lib/constants";

// ─── Rate Fetching ────────────────────────────────────────────────────────────

/**
 * Fetch latest rates from Open Exchange Rates and upsert into DB.
 * Called by daily cron job and on-demand when cache is stale.
 */
export async function fetchAndStoreRates(): Promise<void> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId) {
    console.warn("[currency] OPEN_EXCHANGE_RATES_APP_ID not set — skipping rate fetch");
    return;
  }

  const res = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`
  );
  if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`);

  const json = await res.json() as { rates: Record<string, number>; timestamp: number };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currencies = [...SUPPORTED_CURRENCIES, "USD"];
  const pairs: { base: string; target: string; rate: number }[] = [];

  // Store USD → everything
  for (const target of currencies) {
    if (json.rates[target]) {
      pairs.push({ base: "USD", target, rate: json.rates[target] });
    }
  }

  // Derive cross-rates for all supported pairs
  for (const base of SUPPORTED_CURRENCIES) {
    for (const target of SUPPORTED_CURRENCIES) {
      if (base === target) continue;
      const baseInUsd = json.rates[base];
      const targetInUsd = json.rates[target];
      if (baseInUsd && targetInUsd) {
        pairs.push({ base, target, rate: targetInUsd / baseInUsd });
      }
    }
  }

  // Upsert all pairs
  await Promise.all(
    pairs.map((p) =>
      prisma.exchangeRate.upsert({
        where: {
          baseCurrency_targetCurrency_effectiveDate: {
            baseCurrency: p.base,
            targetCurrency: p.target,
            effectiveDate: today,
          },
        },
        create: {
          baseCurrency: p.base,
          targetCurrency: p.target,
          rate: p.rate,
          effectiveDate: today,
          source: "API",
        },
        update: { rate: p.rate },
      })
    )
  );
}

// ─── Rate Lookup ──────────────────────────────────────────────────────────────

/**
 * Get the exchange rate between two currencies for a given date.
 * Falls back to the most recent rate if no exact match found.
 */
export async function getRate(
  from: string,
  to: string,
  date?: Date
): Promise<{ rate: number; rateDate: Date }> {
  if (from === to) return { rate: 1, rateDate: date ?? new Date() };

  const targetDate = date ?? new Date();
  targetDate.setHours(0, 0, 0, 0);

  // Try exact date first, then fall back to most recent
  const record = await prisma.exchangeRate.findFirst({
    where: {
      baseCurrency: from,
      targetCurrency: to,
      effectiveDate: { lte: targetDate },
    },
    orderBy: { effectiveDate: "desc" },
  });

  if (record) {
    return { rate: Number(record.rate), rateDate: record.effectiveDate };
  }

  // Try reverse rate
  const reverse = await prisma.exchangeRate.findFirst({
    where: {
      baseCurrency: to,
      targetCurrency: from,
      effectiveDate: { lte: targetDate },
    },
    orderBy: { effectiveDate: "desc" },
  });

  if (reverse) {
    return { rate: 1 / Number(reverse.rate), rateDate: reverse.effectiveDate };
  }

  throw new Error(`No exchange rate found for ${from} → ${to}`);
}

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Convert an amount from one currency to another.
 * Returns both the converted amount and the rate used.
 */
export async function convert(
  amount: number,
  from: string,
  to: string,
  date?: Date
): Promise<{ amount: number; rate: number; rateDate: Date }> {
  if (from === to) return { amount, rate: 1, rateDate: date ?? new Date() };

  const { rate, rateDate } = await getRate(from, to, date);
  return { amount: amount * rate, rate, rateDate };
}

/**
 * Enrich a raw amount+currency pair with baseAmount, exchangeRate, exchangeRateDate
 * in the user's base currency.
 */
export async function enrichWithBase(
  amount: number,
  currency: string,
  baseCurrency: string,
  date?: Date
): Promise<{
  baseAmount: number;
  exchangeRate: number;
  exchangeRateDate: Date;
}> {
  const { amount: baseAmount, rate, rateDate } = await convert(
    amount,
    currency,
    baseCurrency,
    date
  );
  return {
    baseAmount,
    exchangeRate: rate,
    exchangeRateDate: rateDate,
  };
}

// ─── Latest Rates Summary ─────────────────────────────────────────────────────

export async function getLatestRates(baseCurrency: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rates = await prisma.exchangeRate.findMany({
    where: {
      baseCurrency,
      effectiveDate: { lte: today },
      targetCurrency: { in: [...SUPPORTED_CURRENCIES] },
    },
    orderBy: { effectiveDate: "desc" },
    distinct: ["targetCurrency"],
  });

  return rates.map((r) => ({
    currency: r.targetCurrency,
    rate: Number(r.rate),
    date: r.effectiveDate,
  }));
}
