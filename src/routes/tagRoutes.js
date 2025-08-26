const express = require('express');
const tagController = require('../controllers/tagController');

const router = express.Router();

// 标签路由
router.get('/', tagController.getAllTags);           // GET /api/tags - 获取所有标签
router.get('/:id', tagController.getTagById);        // GET /api/tags/:id - 根据ID获取标签
router.post('/', tagController.createTag);           // POST /api/tags - 创建新标签
router.put('/:id', tagController.updateTag);         // PUT /api/tags/:id - 更新标签
router.delete('/:id', tagController.deleteTag);      // DELETE /api/tags/:id - 删除标签

module.exports = router;