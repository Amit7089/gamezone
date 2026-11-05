
import mongoose from "mongoose";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Wallet from "../models/Wallet.js";

// ========================================
// CALCULATE WALLET FROM POSTED TRANSACTIONS
// ========================================

async function calculateWallet(userId, session = null) {
  let query = WalletTransaction.find({
    user: userId,
    status: "posted",
  });

  if (session) {
    query = query.session(session);
  }

  const transactions = await query.lean();

  let balance = 0;
  let totalIncome = 0;
  let heldAmount = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;

    switch (tx.type) {
      case "deposit":
        balance += amount;
        break;

      case "income":
        balance += amount;
        totalIncome += amount;
        break;

      case "withdrawal":
        balance -= amount;
        break;

      case "hold":
        heldAmount += amount;
        break;

      case "release":
        heldAmount -= amount;
        break;

      default:
        break;
    }
  }

  balance = Math.round(balance * 100) / 100;
  heldAmount = Math.round(heldAmount * 100) / 100;
  totalIncome = Math.round(totalIncome * 100) / 100;

  return {
    balance: Math.max(0, balance),
    availableBalance: Math.max(0, balance - heldAmount),
    totalIncome: Math.max(0, totalIncome),
    heldAmount: Math.max(0, heldAmount),
  };
}

// ========================================
// SYNC WALLET SUMMARY
// ========================================

async function syncWallet(userId, session = null) {
  const summary = await calculateWallet(userId, session);

  await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        balance: summary.balance,
        availableBalance: summary.availableBalance,
        totalIncome: summary.totalIncome,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
      session,
      setDefaultsOnInsert: true,
    }
  );

  return summary;
}

// ========================================
// USER: GET WALLET BALANCE
// ========================================

export async function getMyWalletBalance(req, res) {
  try {
    const summary = await calculateWallet(req.user._id);

    return res.status(200).json({
      success: true,
      wallet: summary,
    });
  } catch (error) {
    console.error("getMyWalletBalance:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet balance load nahi ho paya.",
    });
  }
}

// ========================================
// USER: CREATE WITHDRAWAL REQUEST
// ========================================

export async function createWithdrawal(req, res) {
  const session = await mongoose.startSession();

  try {
    const { amount, method, accountDetails } = req.body;

    if (
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      !["upi", "bank"].includes(method) ||
      !accountDetails ||
      typeof accountDetails !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal details valid nahi hain.",
      });
    }

    const holderName = String(
      accountDetails.accountHolderName || ""
    ).trim();

    if (holderName.length < 2 || holderName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Valid account holder name required hai.",
      });
    }

    const details = {
      accountHolderName: holderName,
      upiId: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
    };

    if (method === "upi") {
      const id = String(accountDetails.upiId || "")
        .trim()
        .toLowerCase();

      if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Valid UPI ID enter karein.",
        });
      }

      details.upiId = id;
    }

    if (method === "bank") {
      const number = String(
        accountDetails.accountNumber || ""
      ).trim();

      const ifsc = String(
        accountDetails.ifscCode || ""
      ).trim().toUpperCase();

      const bank = String(
        accountDetails.bankName || ""
      ).trim();

      if (
        !/^[0-9]{8,18}$/.test(number) ||
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc) ||
        bank.length < 2 ||
        bank.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Bank details valid nahi hain.",
        });
      }

      details.accountNumber = number;
      details.ifscCode = ifsc;
      details.bankName = bank;
    }

    let createdRequest = null;

    await session.withTransaction(async () => {
      const summary = await calculateWallet(req.user._id, session);

      if (amount > summary.availableBalance) {
        const error = new Error(
          "Insufficient available wallet balance."
        );
        error.statusCode = 400;
        throw error;
      }

      const [request] = await WithdrawalRequest.create(
        [
          {
            user: req.user._id,
            amount,
            method,
            accountDetails: details,
            status: "pending",
          },
        ],
        {
          session,
          ordered: true,
        }
      );

      // Reserve amount until rejection or completed payout.
      await WalletTransaction.create(
        [
          {
            user: req.user._id,
            type: "hold",
            amount,
            status: "posted",
            sourceType: "withdrawalRequest",
            sourceId: String(request._id),
            description: `Withdrawal request ${request._id}`,
          },
        ],
        {
          session,
          ordered: true,
        }
      );

      await syncWallet(req.user._id, session);

      createdRequest = request;
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submit ho gayi hai.",
      withdrawal: createdRequest,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate withdrawal transaction.",
      });
    }

    console.error("createWithdrawal:", error);

    return res.status(500).json({
      success: false,
      message: "Withdrawal request submit nahi ho paayi.",
    });
  } finally {
    await session.endSession();
  }
}

// ========================================
// USER: VIEW OWN WITHDRAWAL HISTORY
// ========================================

export async function getMyWithdrawals(req, res) {
  try {
    const withdrawals = await WithdrawalRequest.find({
      user: req.user._id,
    })
      .select("-accountDetails.accountNumber")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error("getMyWithdrawals:", error);

    return res.status(500).json({
      success: false,
      message: "Withdrawal history load nahi ho paayi.",
    });
  }
}

// ========================================
// ADMIN: VIEW ALL WITHDRAWALS
// ========================================

export async function getAdminWithdrawals(req, res) {
  try {
    const withdrawals = await WithdrawalRequest.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      withdrawals,
    });
  } catch (error) {
    console.error("getAdminWithdrawals:", error);

    return res.status(500).json({
      success: false,
      message: "Admin withdrawals load nahi ho paaye.",
    });
  }
}

// ========================================
// ADMIN: APPROVE OR REJECT WITHDRAWAL
// ========================================

export async function reviewWithdrawal(req, res) {
  const session = await mongoose.startSession();

  try {
    const { status, adminNote = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal status.",
      });
    }

    let reviewed = null;

    await session.withTransaction(async () => {
      const request = await WithdrawalRequest.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "pending",
        },
        {
          $set: {
            status,
            adminNote: String(adminNote).slice(0, 1000),
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
          session,
        }
      );

      if (!request) {
        const error = new Error(
          "Request nahi mili ya pehle review ho chuki hai."
        );
        error.statusCode = 409;
        throw error;
      }

      if (status === "rejected") {
        await WalletTransaction.create(
          [
            {
              user: request.user,
              type: "release",
              amount: request.amount,
              status: "posted",
              sourceType: "withdrawalRequest",
              sourceId: String(request._id),
              description: `Withdrawal rejected ${request._id}`,
            },
          ],
          {
            session,
            ordered: true,
          }
        );

        await syncWallet(request.user, session);
      }

      reviewed = request;
    });

    return res.json({
      success: true,
      message:
        status === "approved"
          ? "Withdrawal approved. Actual payout abhi pending hai."
          : "Withdrawal rejected. Reserved amount release ho gayi.",
      withdrawal: reviewed,
    });
  } catch (error) {
    if (error.statusCode === 409 || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          error.message || "Withdrawal already reviewed.",
      });
    }

    console.error("reviewWithdrawal:", error);

    return res.status(500).json({
      success: false,
      message: "Withdrawal review nahi ho paaya.",
    });
  } finally {
    await session.endSession();
  }
}

// ========================================
// ADMIN: MARK WITHDRAWAL AS PAID
// Only after actual payout is completed.
// ========================================

export async function markWithdrawalPaid(req, res) {
  const session = await mongoose.startSession();

  try {
    const payoutReference = String(
      req.body.payoutReference || ""
    ).trim();

    if (
      payoutReference.length < 6 ||
      payoutReference.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid payout reference required hai.",
      });
    }

    let paidRequest = null;

    await session.withTransaction(async () => {
      const request = await WithdrawalRequest.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "approved",
        },
        {
          $set: {
            status: "paid",
            payoutReference,
            paidAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
          session,
        }
      );

      if (!request) {
        const error = new Error(
          "Approved withdrawal request nahi mili."
        );
        error.statusCode = 409;
        throw error;
      }

      // Debit withdrawal and release its reserved amount.
      await WalletTransaction.create(
        [
          {
            user: request.user,
            type: "withdrawal",
            amount: request.amount,
            status: "posted",
            sourceType: "withdrawalRequest",
            sourceId: String(request._id),
            description: `Withdrawal paid ${request._id}`,
          },
          {
            user: request.user,
            type: "release",
            amount: request.amount,
            status: "posted",
            sourceType: "withdrawalRequest",
            sourceId: String(request._id),
            description: `Withdrawal hold released ${request._id}`,
          },
        ],
        {
          session,
          ordered: true,
        }
      );

      await syncWallet(request.user, session);

      paidRequest = request;
    });

    return res.json({
      success: true,
      message: "Withdrawal payout marked as paid.",
      withdrawal: paidRequest,
    });
  } catch (error) {
    if (error.statusCode === 409 || error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          error.message || "Withdrawal ledger entry already exists.",
      });
    }

    console.error("markWithdrawalPaid:", error);

    return res.status(500).json({
      success: false,
      message: "Withdrawal payout update nahi ho paaya.",
    });
  } finally {
    await session.endSession();
  }
}
