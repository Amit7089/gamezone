
export function adminMiddleware(req, res, next) {
  console.log("Admin check:", {
    userId: req.user?._id,
    email: req.user?.email,
    role: req.user?.role,
  });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
      debugRole: req.user.role,
    });
  }

  return next();
}
