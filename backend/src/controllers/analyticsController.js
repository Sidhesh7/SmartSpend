const prisma = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalTransactions = await prisma.transaction.count();
    
    const [
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      fraudDetectedCount,
      flaggedCount,
      blockedCount
    ] = await Promise.all([
      prisma.transaction.count({ where: { riskLevel: 'HIGH' } }),
      prisma.transaction.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.transaction.count({ where: { riskLevel: 'LOW' } }),
      prisma.transaction.count({ where: { isFraud: true } }),
      prisma.transaction.count({ where: { status: 'FLAGGED' } }),
      prisma.transaction.count({ where: { status: 'BLOCKED' } })
    ]);

    // Amount at risk (sum of amounts where riskLevel is HIGH or isFraud is true)
    const atRiskAgg = await prisma.transaction.aggregate({
      where: {
        OR: [
          { riskLevel: 'HIGH' },
          { isFraud: true },
          { status: 'FLAGGED' },
          { status: 'BLOCKED' }
        ]
      },
      _sum: {
        amount: true
      }
    });

    const totalVolumeAgg = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });

    res.json({
      success: true,
      data: {
        totalTransactions,
        fraudDetected: fraudDetectedCount,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        flaggedCount,
        blockedCount,
        amountAtRisk: atRiskAgg._sum.amount || 0,
        totalVolume: totalVolumeAgg._sum.amount || 0,
        fraudRatePercent: totalTransactions > 0 ? ((fraudDetectedCount / totalTransactions) * 100).toFixed(2) : '0.00'
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFraudTrends = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        createdAt: true,
        step: true,
        amount: true,
        isFraud: true,
        riskScore: true,
        riskLevel: true
      },
      orderBy: { createdAt: 'asc' },
      take: 1000
    });

    // Group into 10 historical temporal buckets
    const bucketCount = 10;
    if (transactions.length === 0) {
      return res.json({ success: true, data: { trends: [] } });
    }

    const chunkSize = Math.max(1, Math.floor(transactions.length / bucketCount));
    const trends = [];

    for (let i = 0; i < bucketCount; i++) {
      const slice = transactions.slice(i * chunkSize, (i + 1) * chunkSize);
      if (slice.length === 0) continue;

      const totalTxns = slice.length;
      const fraudTxns = slice.filter(t => t.isFraud || t.riskLevel === 'HIGH').length;
      const amountAtRisk = slice
        .filter(t => t.isFraud || t.riskLevel === 'HIGH')
        .reduce((sum, t) => sum + t.amount, 0);
      const avgRisk = Math.round(slice.reduce((sum, t) => sum + t.riskScore, 0) / totalTxns);

      trends.push({
        interval: `T-${bucketCount - i}`,
        timeLabel: `Hour ${slice[0].step || i * 2}`,
        totalTransactions: totalTxns,
        fraudTransactions: fraudTxns,
        amountAtRisk: Math.round(amountAtRisk),
        avgRiskScore: avgRisk
      });
    }

    res.json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRiskDistribution = async (req, res, next) => {
  try {
    const [low, medium, high, total] = await Promise.all([
      prisma.transaction.count({ where: { riskLevel: 'LOW' } }),
      prisma.transaction.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.transaction.count({ where: { riskLevel: 'HIGH' } }),
      prisma.transaction.count()
    ]);

    const distribution = [
      { name: 'Low Risk (0-30)', count: low, percentage: total > 0 ? Math.round((low / total) * 100) : 0, color: '#10B981' },
      { name: 'Medium Risk (31-70)', count: medium, percentage: total > 0 ? Math.round((medium / total) * 100) : 0, color: '#F59E0B' },
      { name: 'High Risk (71-100)', count: high, percentage: total > 0 ? Math.round((high / total) * 100) : 0, color: '#EF4444' }
    ];

    res.json({
      success: true,
      data: { distribution, total }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTypeBreakdown = async (req, res, next) => {
  try {
    const types = ['TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT'];
    const breakdown = [];

    for (const type of types) {
      const total = await prisma.transaction.count({ where: { type } });
      const fraudCount = await prisma.transaction.count({
        where: {
          type,
          OR: [{ isFraud: true }, { riskLevel: 'HIGH' }]
        }
      });
      const highRiskAgg = await prisma.transaction.aggregate({
        where: { type, riskLevel: 'HIGH' },
        _sum: { amount: true }
      });

      breakdown.push({
        type,
        totalTransactions: total,
        fraudCount,
        fraudRate: total > 0 ? ((fraudCount / total) * 100).toFixed(1) : '0.0',
        amountAtRisk: highRiskAgg._sum.amount || 0
      });
    }

    res.json({
      success: true,
      data: { breakdown }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentAlerts = async (req, res, next) => {
  try {
    const alerts = await prisma.transaction.findMany({
      where: {
        OR: [
          { riskLevel: 'HIGH' },
          { status: 'FLAGGED' },
          { status: 'BLOCKED' }
        ]
      },
      include: {
        riskFactors: true
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    res.json({
      success: true,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};
