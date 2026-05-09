const { z } = require('zod');
const { asyncHandler } = require('../../lib/async-handler');
const { usersService } = require('./users.service');

const roleSchema = z.object({
  role: z.enum(['user', 'moderator', 'admin']),
});

const usersController = {
  getRole: asyncHandler(async (req, res) => {
    const user = await usersService.getUserRole(req.params.id);
    res.json(user);
  }),

  setRole: asyncHandler(async (req, res) => {
    const { role } = roleSchema.parse(req.body);
    const result = await usersService.setUserRole({
      targetId: req.params.id,
      role,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });
    res.json(result);
  }),
};

module.exports = { usersController };
