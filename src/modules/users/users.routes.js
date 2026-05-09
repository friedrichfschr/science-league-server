const { Router } = require('express');

const { authenticate } = require('../../middleware/authenticate');
const { requireRole } = require('../../middleware/require-role');
const { usersController } = require('./users.controller');

const usersRouter = Router();

// GET /api/users/:id/role — moderators and above
usersRouter.get('/:id/role', authenticate, requireRole('moderator'), usersController.getRole);

// PATCH /api/users/:id/role — moderators and above (service enforces admin-only for admin role)
usersRouter.patch('/:id/role', authenticate, requireRole('moderator'), usersController.setRole);

module.exports = { usersRouter };
