
import Recharge from "../models/Recharge.js";

export async function getRechargeRecords(req, res, next) {
  try {
    const records = await Recharge.find({
      user: req.user._id,
    })
      .select("amount orderId paymentId paymentMethod status createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
}
