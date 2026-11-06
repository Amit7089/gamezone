
import mongoose from "mongoose";

import WalletTransaction from "../models/WalletTransaction.js";
import ProductPurchase from "../models/ProductPurchase.js";
import Wallet from "../models/Wallet.js";
import User from "../models/User.js";

// ========================================
// PRODUCT CATALOG
// Backend-controlled prices
// ========================================

const PRODUCTS = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    image: "/images/iphone.png",
    price: 550,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24",
    image: "/images/samsung.png",
    price: 600,
  },
  {
    id: "3",
    name: "Redmi Note 13 Pro",
    image: "/images/redmi.png",
    price: 450,
  },
];

const REFERRAL_COMMISSION_RATE = 4;

function roundMoney(value) {
  return Math.round(
    (Number(value) + Number.EPSILON) * 100
  ) / 100;
}

// ========================================
// CALCULATE AVAILABLE WALLET BALANCE
// ========================================

async function calculateAvailableBalance(userId, session) {
  const transactions = await WalletTransaction.find({
    user: userId,
    status: "posted",
  })
    .session(session)
    .lean();

  let balance = 0;
  let heldAmount = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;

    switch (tx.type) {
      case "deposit":
      case "income":
        balance += amount;
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

  return Math.max(
    0,
    balance - Math.max(0, heldAmount)
  );
}

// ========================================
// SYNC WALLET FROM LEDGER
// ========================================

async function syncWallet(userId, session) {
  const transactions = await WalletTransaction.find({
    user: userId,
    status: "posted",
  })
    .session(session)
    .lean();

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

  balance = Math.max(0, roundMoney(balance));
  heldAmount = Math.max(0, roundMoney(heldAmount));
  totalIncome = Math.max(0, roundMoney(totalIncome));

  await Wallet.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        balance,
        availableBalance: Math.max(
          0,
          roundMoney(balance - heldAmount)
        ),
        totalIncome,
      },
    },
    {
      upsert: true,
      session,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );
}

// ========================================
// GET AVAILABLE PRODUCTS
// GET /api/wallet/products
// ========================================

export async function getAvailableProducts(req, res) {
  return res.json({
    success: true,
    products: PRODUCTS,
  });
}

// ========================================
// PURCHASE PRODUCT + REFERRAL COMMISSION
// POST /api/wallet/purchase
// ========================================

export async function purchaseProduct(req, res) {
  const session = await mongoose.startSession();

  try {
    const productId = String(req.body.productId || "");
    const requestId = String(req.body.requestId || "");

    if (
      !productId ||
      !/^[a-zA-Z0-9-]{8,80}$/.test(requestId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid product aur request ID required hai.",
      });
    }

    const product = PRODUCTS.find(
      (item) => item.id === productId
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product nahi mila.",
      });
    }

    let result = null;

    await session.withTransaction(async () => {
      // ========================================
      // DUPLICATE REQUEST PROTECTION
      // ========================================

      const existing = await ProductPurchase.findOne({
        user: req.user._id,
        requestId,
      }).session(session);

      if (existing) {
        result = {
          purchase: existing,
          availableBalance: await calculateAvailableBalance(
            req.user._id,
            session
          ),
          duplicate: true,
          commission: {
            credited: false,
            amount: 0,
          },
        };

        return;
      }

      // ========================================
      // CHECK BUYER BALANCE
      // ========================================

      const availableBalance = await calculateAvailableBalance(
        req.user._id,
        session
      );

      if (availableBalance < product.price) {
        const error = new Error("INSUFFICIENT_BALANCE");

        error.statusCode = 400;
        error.availableBalance = availableBalance;
        error.requiredAmount = product.price;

        throw error;
      }

      // ========================================
      // FIND BUYER REFERRER
      // ========================================

      const buyer = await User.findById(req.user._id)
        .select("referredBy")
        .session(session)
        .lean();

      let referrer = null;
      let commissionAmount = 0;

      if (
        buyer?.referredBy &&
        String(buyer.referredBy) !== String(req.user._id)
      ) {
        referrer = await User.findOne({
          _id: buyer.referredBy,
          role: "user",
        })
          .select("_id")
          .session(session)
          .lean();

        if (referrer) {
          commissionAmount = roundMoney(
            (product.price * REFERRAL_COMMISSION_RATE) / 100
          );
        }
      }

      // ========================================
      // CREATE PURCHASE RECORD
      // ========================================

      const referralCommission = {
        referrer: referrer ? referrer._id : null,
        rate: REFERRAL_COMMISSION_RATE,
        amount: commissionAmount,
        status: commissionAmount > 0
          ? "credited"
          : "not_applicable",
        creditedAt: commissionAmount > 0
          ? new Date()
          : null,
        walletTransactionId: null,
      };

      const [purchase] = await ProductPurchase.create(
        [
          {
            user: req.user._id,
            productId: product.id,
            productName: product.name,
            productImage: product.image,
            price: product.price,
            requestId,
            status: "purchased",
            referralCommission,
          },
        ],
        { session }
      );

      // ========================================
      // DEBIT BUYER WALLET
      // ========================================

      await WalletTransaction.create(
        [
          {
            user: req.user._id,
            type: "purchase",
            amount: product.price,
            status: "posted",
            sourceType: "productPurchase",
            sourceId: String(purchase._id),
            description: `Product purchased: ${product.name}`,
          },
        ],
        { session }
      );

      // ========================================
      // CREDIT REFERRER 4% COMMISSION
      // ========================================

      let commissionCredited = false;

      if (referrer && commissionAmount > 0) {
        // Ensure referrer wallet exists.
        await Wallet.findOneAndUpdate(
          { user: referrer._id },
          {
            $setOnInsert: {
              user: referrer._id,
            },
            $inc: {
              balance: 0,
            },
          },
          {
            upsert: true,
            session,
            setDefaultsOnInsert: true,
          }
        );

        // Create referral income transaction.
        const [commissionTransaction] =
          await WalletTransaction.create(
            [
              {
                user: referrer._id,
                type: "income",
                amount: commissionAmount,
                status: "posted",
                sourceType: "productPurchase",
                sourceId: String(purchase._id),
                description: `4% referral commission for product purchase: ${product.name}`,
              },
            ],
            { session }
          );

        // Save commission transaction reference.
        purchase.referralCommission.walletTransactionId =
          commissionTransaction._id;

        await purchase.save({ session });

        // Update referrer's wallet from ledger.
        await syncWallet(referrer._id, session);

        commissionCredited = true;
      }

      // ========================================
      // SYNC BUYER WALLET
      // ========================================

      await syncWallet(req.user._id, session);

      const updatedBalance = roundMoney(
        availableBalance - product.price
      );

      result = {
        purchase,
        availableBalance: updatedBalance,
        duplicate: false,
        commission: {
          credited: commissionCredited,
          amount: commissionCredited
            ? commissionAmount
            : 0,
        },
      };
    });

    return res.status(result.duplicate ? 200 : 201).json({
      success: true,

      message: result.duplicate
        ? "Purchase pehle hi complete ho chuki hai."
        : "Product successfully purchase ho gaya.",

      purchase: result.purchase,
      availableBalance: result.availableBalance,

      referralCommission: result.commission,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: "Wallet balance sufficient nahi hai.",
        requiredAmount: error.requiredAmount,
        availableBalance: error.availableBalance,
        rechargeRequired: roundMoney(
          error.requiredAmount - error.availableBalance
        ),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ye purchase request pehle process ho chuki hai.",
      });
    }

    console.error("purchaseProduct:", error);

    return res.status(500).json({
      success: false,
      message: "Product purchase nahi ho paaya.",
    });
  } finally {
    await session.endSession();
  }
}

// ========================================
// GET MY PURCHASES
// GET /api/wallet/my-purchases
// ========================================

export async function getMyPurchases(req, res) {
  try {
    const purchases = await ProductPurchase.find({
      user: req.user._id,
      status: { $ne: "cancelled" },
    })
      .sort({ purchasedAt: -1 })
      .lean();

    return res.json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error("getMyPurchases:", error);

    return res.status(500).json({
      success: false,
      message: "Purchased products load nahi ho paaye.",
    });
  }
}
