const { z } = require('zod');

const createPostSchema = z.object({
  title: z.string().min(3).max(255).trim(),
  body: z.string().min(1).max(10000).trim(),
});

const updatePostSchema = z.object({
  title: z.string().min(3).max(255).trim().optional(),
  body: z.string().min(1).max(10000).trim().optional(),
}).refine((d) => d.title !== undefined || d.body !== undefined, {
  message: 'At least one of title or body is required.',
});

const createCommentSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
});

const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000).trim(),
});

const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

const listPostsQuerySchema = z.object({
  sort: z.enum(['new', 'top']).default('new'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  voteSchema,
  listPostsQuerySchema,
};
