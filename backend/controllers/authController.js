
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

const WELCOME_REWARD = 50;

// =====================================
// CREATE JWT TOKEN
// =====================================
const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// =====================================
// VALIDATE EMAIL
// =====================================
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================
// VALIDATE INDIAN MOBILE NUMBER
// =====================================
const isValidMobileNumber = (mobileNumber) => {
  return /^[6-9]\d{9}$/.test(mobileNumber);
};

// =====================================
// GENERATE UNIQUE REFERRAL CODE
// =====================================
const generateReferralCode = () => {
  return `GAME${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
};

// =====================================
// REGISTER + WELCOME REWARD + REFERRAL
// =====================================
export const register = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      name,
      email,
      mobileNumber,
      password,
      referralCode,
    } = req.body;

    // REQUIRED FIELDS
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof mobileNumber !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, mobile number and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobileNumber = mobileNumber.replace(/\D/g, "");

    const cleanReferralCode =
      typeof referralCode === "string" && referralCode.trim()
        ? referralCode.trim().toUpperCase()
        : null;

    // NAME VALIDATION
    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 60 characters",
      });
    }

    // EMAIL VALIDATION
    if (
      !isValidEmail(cleanEmail) ||
      cleanEmail.length > 254
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    // MOBILE VALIDATION
    if (!isValidMobileNumber(cleanMobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10 digit Indian mobile number",
      });
    }

    // PASSWORD VALIDATION
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters",
      });
    }

    // JWT CONFIGURATION CHECK
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    // CHECK EXISTING EMAIL OR MOBILE
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { mobileNumber: cleanMobileNumber },
      ],
    });

    if (existingUser) {
      const message =
        existingUser.email === cleanEmail
          ? "An account with this email already exists"
          : "An account with this mobile number already exists";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    // FIND REFERRER
    let referrer = null;

    if (cleanReferralCode) {
      if (
        cleanReferralCode.length > 30 ||
        !/^[A-Z0-9]+$/.test(cleanReferralCode)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }

      referrer = await User.findOne({
        referralCode: cleanReferralCode,
        role: "user",
        isActive: true,
      }).select("_id referralCode");

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: "Referral code is invalid or inactive",
        });
      }
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 12);

    let createdUser;

    // CREATE USER, WALLET AND REWARD ATOMICALLY
    await session.withTransaction(async () => {
      // GENERATE REFERRAL CODE
      const newReferralCode = generateReferralCode();

      // CREATE USER
      const users = await User.create(
        [
          {
            name: cleanName,
            email: cleanEmail,
            mobileNumber: cleanMobileNumber,
            password: hashedPassword,
            role: "user",

            // USER'S OWN REFERRAL CODE
            referralCode: newReferralCode,

            // WHO REFERRED THIS USER
            referredBy: referrer ? referrer._id : null,

            // REFERRAL CODE USED DURING REGISTRATION
            referralCodeUsed: referrer
              ? cleanReferralCode
              : null,
          },
        ],
        { session }
      );

      const user = users[0];

      // CREATE INITIAL WALLET WITH ₹50 WELCOME REWARD
      await Wallet.create(
        [
          {
            user: user._id,
            balance: WELCOME_REWARD,
            availableBalance: WELCOME_REWARD,
            totalIncome: WELCOME_REWARD,
          },
        ],
        { session }
      );

      // CREATE WELCOME REWARD LEDGER ENTRY
      await WalletTransaction.create(
        [
          {
            user: user._id,
            type: "income",
            amount: WELCOME_REWARD,
            status: "posted",
            sourceType: "registrationReward",
            sourceId: user._id.toString(),
            description: "₹50 Welcome Registration Bonus",
          },
        ],
        { session }
      );

      createdUser = user;
    });

    // REGISTRATION SUCCESS
    return res.status(201).json({
      success: true,

      message:
        "Registration successful. ₹50 Welcome Cashback credited. Please login to continue.",

      reward: {
        amount: WELCOME_REWARD,
        status: "credited",
        description: "Welcome Registration Bonus",
      },

      referral: {
        referralCode: createdUser.referralCode,

        referredBy: referrer
          ? referrer._id.toString()
          : null,

        referralApplied: Boolean(referrer),
      },

      user: {
        id: createdUser._id.toString(),
        name: createdUser.name,
        email: createdUser.email,
        mobileNumber: createdUser.mobileNumber,
        role: createdUser.role,
        referralCode: createdUser.referralCode,
      },
    });

  } catch (error) {
    // DUPLICATE KEY ERROR
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      const message =
        duplicateField === "mobileNumber"
          ? "An account with this mobile number already exists"
          : duplicateField === "referralCode"
            ? "Please try registering again"
            : "An account with this email already exists";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Registration and referral error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });

  } finally {
    await session.endSession();
  }
};

// =====================================
// LOGIN
// EMAIL OR MOBILE NUMBER
// =====================================
export const login = async (req, res) => {
  try {
    const { email, mobileNumber, password } = req.body;

    if (
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    let userQuery;

    // MOBILE LOGIN
    if (
      typeof mobileNumber === "string" &&
      mobileNumber.trim()
    ) {
      const cleanMobileNumber = mobileNumber.replace(/\D/g, "");

      if (!isValidMobileNumber(cleanMobileNumber)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10 digit mobile number",
        });
      }

      userQuery = {
        mobileNumber: cleanMobileNumber,
      };

    // EMAIL LOGIN
    } else if (
      typeof email === "string" &&
      email.trim()
    ) {
      const cleanEmail = email.trim().toLowerCase();

      if (
        !isValidEmail(cleanEmail) ||
        cleanEmail.length > 254
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
      }

      userQuery = {
        email: cleanEmail,
      };

    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide email or mobile number",
      });
    }

    // FIND USER
    const user = await User.findOne(userQuery).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    // CHECK ACCOUNT STATUS
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is disabled",
      });
    }

    // GENERATE TOKEN
    const token = createToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,

      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        referralCode: user.referralCode || null,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};
