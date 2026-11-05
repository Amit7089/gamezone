import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

import PaymentSettings from "../models/PaymentSettings.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { creditVerifiedPayment } from "../utils/creditVerifiedPayment.js";

// GET: Public payment settings
export async function getPaymentSettings(req, res) {
  try {
    const settings = await PaymentSettings.findOne({
      key: "default",
      isEnabled: true,
    }).lean();

    if (!settings) {
      return res.json({
        success: true,
        enabled: false,
        settings: null,
      });
    }

    return res.json({
      success: true,
      enabled: true,
      settings: {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        qrImageUrl: settings.qrImageUrl,
        instructions: settings.instructions,
      },
    });
  } catch (error) {
    console.error("getPaymentSettings:", error);

    return res.status(500).json({
      success: false,
      message: "Payment settings load nahi ho paayi.",
    });
  }
}

// GET: Admin payment settings
export async function getAdminPaymentSettings(req, res) {
  try {
    const settings = await PaymentSettings.findOne({
      key: "default",
    }).lean();

    return res.json({
      success: true,
      settings: settings || {
        upiId: "",
        payeeName: "",
        qrImageUrl: "",
        instructions: "",
        isEnabled: false,
      },
    });
  } catch (error) {
    console.error("getAdminPaymentSettings:", error);

    return res.status(500).json({
      success: false,
      message: "Settings fetch nahi ho paayi.",
    });
  }
}

// PUT/PATCH: Update payment settings
export async function updatePaymentSettings(req, res) {
  try {
    const {
      upiId,
      payeeName,
      qrImageUrl,
      instructions,
      isEnabled,
    } = req.body;

    if (
      typeof upiId !== "string" ||
      typeof payeeName !== "string" ||
      typeof qrImageUrl !== "string" ||
      typeof instructions !== "string" ||
      typeof isEnabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment settings.",
      });
    }

    if (isEnabled && (!upiId.trim() || !payeeName.trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Enabled payment ke liye UPI ID aur payee name required hain.",
      });
    }

    const settings = await PaymentSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          upiId: upiId.trim(),
          payeeName: payeeName.trim(),
          qrImageUrl: qrImageUrl.trim(),
          instructions: instructions.trim(),
          isEnabled,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      message: "Payment settings save ho gayi hain.",
      settings,
    });
  } catch (error) {
    console.error("updatePaymentSettings:", error);

    return res.status(500).json({
      success: false,
      message: "Payment settings save nahi ho paayi.",
    });
  }
}

// POST: Submit payment reference
export async function submitPayment(req, res) {
  try {
    const { orderReference, purpose, amount, utr } = req.body;

    if (
      typeof orderReference !== "string" ||
      !orderReference.trim() ||
      !["product", "service"].includes(purpose) ||
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      typeof utr !== "string" ||
      !/^[A-Za-z0-9]{6,30}$/.test(utr.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details valid nahi hain.",
      });
    }

    const settings = await PaymentSettings.findOne({
      key: "default",
      isEnabled: true,
    }).lean();

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Payment method abhi available nahi hai.",
      });
    }

    // IMPORTANT:
    // Production mein amount, purpose aur orderReference ko
    // trusted server-side Order record se validate karein.
    // Client se aaye amount ko blindly trust na karein.

    const transaction = await PaymentTransaction.create({
      user: req.user._id,
      orderReference: orderReference.trim(),
      purpose,
      amount,
      utr: utr.trim(),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Payment reference submit ho gaya hai. Verification pending hai.",
      transaction: {
        id: transaction._id,
        orderReference: transaction.orderReference,
        purpose: transaction.purpose,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Ye reference is order ke liye pehle submit ho chuka hai.",
      });
    }

    console.error("submitPayment:", error);

    return res.status(500).json({
      success: false,
      message: "Payment reference submit nahi ho paaya.",
    });
  }
}

// GET: Current user's payment history
export async function getMyPayments(req, res) {
  try {
    const transactions = await PaymentTransaction.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("getMyPayments:", error);

    return res.status(500).json({
      success: false,
      message: "Transactions load nahi ho paaye.",
    });
  }
}

// GET: Admin payment history
export async function getAdminPayments(req, res) {
  try {
    const transactions = await PaymentTransaction.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("getAdminPayments:", error);

    return res.status(500).json({
      success: false,
      message: "Transactions load nahi ho paaye.",
    });
  }
}

// POST: Admin reviews a pending payment
export async function reviewPayment(req, res) {
  const session = await mongoose.startSession();

  try {
    const { status, adminNote = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Review status invalid hai.",
      });
    }

    let reviewedTransaction = null;
    let credited = false;

    await session.withTransaction(async () => {
      // Only one concurrent request can change a pending transaction.
      const transaction = await PaymentTransaction.findOneAndUpdate(
        {
          _id: req.params.transactionId,
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
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!transaction) {
        const existing = await PaymentTransaction.findById(
          req.params.transactionId
        )
          .session(session)
          .lean();

        if (!existing) {
          const error = new Error("Transaction nahi mila.");
          error.statusCode = 404;
          throw error;
        }

        const error = new Error(
          "Transaction pehle hi review ho chuka hai."
        );
        error.statusCode = 409;
        throw error;
      }

      if (status === "approved") {
        // The admin must independently verify the actual bank/UPI receipt.
        // A submitted UTR alone is not proof of payment.
        const result = await creditVerifiedPayment(
          transaction,
          session
        );

        credited = result.credited;
      }

      reviewedTransaction = transaction;
    });

    return res.json({
      success: true,
      message:
        status === "approved"
          ? "Payment approve ho gaya aur wallet ledger update ho gaya."
          : "Payment reject ho gaya. Wallet mein credit nahi hua.",
      credited,
      transaction: reviewedTransaction,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 409) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("reviewPayment:", error);

    return res.status(500).json({
      success: false,
      message: "Transaction review nahi ho paaya.",
    });
  } finally {
    await session.endSession();
  }
}



export async function uploadQRCode(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "QR image select karein.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "gamezone/payment-qr",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      Readable.from(req.file.buffer).pipe(stream);
    });

    return res.json({
      success: true,
      message: "QR image successfully upload ho gayi.",
      qrImageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("uploadQRCode:", error);

    return res.status(500).json({
      success: false,
      message: "QR image upload nahi ho paayi.",
    });
  }
}
