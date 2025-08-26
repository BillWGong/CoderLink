const express = require('express');
const { getInstance } = require('../services/dataManager');

const router = express.Router();

// 获取数据版本信息
router.get('/version', (req, res) => {
  try {
    const dataManager = getInstance();
    const versionInfo = dataManager.getVersionInfo();
    res.json(versionInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取所有数据（带版本信息）
router.get('/all', async (req, res) => {
  try {
    const dataManager = getInstance();
    
    // 确保数据已初始化
    if (!dataManager.isLoaded) {
      await dataManager.initialize();
    }
    
    const allData = dataManager.getAllData();
    const versionInfo = dataManager.getVersionInfo();
    
    res.json({
      data: allData,
      version: versionInfo.version,
      lastModified: versionInfo.lastModified
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;