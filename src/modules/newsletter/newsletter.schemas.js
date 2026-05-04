const { z } = require('zod');

const subscribeSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),
});

const tokenQuerySchema = z.object({
  token: z
    .string({ required_error: 'Token is required' })
    .min(1, 'Token must not be empty'),
});

module.exports = { subscribeSchema, tokenQuerySchema };
