const express = require('express');
const contactController = require('../controllers/contactController');
const { validateContact, validateId, validateRequestSize } = require('../middleware/validation');

const router = express.Router();

// 应用请求大小验证到所有路由
router.use(validateRequestSize);

// 联系人路由
router.get('/', contactController.getAllContacts);
router.get('/:id', validateId, contactController.getContactById);
router.post('/', validateContact, contactController.createContact);
router.put('/:id', validateId, validateContact, contactController.updateContact);
router.delete('/:id', validateId, contactController.deleteContact);

module.exports = router;