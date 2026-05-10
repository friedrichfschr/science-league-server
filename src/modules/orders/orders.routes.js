const { Router } = require('express');

const { authenticate } = require('../../middleware/authenticate');
const { ordersController } = require('./orders.controller');

const ordersRouter = Router();

ordersRouter.post('/', authenticate, ordersController.create);

module.exports = { ordersRouter };
