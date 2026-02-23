const prisma = require("../prisma/prisma");

function requireRole(...allowedRoles) {
  return async (req, _res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });
      if (!user || !allowedRoles.includes(user.role)) {
        const err = new Error("Forbidden: insufficient role");
        err.statusCode = 403;
        return next(err);
      }
      req.user.role = user.role;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = requireRole;
