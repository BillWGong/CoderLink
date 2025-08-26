const { Company } = require('../models');

// 公司控制器
const companyController = {
  // 获取所有公司
  getAllCompanies: async (req, res) => {
    try {
      const companies = await Company.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 获取单个公司
  getCompanyById: async (req, res) => {
    try {
      const company = await Company.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ error: '公司不存在' });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 创建公司
  createCompany: async (req, res) => {
    try {
      const newCompany = await Company.createCompany(req.body);
      res.status(201).json(newCompany);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // 更新公司
  updateCompany: async (req, res) => {
    try {
      const updatedCompany = await Company.updateCompany(req.params.id, req.body);
      res.json(updatedCompany);
    } catch (error) {
      if (error.message === '公司不存在') {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },

  // 删除公司
  deleteCompany: async (req, res) => {
    try {
      await Company.deleteCompany(req.params.id);
      res.json({ message: '公司已删除' });
    } catch (error) {
      if (error.message === '公司不存在') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = companyController;