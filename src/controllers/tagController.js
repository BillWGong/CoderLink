const Tag = require('../models/tagModel');

// 标签控制器
const tagController = {
  // 获取所有标签
  getAllTags: async (req, res) => {
    try {
      const tags = await Tag.getAllTags();
      res.json({
        success: true,
        data: tags,
        message: '成功获取所有标签'
      });
    } catch (error) {
      console.error('获取标签列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标签列表失败',
        error: error.message
      });
    }
  },

  // 根据ID获取标签
  getTagById: async (req, res) => {
    try {
      const { id } = req.params;
      const tag = await Tag.getTagById(id);
      
      if (!tag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }
      
      res.json({
        success: true,
        data: tag,
        message: '成功获取标签信息'
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标签失败',
        error: error.message
      });
    }
  },

  // 创建新标签
  createTag: async (req, res) => {
    try {
      const { name, description, color, relatedTags, parent_tags, child_tags, connections, connection_count } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '标签名称不能为空'
        });
      }
      
      // 检查标签名是否已存在
      const existingTags = await Tag.getAllTags();
      const isDuplicate = existingTags.some(tag => tag.name.toLowerCase() === name.toLowerCase());
      
      if (isDuplicate) {
        return res.status(400).json({
          success: false,
          message: '标签名称已存在'
        });
      }
      
      // 构建标签数据对象
      const tagData = {
        name: name.trim(),
        description: description || '',
        color: color || '#6B7280',
        parent_tags: parent_tags || [],
        child_tags: child_tags || [],
        connection_count: connection_count || 0,
        connections: connections || []
      };
      
      // 添加可选字段
      if (relatedTags !== undefined) {
        tagData.relatedTags = relatedTags;
      }
      
      const newTag = await Tag.createTag(tagData);
      
      res.status(201).json({
        success: true,
        data: newTag,
        message: '标签创建成功'
      });
    } catch (error) {
      console.error('创建标签失败:', error);
      res.status(500).json({
        success: false,
        message: '创建标签失败',
        error: error.message
      });
    }
  },

  // 更新标签
  updateTag: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, color, relatedTags, parent_tags, child_tags, connections, connection_count } = req.body;

      // 验证标签名称
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: '标签名称不能为空' });
      }

      // 检查是否存在同名标签（排除当前标签）
      const allTags = await Tag.getAllTags();
      const existingTag = allTags.find(tag => tag.name.toLowerCase() === name.trim().toLowerCase());
      if (existingTag && existingTag._id !== id) {
        return res.status(400).json({ error: '标签名称已存在' });
      }

      const updateData = {
        name: name.trim(),
        description: description || '',
        color: color || '#3B82F6',
        updated_at: new Date().toISOString()
      };

      // 处理标签关联关系 - 优先使用relatedTags，如果没有则使用parent_tags/child_tags
      if (relatedTags && Array.isArray(relatedTags)) {
        // 将relatedTags转换为parent_tags格式
        updateData.parent_tags = relatedTags.map(tag => ({
          _id: tag._id,
          name: tag.name
        }));
        updateData.child_tags = child_tags || [];
      } else {
        // 使用现有的parent_tags/child_tags
        updateData.parent_tags = parent_tags || [];
        updateData.child_tags = child_tags || [];
      }

      // 保留其他字段
      if (connections !== undefined) updateData.connections = connections;
      if (connection_count !== undefined) updateData.connection_count = connection_count;

      const updatedTag = await Tag.updateTag(id, updateData);
      res.json(updatedTag);
    } catch (error) {
      console.error('更新标签失败:', error);
      res.status(500).json({ error: '更新标签失败' });
    }
  },

  // 删除标签
  deleteTag: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedTag = await Tag.deleteTag(id);
      
      if (!deletedTag) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }
      
      res.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      console.error('删除标签失败:', error);
      res.status(500).json({
        success: false,
        message: '删除标签失败',
        error: error.message
      });
    }
  }
};

module.exports = tagController;