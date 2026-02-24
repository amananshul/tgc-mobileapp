const uploadService = require("./upload.service");

async function presign(req, res, next) {
  try {
    const result = await uploadService.presignUpload({
      userId: req.user.userId,
      purpose: req.body.purpose,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      tribeId: req.body.tribeId,
      fileSize: req.body.fileSize,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getViewUrl(req, res, next) {
  try {
    await uploadService.ensureCanViewPath(req.query.path, req.user.userId);
    const { url } = await uploadService.createSignedViewUrl(req.query.path);
    return res.json({ url });
  } catch (err) {
    return next(err);
  }
}

module.exports = { presign, getViewUrl };
