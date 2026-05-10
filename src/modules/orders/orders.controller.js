const { asyncHandler } = require('../../lib/async-handler');
const { createOrderSchema } = require('./orders.schemas');
const { ordersService } = require('./orders.service');

const ordersController = {
  create: asyncHandler(async (req, res) => {
    const data = createOrderSchema.parse(req.body);
    const order = await ordersService.createOrder({ userId: req.user.id, ...data });
    res.status(201).json({ message: 'Bestellung aufgegeben.', order });
  }),
};

module.exports = { ordersController };
