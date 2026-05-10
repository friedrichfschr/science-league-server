const { z } = require('zod');

const orderItemSchema = z.object({
  id:       z.string().min(1),
  name:     z.string().min(1),
  price:    z.number().positive(),
  quantity: z.number().int().positive(),
  unit:     z.string().min(1),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Der Warenkorb ist leer.'),
  notes: z.string().max(500).optional(),
});

module.exports = { createOrderSchema };
