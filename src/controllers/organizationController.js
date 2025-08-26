const { Organization } = require('../models');

// 组织控制器
const organizationController = {
  // 获取所有组织
  getAllOrganizations: async (req, res) => {
    try {
      const organizations = await Organization.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 获取单个组织
  getOrganizationById: async (req, res) => {
    try {
      const organization = await Organization.getOrganizationById(req.params.id);
      if (!organization) {
        return res.status(404).json({ error: '组织不存在' });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 创建组织
  createOrganization: async (req, res) => {
    try {
      const newOrganization = await Organization.createOrganization(req.body);
      res.status(201).json(newOrganization);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // 更新组织
  updateOrganization: async (req, res) => {
    try {
      const updatedOrganization = await Organization.updateOrganization(req.params.id, req.body);
      res.json(updatedOrganization);
    } catch (error) {
      if (error.message === '组织不存在') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },

  // 删除组织
  deleteOrganization: async (req, res) => {
    try {
      await Organization.deleteOrganization(req.params.id);
      res.json({ message: '组织已删除' });
    } catch (error) {
      if (error.message === '组织不存在') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = organizationController;