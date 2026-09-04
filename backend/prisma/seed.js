const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding SmartSpend database...');

  // 1. Clean existing tables
  await prisma.auditLog.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@smartspend.ai',
      name: 'Sidhesh (Manager)',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@smartspend.ai',
      name: 'Sidhesh (Analyst)',
      password: passwordHash,
      role: 'ANALYST'
    }
  });

  console.log(`Created default users:`);
  console.log(` - Admin:   admin@smartspend.ai / password123`);
  console.log(` - Analyst: analyst@smartspend.ai / password123`);

  // 3. Seed Realistic Transactions
  const seedTransactions = [
    {
      transactionId: 'TXN-1001',
      type: 'PAYMENT',
      amount: 850.00,
      sender: 'C123456789',
      receiver: 'M987654321',
      oldBalanceOrig: 12500.00,
      newBalanceOrig: 11650.00,
      oldBalanceDest: 0.00,
      newBalanceDest: 0.00,
      fraudProbability: 0.03,
      riskScore: 3,
      riskLevel: 'LOW',
      status: 'APPROVED',
      isFraud: false,
      step: 14,
      reasons: [{ factor: 'Routine commercial payment to registered merchant', severity: 'LOW', code: 'ROUTINE_PAYMENT' }]
    },
    {
      transactionId: 'TXN-1002',
      type: 'TRANSFER',
      amount: 85400.00,
      sender: 'C839201948',
      receiver: 'C492019482',
      oldBalanceOrig: 85400.00,
      newBalanceOrig: 0.00,
      oldBalanceDest: 0.00,
      newBalanceDest: 85400.00,
      fraudProbability: 0.91,
      riskScore: 91,
      riskLevel: 'HIGH',
      status: 'FLAGGED',
      isFraud: true,
      step: 22,
      reasons: [
        { factor: 'Account balance completely drained in a single transaction', severity: 'CRITICAL', code: 'DRAIN_ACCOUNT' },
        { factor: 'Destination account had zero previous transaction history/balance', severity: 'MEDIUM', code: 'NEW_DESTINATION_ACCOUNT' },
        { factor: 'High-risk TRANSFER operation exceeding high-volume threshold', severity: 'HIGH', code: 'HIGH_VALUE_TRANSFER' }
      ]
    },
    {
      transactionId: 'TXN-1003',
      type: 'PAYMENT',
      amount: 1200.00,
      sender: 'C981273948',
      receiver: 'M102938475',
      oldBalanceOrig: 34500.00,
      newBalanceOrig: 33300.00,
      oldBalanceDest: 0.00,
      newBalanceDest: 0.00,
      fraudProbability: 0.04,
      riskScore: 4,
      riskLevel: 'LOW',
      status: 'APPROVED',
      isFraud: false,
      step: 11,
      reasons: [{ factor: 'Transaction matches standard verified user behavioral patterns', severity: 'LOW', code: 'NORMAL_BEHAVIOR' }]
    },
    {
      transactionId: 'TXN-1004',
      type: 'CASH_OUT',
      amount: 76000.00,
      sender: 'C492019482',
      receiver: 'C993847281',
      oldBalanceOrig: 76000.00,
      newBalanceOrig: 0.00,
      oldBalanceDest: 0.00,
      newBalanceDest: 0.00,
      fraudProbability: 0.94,
      riskScore: 94,
      riskLevel: 'HIGH',
      status: 'BLOCKED',
      isFraud: true,
      step: 23,
      reasons: [
        { factor: 'Account balance completely drained in a single transaction', severity: 'CRITICAL', code: 'DRAIN_ACCOUNT' },
        { factor: 'Rapid pass-through: recipient balance immediately cleared (potential money mule)', severity: 'CRITICAL', code: 'RAPID_PASSTHROUGH' },
        { factor: 'High-risk CASH_OUT operation exceeding high-volume threshold', severity: 'HIGH', code: 'HIGH_VALUE_TRANSFER' }
      ]
    },
    {
      transactionId: 'TXN-1005',
      type: 'TRANSFER',
      amount: 12200.00,
      sender: 'C102938172',
      receiver: 'C883719284',
      oldBalanceOrig: 15000.00,
      newBalanceOrig: 2800.00,
      oldBalanceDest: 500.00,
      newBalanceDest: 12700.00,
      fraudProbability: 0.76,
      riskScore: 76,
      riskLevel: 'HIGH',
      status: 'UNDER_REVIEW',
      isFraud: true,
      step: 3,
      reasons: [
        { factor: 'Off-hours transaction executed during low-activity window (03:00 UTC)', severity: 'LOW', code: 'ODD_HOURS' },
        { factor: 'Transfer amount significantly exceeds sender historical average balance', severity: 'HIGH', code: 'EXCEEDS_HISTORICAL_AVG' }
      ]
    },
    {
      transactionId: 'TXN-1006',
      type: 'CASH_IN',
      amount: 25000.00,
      sender: 'C394827163',
      receiver: 'C102938475',
      oldBalanceOrig: 5000.00,
      newBalanceOrig: 30000.00,
      oldBalanceDest: 100000.00,
      newBalanceDest: 75000.00,
      fraudProbability: 0.02,
      riskScore: 2,
      riskLevel: 'LOW',
      status: 'APPROVED',
      isFraud: false,
      step: 16,
      reasons: [{ factor: 'Standard verified deposit / cash-in operation', severity: 'LOW', code: 'NORMAL_BEHAVIOR' }]
    },
    {
      transactionId: 'TXN-1007',
      type: 'TRANSFER',
      amount: 3200.00,
      sender: 'C482910485',
      receiver: 'C736192847',
      oldBalanceOrig: 6000.00,
      newBalanceOrig: 2800.00,
      oldBalanceDest: 12000.00,
      newBalanceDest: 15200.00,
      fraudProbability: 0.44,
      riskScore: 44,
      riskLevel: 'MEDIUM',
      status: 'APPROVED',
      isFraud: false,
      step: 2,
      reasons: [
        { factor: 'Off-hours transaction executed during low-activity window (02:00 UTC)', severity: 'LOW', code: 'ODD_HOURS' },
        { factor: 'Elevated risk factors detected by random forest ensemble classifier', severity: 'MEDIUM', code: 'GENERAL_RISK' }
      ]
    },
    {
      transactionId: 'TXN-1008',
      type: 'DEBIT',
      amount: 450.00,
      sender: 'C837261940',
      receiver: 'C284910385',
      oldBalanceOrig: 12000.00,
      newBalanceOrig: 11550.00,
      oldBalanceDest: 50000.00,
      newBalanceDest: 50450.00,
      fraudProbability: 0.01,
      riskScore: 1,
      riskLevel: 'LOW',
      status: 'APPROVED',
      isFraud: false,
      step: 18,
      reasons: [{ factor: 'Transaction matches standard verified user behavioral patterns', severity: 'LOW', code: 'NORMAL_BEHAVIOR' }]
    }
  ];

  // Generate 70 additional simulated transactions
  const types = ['PAYMENT', 'CASH_OUT', 'TRANSFER', 'CASH_IN', 'DEBIT'];
  for (let i = 9; i <= 80; i++) {
    const isHighRisk = i % 7 === 0;
    const isMediumRisk = i % 5 === 0 && !isHighRisk;
    
    let type = isHighRisk ? (Math.random() > 0.5 ? 'TRANSFER' : 'CASH_OUT') : types[i % types.length];
    let amount = isHighRisk ? Math.floor(40000 + Math.random() * 150000) : Math.floor(100 + Math.random() * 8000);
    let oldOrig = isHighRisk ? amount : Math.floor(amount * (1.5 + Math.random() * 4));
    let newOrig = isHighRisk ? 0 : oldOrig - amount;
    let oldDest = isHighRisk ? 0 : Math.floor(Math.random() * 50000);
    let newDest = isHighRisk ? (Math.random() > 0.5 ? amount : 0) : oldDest + amount;
    
    let riskScore = isHighRisk ? Math.floor(75 + Math.random() * 24) : (isMediumRisk ? Math.floor(35 + Math.random() * 32) : Math.floor(2 + Math.random() * 25));
    let riskLevel = riskScore <= 30 ? 'LOW' : (riskScore <= 70 ? 'MEDIUM' : 'HIGH');
    let fraudProb = parseFloat((riskScore / 100).toFixed(2));
    let status = riskLevel === 'HIGH' ? (Math.random() > 0.4 ? 'BLOCKED' : 'FLAGGED') : (riskLevel === 'MEDIUM' ? 'UNDER_REVIEW' : 'APPROVED');

    const reasons = [];
    if (isHighRisk) {
      reasons.push({ factor: 'Account balance completely drained in a single transaction', severity: 'CRITICAL', code: 'DRAIN_ACCOUNT' });
      reasons.push({ factor: `High-risk ${type} operation exceeding threshold`, severity: 'HIGH', code: 'HIGH_VALUE_TRANSFER' });
    } else if (isMediumRisk) {
      reasons.push({ factor: 'Elevated risk velocity pattern detected', severity: 'MEDIUM', code: 'GENERAL_RISK' });
    } else {
      reasons.push({ factor: 'Routine transaction matching user profile', severity: 'LOW', code: 'NORMAL_BEHAVIOR' });
    }

    seedTransactions.push({
      transactionId: `TXN-${1000 + i}`,
      type,
      amount: parseFloat(amount.toFixed(2)),
      sender: `C${Math.floor(100000000 + Math.random() * 900000000)}`,
      receiver: (type === 'PAYMENT' ? 'M' : 'C') + Math.floor(100000000 + Math.random() * 900000000),
      oldBalanceOrig: parseFloat(oldOrig.toFixed(2)),
      newBalanceOrig: parseFloat(newOrig.toFixed(2)),
      oldBalanceDest: parseFloat(oldDest.toFixed(2)),
      newBalanceDest: parseFloat(newDest.toFixed(2)),
      fraudProbability: fraudProb,
      riskScore,
      riskLevel,
      status,
      isFraud: isHighRisk,
      step: Math.floor(1 + Math.random() * 720),
      reasons
    });
  }

  for (const t of seedTransactions) {
    const { reasons, ...txnData } = t;
    const createdTxn = await prisma.transaction.create({
      data: {
        ...txnData,
        riskFactors: {
          create: reasons.map(r => ({
            factor: r.factor,
            severity: r.severity,
            code: r.code
          }))
        }
      }
    });

    if (createdTxn.status === 'BLOCKED' || createdTxn.status === 'FLAGGED') {
      await prisma.auditLog.create({
        data: {
          transactionId: createdTxn.id,
          userId: analyst.id,
          action: `SYSTEM_FLAGGED_${createdTxn.status}`,
          notes: `Automatic high-risk hold triggered (Risk Score: ${createdTxn.riskScore}/100)`
        }
      });
    }
  }

  console.log(`Successfully seeded ${seedTransactions.length} transactions with explainable risk factors!`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
