
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";

// GET /api/referrals/me
export async function getMyReferralDetails(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("name referralCode")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.referralCode) {
      return res.status(409).json({
        success: false,
        message: "Referral code is not assigned to this account yet.",
      });
    }

    const frontendUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const referralLink =
      `${frontendUrl}/register?ref=${encodeURIComponent(user.referralCode)}`;

    return res.json({
      success: true,
      referralCode: user.referralCode,
      referralLink,
    });
  } catch (error) {
    console.error("getMyReferralDetails:", error);

    return res.status(500).json({
      success: false,
      message: "Referral details load nahi ho paaye.",
    });
  }
}

// GET /api/referrals/team
export async function getMyTeam(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [members, total] = await Promise.all([
      User.find({
        referredBy: req.user._id,
        role: "user",
      })
        .select("name referralCodeUsed createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments({
        referredBy: req.user._id,
        role: "user",
      }),
    ]);

    return res.json({
      success: true,

      members: members.map((member) => ({
        id: member._id,
        name: member.name,
        referralCodeUsed: member.referralCodeUsed,
        joinedAt: member.createdAt,
      })),

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getMyTeam:", error);

    return res.status(500).json({
      success: false,
      message: "Team members load nahi ho paaye.",
    });
  }
}

// GET /api/referrals/earnings
export async function getReferralEarnings(req, res) {
  try {
    const transactions = await WalletTransaction.find({
      user: req.user._id,
      type: "income",
      sourceType: "productPurchase",
      status: "posted",
      description: {
        $regex: "^4% referral commission for product purchase:",
      },
    })
      .select("amount status createdAt description sourceId")
      .sort({ createdAt: -1 })
      .lean();

    const totalCommission = Math.round(
      transactions.reduce(
        (sum, tx) => sum + Number(tx.amount || 0),
        0
      ) * 100
    ) / 100;

    return res.json({
      success: true,
      totalCommission,
      transactions,
    });
  } catch (error) {
    console.error("getReferralEarnings:", error);

    return res.status(500).json({
      success: false,
      message: "Referral earnings load nahi ho paayi.",
    });
  }
}
