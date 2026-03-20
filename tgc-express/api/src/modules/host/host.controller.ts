import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma/prisma";

async function enable(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export { enable };
