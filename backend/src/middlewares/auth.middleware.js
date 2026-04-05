// backend/src/middlewares/auth.middleware.js
const { verifyToken, isTokenBlacklisted } = require("../utils/jwt");

/**
 * requireAuth  — protects any route that needs a valid access token.
 * Attaches req.user = { id, email, name } on success.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ error: "Missing Authorization header" });

    const token = authHeader.split(" ")[1];

    if (isTokenBlacklisted(token))
      return res.status(401).json({ error: "Token revoked — please log in again" });

    const payload = verifyToken(token);

    req.user = {
      id:    payload.id ?? payload.sub,   // normalise both shapes
      email: payload.email,
      name:  payload.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

module.exports = { requireAuth };
