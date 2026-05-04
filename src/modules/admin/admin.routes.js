const { Router } = require('express');

const { adminAuth } = require('../../middleware/admin-auth');
const { adminController } = require('./admin.controller');

const adminRouter = Router();

adminRouter.get('/subscribers', adminAuth, adminController.listSubscribers);
adminRouter.post('/send', adminAuth, adminController.sendBroadcast);

module.exports = { adminRouter };
