import { Request, Response, NextFunction } from "express";
import * as uploadService from "./upload.service";

async function presign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await uploadService.presignUpload({
      userId: req.user.userId,
      purpose: req.body.purpose,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      tribeId: req.body.tribeId,
      fileSize: req.body.fileSize,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getViewUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await uploadService.ensureCanViewPath(req.query.path as string, req.user.userId);
    const { url } = await uploadService.createSignedViewUrl(req.query.path as string);
    res.json({ url });
  } catch (err) {
    next(err);
  }
}

export { presign, getViewUrl };
