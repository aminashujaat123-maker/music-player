// ============================================
// AUTH MIDDLEWARE — verifies JWT on protected routes
// ============================================
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Login required. Token missing." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Session expired. Please login again." });
    }
    req.user = user; // { id, username }
    next();
  });
}

module.exports = requireAuth;
