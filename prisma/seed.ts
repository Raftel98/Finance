import { PrismaClient, CategoryType, AssetType, LiabilityType, RecurringFrequency, RecurringType, ForecastScenarioType } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.recurringRule.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.netWorthSnapshot.deleteMany();
  await prisma.financialGoal.deleteMany();
  await prisma.scenarioAdjustment.deleteMany();
  await prisma.forecastScenario.deleteMany();
  await prisma.liability.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // System categories
  const categories = await Promise.all([
    // Income
    prisma.category.create({ data: { name: "Salary", type: CategoryType.INCOME, icon: "briefcase", color: "#1D9E75", isSystem: true } }),
    prisma.category.create({ data: { name: "Freelance", type: CategoryType.INCOME, icon: "laptop", color: "#378ADD", isSystem: true } }),
    prisma.category.create({ data: { name: "Dividends", type: CategoryType.INCOME, icon: "chart-line", color: "#EF9F27", isSystem: true } }),
    prisma.category.create({ data: { name: "Rental income", type: CategoryType.INCOME, icon: "home", color: "#5DCAA5", isSystem: true } }),
    prisma.category.create({ data: { name: "Other income", type: CategoryType.INCOME, icon: "coins", color: "#9FE1CB", isSystem: true } }),
    // Expense
    prisma.category.create({ data: { name: "Housing", type: CategoryType.EXPENSE, icon: "home", color: "#378ADD", isSystem: true } }),
    prisma.category.create({ data: { name: "Food & dining", type: CategoryType.EXPENSE, icon: "tools-kitchen-2", color: "#E24B4A", isSystem: true } }),
    prisma.category.create({ data: { name: "Transport", type: CategoryType.EXPENSE, icon: "car", color: "#EF9F27", isSystem: true } }),
    prisma.category.create({ data: { name: "Entertainment", type: CategoryType.EXPENSE, icon: "device-tv", color: "#D4537E", isSystem: true } }),
    prisma.category.create({ data: { name: "Healthcare", type: CategoryType.EXPENSE, icon: "heart", color: "#F0997B", isSystem: true } }),
    prisma.category.create({ data: { name: "Education", type: CategoryType.EXPENSE, icon: "school", color: "#534AB7", isSystem: true } }),
    prisma.category.create({ data: { name: "Shopping", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#AFA9EC", isSystem: true } }),
    prisma.category.create({ data: { name: "Utilities", type: CategoryType.EXPENSE, icon: "bolt", color: "#888780", isSystem: true } }),
    prisma.category.create({ data: { name: "Debt payment", type: CategoryType.EXPENSE, icon: "credit-card", color: "#F7C1C1", isSystem: true } }),
    prisma.category.create({ data: { name: "Investments", type: CategoryType.EXPENSE, icon: "trending-up", color: "#9FE1CB", isSystem: true } }),
    prisma.category.create({ data: { name: "Other expenses", type: CategoryType.EXPENSE, icon: "dots", color: "#D3D1C7", isSystem: true } }),
  ]);

  console.log(`✅ Created ${categories.length} system categories`);

  // Demo user
  const passwordHash = await argon2.hash("demo123456");
  const user = await prisma.user.create({
    data: {
      email: "demo@pwos.app",
      passwordHash,
      name: "Rafael Sanchez",
      baseCurrency: "COP",
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  // Assets
  const [bancolombia, etf, btc, checking, vehicle] = await Promise.all([
    prisma.asset.create({ data: { userId: user.id, name: "Bancolombia savings", type: AssetType.SAVINGS, currency: "COP", currentValue: 28000000, isLiquid: true, institution: "Bancolombia" } }),
    prisma.asset.create({ data: { userId: user.id, name: "ETF S&P 500 (IVV)", type: AssetType.ETF, currency: "USD", currentValue: 4100, purchaseValue: 3800, purchaseDate: new Date("2024-01-15"), isLiquid: true } }),
    prisma.asset.create({ data: { userId: user.id, name: "Bitcoin", type: AssetType.CRYPTO, currency: "USD", currentValue: 1680, purchaseValue: 1200, purchaseDate: new Date("2023-06-01"), isLiquid: true } }),
    prisma.asset.create({ data: { userId: user.id, name: "Bancolombia checking", type: AssetType.CHECKING, currency: "COP", currentValue: 7400000, isLiquid: true, institution: "Bancolombia" } }),
    prisma.asset.create({ data: { userId: user.id, name: "Honda HR-V 2022", type: AssetType.VEHICLE, currency: "COP", currentValue: 45000000, purchaseValue: 52000000, purchaseDate: new Date("2022-03-01"), isLiquid: false } }),
  ]);

  console.log("✅ Created 5 assets");

  // Credit cards
  const [visaCard] = await Promise.all([
    prisma.creditCard.create({ data: { userId: user.id, name: "Visa Platinum", issuer: "Bancolombia", creditLimit: 10000000, currency: "COP", closingDay: 25, paymentDay: 5, color: "#185FA5" } }),
    prisma.creditCard.create({ data: { userId: user.id, name: "Mastercard Gold", issuer: "Davivienda", creditLimit: 5000000, currency: "COP", closingDay: 20, paymentDay: 1, color: "#3B6D11" } }),
  ]);

  // Liabilities
  await Promise.all([
    prisma.liability.create({ data: { userId: user.id, name: "Visa Platinum", type: LiabilityType.CREDIT_CARD, currency: "COP", balance: 4200000, interestRate: 26, minimumPayment: 420000, dueDate: new Date("2026-06-15"), creditCardId: visaCard.id } }),
    prisma.liability.create({ data: { userId: user.id, name: "Personal loan — Bancolombia", type: LiabilityType.PERSONAL_LOAN, currency: "COP", balance: 8100000, interestRate: 14, minimumPayment: 400000, dueDate: new Date("2026-06-20") } }),
  ]);

  console.log("✅ Created credit cards and liabilities");

  // Recurring rules
  const salaryCategory = categories.find(c => c.name === "Salary")!;
  const housingCategory = categories.find(c => c.name === "Housing")!;
  const foodCategory = categories.find(c => c.name === "Food & dining")!;
  const transportCategory = categories.find(c => c.name === "Transport")!;
  const investmentsCategory = categories.find(c => c.name === "Investments")!;

  await Promise.all([
    prisma.recurringRule.create({ data: { userId: user.id, name: "Monthly salary", type: RecurringType.INCOME, amount: 8500000, currency: "COP", categoryId: salaryCategory.id, frequency: RecurringFrequency.MONTHLY, startDate: new Date("2024-01-01"), dayOfMonth: 1, isActive: true, nextOccurrence: new Date("2026-07-01") } }),
    prisma.recurringRule.create({ data: { userId: user.id, name: "Rent", type: RecurringType.EXPENSE, amount: 2200000, currency: "COP", categoryId: housingCategory.id, frequency: RecurringFrequency.MONTHLY, startDate: new Date("2024-01-01"), dayOfMonth: 28, isActive: true, nextOccurrence: new Date("2026-06-28") } }),
    prisma.recurringRule.create({ data: { userId: user.id, name: "ETF monthly investment", type: RecurringType.EXPENSE, amount: 500, currency: "USD", categoryId: investmentsCategory.id, frequency: RecurringFrequency.MONTHLY, startDate: new Date("2024-06-01"), dayOfMonth: 5, isActive: true, nextOccurrence: new Date("2026-07-05") } }),
  ]);

  console.log("✅ Created recurring rules");

  // Forecast scenarios
  await Promise.all([
    prisma.forecastScenario.create({ data: { userId: user.id, name: "Base scenario", type: ForecastScenarioType.BASE, isActive: true } }),
    prisma.forecastScenario.create({ data: { userId: user.id, name: "Optimistic", type: ForecastScenarioType.OPTIMISTIC, isActive: false } }),
    prisma.forecastScenario.create({ data: { userId: user.id, name: "Conservative", type: ForecastScenarioType.CONSERVATIVE, isActive: false } }),
  ]);

  // Financial goals
  await Promise.all([
    prisma.financialGoal.create({ data: { userId: user.id, name: "Target net worth", targetAmount: 100000000, currency: "COP", deadline: new Date("2026-12-31"), currentAmount: 58400000, trackingType: "NET_WORTH" } }),
    prisma.financialGoal.create({ data: { userId: user.id, name: "Emergency fund", targetAmount: 20000000, currency: "COP", deadline: new Date("2027-03-31"), currentAmount: 8000000, trackingType: "SAVINGS" } }),
  ]);

  // Exchange rates (USD base)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await Promise.all([
    prisma.exchangeRate.create({ data: { baseCurrency: "USD", targetCurrency: "COP", rate: 4130, effectiveDate: today, source: "API" } }),
    prisma.exchangeRate.create({ data: { baseCurrency: "USD", targetCurrency: "EUR", rate: 0.92, effectiveDate: today, source: "API" } }),
    prisma.exchangeRate.create({ data: { baseCurrency: "USD", targetCurrency: "GBP", rate: 0.79, effectiveDate: today, source: "API" } }),
    prisma.exchangeRate.create({ data: { baseCurrency: "USD", targetCurrency: "MXN", rate: 17.1, effectiveDate: today, source: "API" } }),
    prisma.exchangeRate.create({ data: { baseCurrency: "USD", targetCurrency: "CRC", rate: 518, effectiveDate: today, source: "API" } }),
    prisma.exchangeRate.create({ data: { baseCurrency: "COP", targetCurrency: "USD", rate: 0.000242, effectiveDate: today, source: "API" } }),
  ]);

  // Transactions (last 3 months)
  const incomeCategories = categories.filter(c => c.type === CategoryType.INCOME);
  const expenseCategories = categories.filter(c => c.type === CategoryType.EXPENSE);

  const txData = [];
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const month = new Date(2026, 5 - monthOffset, 1);
    // Salary
    txData.push({ userId: user.id, type: "INCOME" as const, amount: 8500000, currency: "COP", baseAmount: 8500000, exchangeRate: 1, date: new Date(month.getFullYear(), month.getMonth(), 1), categoryId: salaryCategory.id, description: "Salary — Rappicard MX", isRecurring: true, source: "MANUAL" as const });
    // Rent
    txData.push({ userId: user.id, type: "EXPENSE" as const, amount: 2200000, currency: "COP", baseAmount: 2200000, exchangeRate: 1, date: new Date(month.getFullYear(), month.getMonth(), 28), categoryId: housingCategory.id, description: "Rent — Bogotá apartment", merchant: "Propietario", isRecurring: true, source: "MANUAL" as const });
    // Food
    txData.push({ userId: user.id, type: "EXPENSE" as const, amount: 480000, currency: "COP", baseAmount: 480000, exchangeRate: 1, date: new Date(month.getFullYear(), month.getMonth(), 15), categoryId: foodCategory.id, description: "Groceries", merchant: "Rappi", source: "MANUAL" as const });
    // Transport
    txData.push({ userId: user.id, type: "EXPENSE" as const, amount: 120000, currency: "COP", baseAmount: 120000, exchangeRate: 1, date: new Date(month.getFullYear(), month.getMonth(), 10), categoryId: transportCategory.id, description: "Transport", merchant: "Uber / Transmilenio", source: "MANUAL" as const });
    // Netflix USD
    txData.push({ userId: user.id, type: "EXPENSE" as const, amount: 17.99, currency: "USD", baseAmount: 74300, exchangeRate: 4130, date: new Date(month.getFullYear(), month.getMonth(), 15), categoryId: expenseCategories.find(c => c.name === "Entertainment")!.id, description: "Netflix subscription", merchant: "Netflix", source: "MANUAL" as const });
  }

  await prisma.transaction.createMany({ data: txData });

  // Net worth snapshot
  await prisma.netWorthSnapshot.create({
    data: {
      userId: user.id,
      snapshotDate: new Date("2026-05-31"),
      totalAssets: 70700000,
      totalLiabilities: 12300000,
      netWorth: 58400000,
      currency: "COP",
      assetBreakdown: { SAVINGS: 28000000, ETF: 16930000, CRYPTO: 6940000, CHECKING: 7400000, VEHICLE: 45000000 },
      liabilityBreakdown: { CREDIT_CARD: 4200000, PERSONAL_LOAN: 8100000 },
      currencyBreakdown: { COP: 41200000, USD: 17200000 },
    },
  });

  console.log("✅ Seeding complete!");
  console.log("\n📧 Demo credentials:");
  console.log("   Email: demo@pwos.app");
  console.log("   Password: demo123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
