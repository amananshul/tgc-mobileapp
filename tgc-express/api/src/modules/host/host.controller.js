const prisma = require("../../prisma/prisma");

async function enable(req, res, next) {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: "HOST" },
      select: {
        id: true,
        role: true,
        email: true,
        phone: true,
        phoneVerified: true,
      },
    });

    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { enable };
