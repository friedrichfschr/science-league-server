const { Router } = require('express');

const { adminAuth } = require('../../middleware/admin-auth');
const { adminController } = require('./admin.controller');

const adminRouter = Router();

adminRouter.get('/subscribers', adminAuth, adminController.listSubscribers);
adminRouter.post('/send', adminAuth, adminController.sendBroadcast);
adminRouter.get('/users', adminAuth, adminController.listUsers);
adminRouter.patch('/users/:id/role', adminAuth, adminController.setUserRole);
adminRouter.get('/orders', adminAuth, adminController.listOrders);

module.exports = { adminRouter };
