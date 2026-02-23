const prisma = require("../../prisma/prisma");
const { safeUser, safeProfile } = require("../../utils/safeTransform");

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    user: safeUser(user),
    profile: safeProfile(user.profile),
  };
}

module.exports = { getUserById };
