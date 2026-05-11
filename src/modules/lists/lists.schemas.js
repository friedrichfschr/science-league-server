const { z } = require('zod');

const listItemSchema = z.object({
  id:       z.string().min(1),
  name:     z.string().min(1),
  price:    z.number().positive(),
  quantity: z.number().int().positive(),
  unit:     z.string().min(1),
});

const createListSchema = z.object({
  name:  z.string().min(1).max(100),
  items: z.array(listItemSchema).min(1, 'Die Liste ist leer.'),
});

module.exports = { createListSchema };
