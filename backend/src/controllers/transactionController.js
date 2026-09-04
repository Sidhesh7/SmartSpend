const prisma = require('../config/db');
const MLClient = require('../services/mlClient');

exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      type,
      riskLevel,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { sender: { contains: search } },
        { receiver: { contains: search } }
      ];
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (riskLevel && riskLevel !== 'ALL') {
      where.riskLevel = riskLevel;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          riskFactors: true
        },
        skip,
        take: limitNum,
        orderBy: {
          [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc'
        }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { id },
          { transactionId: id }
        ]
      },
      include: {
        riskFactors: true,
        auditLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction not found with identifier '${id}'.`
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      sender,
      receiver,
      oldBalanceOrig = 0,
      newBalanceOrig = 0,
      oldBalanceDest = 0,
      newBalanceDest = 0,
      step = 12
    } = req.body;

    if (!type || amount === undefined || !sender || !receiver) {
      return res.status(400).json({
        success: false,
        message: 'type, amount, sender, and receiver are required fields.'
      });
    }

    // Run ML Prediction
    const prediction = await MLClient.predict({
      type,
      amount,
      oldBalanceOrig,
      newBalanceOrig,
      oldBalanceDest,
      newBalanceDest,
      sender,
      receiver,
      step
    });

    // Auto-generate TXN ID
    const count = await prisma.transaction.count();
    const transactionId = `TXN-${1000 + count + 1}`;

    const defaultStatus = prediction.riskLevel === 'HIGH' ? 'FLAGGED' : 'APPROVED';

    const transaction = await prisma.transaction.create({
      data: {
        transactionId,
        type: type.toUpperCase(),
        amount: parseFloat(amount),
        sender,
        receiver,
        oldBalanceOrig: parseFloat(oldBalanceOrig),
        newBalanceOrig: parseFloat(newBalanceOrig),
        oldBalanceDest: parseFloat(oldBalanceDest),
        newBalanceDest: parseFloat(newBalanceDest),
        fraudProbability: prediction.fraudProbability,
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        status: defaultStatus,
        isFraud: prediction.isFraudPredicted,
        step: parseInt(step, 10) || 12,
        riskFactors: {
          create: (prediction.reasons || []).map(r => ({
            factor: r.factor,
            severity: r.severity,
            code: r.code
          }))
        }
      },
      include: {
        riskFactors: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Transaction processed and risk assessed successfully',
      data: {
        transaction,
        prediction
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['APPROVED', 'UNDER_REVIEW', 'FLAGGED', 'BLOCKED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [{ id }, { transactionId: id }]
      }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.'
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status,
        auditLogs: {
          create: {
            userId: req.user?.id || null,
            action: `STATUS_UPDATED_TO_${status}`,
            notes: notes || `Status updated to ${status} by ${req.user?.name || 'System'}`
          }
        }
      },
      include: {
        riskFactors: true,
        auditLogs: true
      }
    });

    res.json({
      success: true,
      message: `Transaction ${transaction.transactionId} status updated to ${status}`,
      data: { transaction: updated }
    });
  } catch (error) {
    next(error);
  }
};

exports.batchIngest = async (req, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'transactions array is required.'
      });
    }

    const predictions = await MLClient.batchPredict(transactions);
    const existingCount = await prisma.transaction.count();

    const createdList = [];

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const p = predictions[i] || MLClient.fallbackHeuristicScoring(t);
      const transactionId = `TXN-${1000 + existingCount + i + 1}`;

      const defaultStatus = p.riskLevel === 'HIGH' ? 'FLAGGED' : 'APPROVED';

      const record = await prisma.transaction.create({
        data: {
          transactionId,
          type: (t.type || 'TRANSFER').toUpperCase(),
          amount: parseFloat(t.amount || 0),
          sender: t.sender || t.nameOrig || `C${Math.floor(100000000 + Math.random() * 900000000)}`,
          receiver: t.receiver || t.nameDest || `C${Math.floor(100000000 + Math.random() * 900000000)}`,
          oldBalanceOrig: parseFloat(t.oldBalanceOrig ?? t.oldbalanceOrg ?? 0),
          newBalanceOrig: parseFloat(t.newBalanceOrig ?? t.newbalanceOrig ?? 0),
          oldBalanceDest: parseFloat(t.oldBalanceDest ?? t.oldbalanceDest ?? 0),
          newBalanceDest: parseFloat(t.newBalanceDest ?? t.newbalanceDest ?? 0),
          fraudProbability: p.fraudProbability,
          riskScore: p.riskScore,
          riskLevel: p.riskLevel,
          status: defaultStatus,
          isFraud: p.isFraudPredicted,
          step: parseInt(t.step, 10) || 12,
          riskFactors: {
            create: (p.reasons || []).map(r => ({
              factor: r.factor,
              severity: r.severity,
              code: r.code
            }))
          }
        }
      });
      createdList.push(record);
    }

    res.status(201).json({
      success: true,
      message: `Successfully ingested ${createdList.length} transactions`,
      data: { count: createdList.length }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });

    let csv = 'Transaction ID,Type,Amount,Sender,Receiver,Risk Score,Risk Level,Status,Date\n';
    transactions.forEach(t => {
      csv += `"${t.transactionId}","${t.type}",${t.amount},"${t.sender}","${t.receiver}",${t.riskScore},"${t.riskLevel}","${t.status}","${t.createdAt.toISOString()}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('smartspend_transactions.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};
