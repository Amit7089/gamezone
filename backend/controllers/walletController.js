import WalletTransaction from "../models/WalletTransaction.js";
import Wallet from "../models/Wallet.js";

export async function getWalletSummary(req, res) {
  try {
    const userId = req.user._id;

    // Only posted ledger entries count.
    const transactions = await WalletTransaction.find({
      user: userId,
      status: "posted",
    }).lean();

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

    balance = Math.max(0, balance);
    heldAmount = Math.max(0, heldAmount);

    const availableBalance = Math.max(0, balance - heldAmount);

    const wallet = await Wallet.findOne({ user: userId }).lean();

    return res.json({
      success: true,
      summary: {
        balance,
        availableBalance,
        totalIncome,
        vipLevel: wallet?.vipLevel ?? 0,
      },
    });
  } catch (error) {
    console.error("getWalletSummary error:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet summary load nahi ho paayi.",
    });
  }
}