const { Router } = require('express');

const { authenticate, authenticateOptional } = require('../../middleware/authenticate');
const { forumController } = require('./forum.controller');

const forumRouter = Router();

// Posts — read is public, write requires auth
forumRouter.get('/posts',         authenticateOptional, forumController.listPosts);
forumRouter.get('/posts/:id',     authenticateOptional, forumController.getPost);
forumRouter.post('/posts',        authenticate,         forumController.createPost);
forumRouter.patch('/posts/:id',   authenticate,         forumController.updatePost);
forumRouter.delete('/posts/:id',  authenticate,         forumController.deletePost);

// Comments
forumRouter.post('/posts/:id/comments',  authenticate, forumController.createComment);
forumRouter.patch('/comments/:id',       authenticate, forumController.updateComment);
forumRouter.delete('/comments/:id',      authenticate, forumController.deleteComment);

// Votes
forumRouter.post('/posts/:id/vote',    authenticate, forumController.votePost);
forumRouter.post('/comments/:id/vote', authenticate, forumController.voteComment);

module.exports = { forumRouter };
