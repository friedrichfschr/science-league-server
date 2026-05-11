const { asyncHandler } = require('../../lib/async-handler');
const { createListSchema } = require('./lists.schemas');
const { listsService } = require('./lists.service');

const listsController = {
  list: asyncHandler(async (req, res) => {
    const lists = await listsService.getLists(req.user.id);
    res.json({ lists });
  }),

  create: asyncHandler(async (req, res) => {
    const data = createListSchema.parse(req.body);
    const list = await listsService.createList({ userId: req.user.id, ...data });
    res.status(201).json({ message: 'Liste gespeichert.', list });
  }),

  delete: asyncHandler(async (req, res) => {
    await listsService.deleteList({ userId: req.user.id, listId: req.params.id });
    res.status(204).end();
  }),
};

module.exports = { listsController };
