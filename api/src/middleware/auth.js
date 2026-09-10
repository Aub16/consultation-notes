const { getUserBySessionToken, COOKIE_NAME } = require('../utils/session');

async function attachUser(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  req.sessionToken = token;
  req.user = await getUserBySessionToken(token);
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié.' });
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié.' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Accès refusé.' });
    next();
  };
}

module.exports = { attachUser, requireAuth, requireRole };
