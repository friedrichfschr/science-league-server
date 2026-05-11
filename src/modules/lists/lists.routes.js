const { Router } = require('express');

const { authenticate } = require('../../middleware/authenticate');
const { listsController } = require('./lists.controller');

const listsRouter = Router();

listsRouter.get('/', authenticate, listsController.list);
listsRouter.post('/', authenticate, listsController.create);
listsRouter.delete('/:id', authenticate, listsController.delete);

module.exports = { listsRouter };
