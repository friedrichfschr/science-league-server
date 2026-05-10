const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email().max(255).trim().toLowerCase(),
  username: z
    .string()
    .min(3)
    .max(50)
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, - and _'),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

const tokenQuerySchema = z.object({
  token: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

module.exports = { registerSchema, loginSchema, tokenQuerySchema, forgotPasswordSchema, resetPasswordSchema };
