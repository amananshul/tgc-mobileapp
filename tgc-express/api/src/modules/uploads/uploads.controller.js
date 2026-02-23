const uploadsService = require('./uploads.service');

async function uploadAvatar(req, res, next) {
  try {
    const result = await uploadsService.uploadAvatar({
      userId: req.user.userId,
      sourceUrl: req.body.sourceUrl,
      imageData: req.body.imageData,
      req,
    });

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadAvatar };
