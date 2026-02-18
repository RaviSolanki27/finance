import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  // Clean existing data
  await prisma.transaction.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // Create a user
  const user = await prisma.user.create({
    data: {
      email: "adaline@example.com",
      password: "hashed_password_here",
      name: "Adaline Lively",
      image: null,
    },
  });

  console.log("Created user:", user);

  // Create accounts
  const bankAccount = await prisma.account.create({
    data: {
      name: "HDFC Bank",
      type: "BANK",
      balance: 15700.0,
      accountNumber: "1234567890",
      userId: user.id,
    },
  });

  const walletAccount = await prisma.account.create({
    data: {
      name: "Amazon Pay",
      type: "WALLET",
      balance: 8500.0,
      email: "adaline@example.com",
      userId: user.id,
    },
  });

  await prisma.account.create({
    data: {
      name: "Cash",
      type: "CASH",
      balance: 2222.0,
      userId: user.id,
    },
  });

  const savingsAccount = await prisma.account.create({
    data: {
      name: "Savings Account",
      type: "BANK",
      balance: 32913.0,
      accountNumber: "9876543210",
      userId: user.id,
    },
  });

  console.log("Created accounts");

  // Create payment methods
  const visaCard = await prisma.paymentMethod.create({
    data: {
      type: "CARD",
      label: "VISA *3254",
      isActive: true,
      isDefault: true,
      accountId: bankAccount.id,
    },
  });

  const mastercardPayment = await prisma.paymentMethod.create({
    data: {
      type: "CARD",
      label: "Mastercard *2154",
      isActive: true,
      isDefault: false,
      accountId: bankAccount.id,
    },
  });

  const upiPayment = await prisma.paymentMethod.create({
    data: {
      type: "WALLET",
      label: "UPI",
      isActive: true,
      isDefault: false,
      accountId: walletAccount.id,
    },
  });

  console.log("Created payment methods");

  // Create transactions
  await prisma.transaction.create({
    data: {
      description: "YouTube Subscription",
      amount: 10.0,
      type: "EXPENSE",
      category: "Subscription",
      date: new Date("2025-07-25T12:30:00"),
      userId: user.id,
      accountId: bankAccount.id,
      paymentMethodId: visaCard.id,
    },
  });

  await prisma.transaction.create({
    data: {
      description: "Reserved",
      amount: 150.0,
      type: "EXPENSE",
      category: "Shopping",
      date: new Date("2025-07-26T15:00:00"),
      userId: user.id,
      accountId: bankAccount.id,
      paymentMethodId: mastercardPayment.id,
    },
  });

  await prisma.transaction.create({
    data: {
      description: "Yaposhka",
      amount: 80.0,
      type: "EXPENSE",
      category: "Cafe & Restaurants",
      date: new Date("2025-07-27T09:00:00"),
      userId: user.id,
      accountId: walletAccount.id,
      paymentMethodId: upiPayment.id,
    },
  });

  await prisma.transaction.create({
    data: {
      description: "Monthly Salary",
      amount: 5000.0,
      type: "INCOME",
      category: "Salary",
      date: new Date("2025-07-01T09:00:00"),
      userId: user.id,
      accountId: savingsAccount.id,
      paymentMethodId: visaCard.id,
    },
  });

  console.log("Created transactions");
  console.log("Seed data created successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
