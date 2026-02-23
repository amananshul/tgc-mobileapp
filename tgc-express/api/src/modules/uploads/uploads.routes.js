const { Router } = require('express');
const controller = require('./uploads.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const { uploadAvatarSchema } = require('./uploads.schema');

const router = Router();

router.post('/avatar', authMiddleware, validate(uploadAvatarSchema), controller.uploadAvatar);

module.exports = router;
