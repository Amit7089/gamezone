
import mongoose from "mongoose";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import ProductPurchase from "../models/ProductPurchase.js";

// ========================================
// HELPER: ESCAPE REGEX
// ========================================

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

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

  balance = roundMoney(balance);
  heldAmount = roundMoney(heldAmount);
  totalIncome = roundMoney(totalIncome);

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
      const escaped = escapeRegex(search);

      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { mobileNumber: { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("_id name email mobileNumber role isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

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
      const wallet = walletMap.get(String(tx.user));

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

      const balance = Math.max(0, roundMoney(wallet.balance));
      const heldAmount = Math.max(0, roundMoney(wallet.heldAmount));

      return {
        ...user,
        wallet: {
          balance,
          heldAmount,
          availableBalance: Math.max(
            0,
            roundMoney(balance - heldAmount)
          ),
          totalIncome: Math.max(
            0,
            roundMoney(wallet.totalIncome)
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

    if (!mongoose.isValidObjectId(userId)) {
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
        mobileNumber: targetUser.mobileNumber,
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
      .select("_id name email mobileNumber role")
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

// ========================================
// ADMIN: GET ALL PRODUCT PURCHASES
// ========================================

export async function getAdminPurchases(req, res, next) {
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

    // All order statuses are now visible to Admin.
    const filter = {};

    if (search) {
      const escaped = escapeRegex(search);
      const regex = new RegExp(escaped, "i");

      const matchingUsers = await User.find({
        $or: [
          { name: regex },
          { email: regex },
          { mobileNumber: regex },
        ],
      })
        .select("_id")
        .lean();

      const matchingUserIds = matchingUsers.map(
        (user) => user._id
      );

      const searchConditions = [
        { productName: regex },
        { productId: regex },
      ];

      if (mongoose.isValidObjectId(search)) {
        searchConditions.push({
          _id: new mongoose.Types.ObjectId(search),
        });
      }

      if (matchingUserIds.length > 0) {
        searchConditions.push({
          user: { $in: matchingUserIds },
        });
      }

      filter.$or = searchConditions;
    }

    const [purchases, total] = await Promise.all([
      ProductPurchase.find(filter)
        .populate({
          path: "user",
          select: "name email mobileNumber role",
        })
        .populate({
          path: "referralCommission.referrer",
          select: "name email mobileNumber role",
        })
        .sort({ purchasedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      ProductPurchase.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAdminPurchases:", error);
    next(error);
  }
}

// ========================================
// ADMIN: UPDATE PRODUCT PURCHASE STATUS
// REFERRER GETS 4% AFTER DELIVERY
// ========================================

export async function updatePurchaseStatus(req, res, next) {
  const session = await mongoose.startSession();

  try {
    const { purchaseId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!mongoose.isValidObjectId(purchaseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase status.",
      });
    }

    let updatedPurchase = null;
    let commissionCredited = false;
    let commissionAmount = 0;

    await session.withTransaction(async () => {
      const purchase = await ProductPurchase.findById(purchaseId)
        .session(session);

      if (!purchase) {
        const error = new Error("PURCHASE_NOT_FOUND");
        error.statusCode = 404;
        throw error;
      }

      if (purchase.status === "cancelled") {
        const error = new Error("PURCHASE_ALREADY_CANCELLED");
        error.statusCode = 400;
        throw error;
      }

      if (purchase.status === "delivered" && status !== "delivered") {
        const error = new Error("PURCHASE_ALREADY_DELIVERED");
        error.statusCode = 400;
        throw error;
      }

      // Cancelled orders do not earn pending referral commission.
      if (status === "cancelled") {
        if (purchase.status === "delivered") {
          const error = new Error("DELIVERED_ORDER_CANNOT_BE_CANCELLED");
          error.statusCode = 400;
          throw error;
        }

        purchase.status = "cancelled";

        if (purchase.referralCommission?.status === "pending") {
          purchase.referralCommission.status = "not_applicable";
        }

        await purchase.save({ session });

        updatedPurchase = purchase;
        return;
      }

      purchase.status = status;

      // Referral commission is credited only on delivery.
      if (
        status === "delivered" &&
        purchase.referralCommission?.status === "pending" &&
        purchase.referralCommission?.referrer &&
        Number(purchase.referralCommission?.amount) > 0
      ) {
        const referrerId = purchase.referralCommission.referrer;

        commissionAmount = roundMoney(
          purchase.referralCommission.amount
        );

        const referrer = await User.findById(referrerId)
          .select("_id role")
          .session(session)
          .lean();

        if (referrer && referrer.role === "user") {
          // Ensure referrer wallet exists.
          await Wallet.findOneAndUpdate(
            { user: referrerId },
            {
              $setOnInsert: { user: referrerId },
              $inc: { balance: 0 },
            },
            {
              upsert: true,
              session,
              setDefaultsOnInsert: true,
            }
          );

          // Unique WalletTransaction index protects against duplicates.
          const [commissionTransaction] =
            await WalletTransaction.create(
              [
                {
                  user: referrerId,
                  type: "income",
                  amount: commissionAmount,
                  status: "posted",
                  sourceType: "productPurchase",
                  sourceId: String(purchase._id),
                  description: `4% referral commission for delivered product: ${purchase.productName}`,
                },
              ],
              { session }
            );

          purchase.referralCommission.status = "credited";
          purchase.referralCommission.creditedAt = new Date();
          purchase.referralCommission.walletTransactionId =
            commissionTransaction._id;

          await syncUserWallet(referrerId, session);

          commissionCredited = true;
        } else {
          purchase.referralCommission.status = "not_applicable";
        }
      }

      if (status === "delivered") {
        purchase.deliveredAt = new Date();
      }

      await purchase.save({ session });

      updatedPurchase = purchase;
    });

    return res.json({
      success: true,
      message: commissionCredited
        ? "Order delivered and 4% referral commission credited successfully."
        : status === "delivered"
          ? "Order delivered successfully. No pending referral commission."
          : status === "cancelled"
            ? "Order cancelled successfully."
            : "Purchase status updated successfully.",
      purchase: updatedPurchase,
      commission: {
        credited: commissionCredited,
        amount: commissionCredited ? commissionAmount : 0,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Commission transaction already exists. Please check the purchase record.",
      });
    }

    if (error.statusCode) {
      const messages = {
        PURCHASE_NOT_FOUND: "Purchase not found.",
        PURCHASE_ALREADY_CANCELLED: "This purchase is already cancelled.",
        PURCHASE_ALREADY_DELIVERED: "This purchase is already delivered.",
        DELIVERED_ORDER_CANNOT_BE_CANCELLED:
          "Delivered order cannot be cancelled through this action.",
      };

      return res.status(error.statusCode).json({
        success: false,
        message: messages[error.message] || "Invalid purchase status.",
      });
    }

    console.error("updatePurchaseStatus:", error);
    next(error);
  } finally {
    await session.endSession();
  }
}
