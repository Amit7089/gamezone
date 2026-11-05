
import mongoose from "mongoose";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

// ========================================
// WALLET LEDGER CALCULATION
// ========================================

async function calculateUserWallet(userId, session = null) {
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
      case "purchase":
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
    heldAmount: Math.max(0, heldAmount),
    availableBalance: Math.max(
      0,
      balance - Math.max(0, heldAmount)
    ),
    totalIncome: Math.max(0, totalIncome),
  };
}

// ========================================
// SYNC WALLET DOCUMENT
// ========================================

async function syncUserWallet(userId, session) {
  const summary = await calculateUserWallet(userId, session);

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
      session,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  return summary;
}

// ========================================
// ADMIN DASHBOARD
// ========================================

export async function getAdminDashboard(req, res, next) {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      inactiveUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", isActive: true }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user", isActive: false }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ========================================
// ADMIN: GET ALL USERS WITH WALLET BALANCE
// ========================================

export async function getAdminUsers(req, res, next) {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const search = String(req.query.search || "")
      .trim()
      .slice(0, 100);

    const filter = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("_id name email role isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    // Calculate wallet information from posted ledger entries.
    const userIds = users.map((user) => user._id);

    const transactions = userIds.length
      ? await WalletTransaction.find({
          user: { $in: userIds },
          status: "posted",
        }).lean()
      : [];

    const walletMap = new Map();

    for (const user of users) {
      walletMap.set(String(user._id), {
        balance: 0,
        availableBalance: 0,
        totalIncome: 0,
        heldAmount: 0,
      });
    }

    for (const tx of transactions) {
      const key = String(tx.user);
      const wallet = walletMap.get(key);

      if (!wallet) continue;

      const amount = Number(tx.amount) || 0;

      switch (tx.type) {
        case "deposit":
          wallet.balance += amount;
          break;

        case "income":
          wallet.balance += amount;
          wallet.totalIncome += amount;
          break;

        case "withdrawal":
        case "purchase":
          wallet.balance -= amount;
          break;

        case "hold":
          wallet.heldAmount += amount;
          break;

        case "release":
          wallet.heldAmount -= amount;
          break;

        default:
          break;
      }
    }

    const formattedUsers = users.map((user) => {
      const wallet = walletMap.get(String(user._id));

      const balance = Math.max(
        0,
        Math.round(wallet.balance * 100) / 100
      );

      const heldAmount = Math.max(
        0,
        Math.round(wallet.heldAmount * 100) / 100
      );

      return {
        ...user,
        wallet: {
          balance,
          heldAmount,
          availableBalance: Math.max(
            0,
            Math.round((balance - heldAmount) * 100) / 100
          ),
          totalIncome: Math.max(
            0,
            Math.round(wallet.totalIncome * 100) / 100
          ),
        },
      };
    });

    return res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ========================================
// ADMIN: ACTIVATE / DEACTIVATE USER
// ========================================

export async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be changed here.",
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    return res.json({
      success: true,
      message: isActive
        ? "User account activated."
        : "User account deactivated.",
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ========================================
// ADMIN: GET SPECIFIC USER WALLET
// ========================================

export async function getAdminUserWallet(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(userId)
      .select("_id name email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await calculateUserWallet(userId);

    return res.json({
      success: true,
      user,
      wallet,
    });
  } catch (error) {
    next(error);
  }
}

// ========================================
// ADMIN: ADD / DEDUCT USER WALLET BALANCE
// ========================================

export async function adjustUserWallet(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { userId } = req.params;
    const { action, amount, reason } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!["add", "deduct"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be add or deduct.",
      });
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 10000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid amount enter karein.",
      });
    }

    const cleanReason = String(reason || "").trim();

    if (cleanReason.length < 3 || cleanReason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Adjustment reason 3-500 characters ka hona chahiye.",
      });
    }

    const targetUser = await User.findById(userId)
      .select("_id name email role")
      .lean();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (targetUser.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin wallet adjustment is not allowed here.",
      });
    }

    let updatedWallet = null;

    await session.withTransaction(async () => {
      // Ensure wallet exists and serialize concurrent adjustments.
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $setOnInsert: { user: userId },
          $inc: { balance: 0 },
        },
        {
          upsert: true,
          session,
          setDefaultsOnInsert: true,
        }
      );

      const currentWallet = await calculateUserWallet(
        userId,
        session
      );

      if (
        action === "deduct" &&
        amount > currentWallet.availableBalance
      ) {
        const error = new Error(
          "Deduction available wallet balance se zyada nahi ho sakti."
        );

        error.statusCode = 400;
        error.availableBalance = currentWallet.availableBalance;
        throw error;
      }

      const transactionId = new mongoose.Types.ObjectId().toString();

      await WalletTransaction.create(
        [
          {
            user: userId,
            type: action === "add" ? "deposit" : "withdrawal",
            amount,
            status: "posted",
            sourceType: "adminAdjustment",
            sourceId: transactionId,
            description: `Admin ${action}: ${cleanReason}. Admin ID: ${String(req.user._id)}`,
          },
        ],
        { session }
      );

      updatedWallet = await syncUserWallet(userId, session);
    });

    return res.json({
      success: true,
      message:
        action === "add"
          ? "User wallet balance successfully add ho gaya."
          : "User wallet balance successfully deduct ho gaya.",
      user: targetUser,
      wallet: updatedWallet,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        availableBalance: error.availableBalance,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate wallet adjustment detected.",
      });
    }

    next(error);
  } finally {
    await session.endSession();
  }
}
