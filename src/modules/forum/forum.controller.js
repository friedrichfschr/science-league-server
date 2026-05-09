const { asyncHandler } = require('../../lib/async-handler');
const {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  voteSchema,
  listPostsQuerySchema,
} = require('./forum.schemas');
const { forumService } = require('./forum.service');

const forumController = {
  // ─── Posts ─────────────────────────────────────────────────────────────────

  listPosts: asyncHandler(async (req, res) => {
    const query = listPostsQuerySchema.parse(req.query);
    const result = await forumService.listPosts({ ...query, userId: req.user?.id });
    res.json(result);
  }),

  getPost: asyncHandler(async (req, res) => {
    const post = await forumService.getPost(req.params.id, req.user?.id);
    res.json(post);
  }),

  createPost: asyncHandler(async (req, res) => {
    const { title, body } = createPostSchema.parse(req.body);
    const post = await forumService.createPost({ title, body, authorId: req.user.id });
    res.status(201).json(post);
  }),

  updatePost: asyncHandler(async (req, res) => {
    const { title, body } = updatePostSchema.parse(req.body);
    const post = await forumService.updatePost({
      postId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      title,
      body,
    });
    res.json(post);
  }),

  deletePost: asyncHandler(async (req, res) => {
    await forumService.deletePost({
      postId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    res.status(204).end();
  }),

  // ─── Comments ──────────────────────────────────────────────────────────────

  createComment: asyncHandler(async (req, res) => {
    const { body } = createCommentSchema.parse(req.body);
    const comment = await forumService.createComment({
      postId: req.params.id,
      body,
      authorId: req.user.id,
    });
    res.status(201).json(comment);
  }),

  updateComment: asyncHandler(async (req, res) => {
    const { body } = updateCommentSchema.parse(req.body);
    const comment = await forumService.updateComment({
      commentId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
      body,
    });
    res.json(comment);
  }),

  deleteComment: asyncHandler(async (req, res) => {
    await forumService.deleteComment({
      commentId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    res.status(204).end();
  }),

  // ─── Votes ─────────────────────────────────────────────────────────────────

  votePost: asyncHandler(async (req, res) => {
    const { value } = voteSchema.parse(req.body);
    const result = await forumService.vote({
      targetType: 'post',
      targetId: req.params.id,
      userId: req.user.id,
      value,
    });
    res.json(result);
  }),

  voteComment: asyncHandler(async (req, res) => {
    const { value } = voteSchema.parse(req.body);
    const result = await forumService.vote({
      targetType: 'comment',
      targetId: req.params.id,
      userId: req.user.id,
      value,
    });
    res.json(result);
  }),
};

module.exports = { forumController };
