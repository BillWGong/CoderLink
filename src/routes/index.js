const express = require('express');
const contactRoutes = require('./contactRoutes');
const companyRoutes = require('./companyRoutes');
const organizationRoutes = require('./organizationRoutes');
const tagRoutes = require('./tagRoutes');
const dataRoutes = require('./dataRoutes');
const path = require('path');
const fs = require('fs');

// 创建路由函数
function setupRoutes(app) {
  // API 路由
  app.use('/api/contacts', contactRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/data', dataRoutes);
  
  // 提供前端页面
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
  });
  
  // 处理 favicon.ico 请求
  app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, '../../favicon.ico');
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      // 返回一个简单的透明图标或204状态
      res.status(204).end();
    }
  });
  
  // 静态资源服务 - 处理 CSS, JS, 图片等
  app.use('/css', express.static(path.join(__dirname, '../../css')));
  app.use('/js', express.static(path.join(__dirname, '../../js')));
  app.use('/assets', express.static(path.join(__dirname, '../../assets')));
  
  // 404 处理 - 区分API和静态资源请求
  app.use((req, res) => {
    // 如果是API请求，返回JSON错误
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: '请求的API资源不存在' });
    } else if (req.path.includes('/@vite/') || req.path.includes('/node_modules/')) {
      // 开发工具相关请求，静默处理
      res.status(404).end();
    } else {
      // 其他静态资源请求
      res.status(404).send('页面未找到');
    }
  });
  
  // 全局错误处理
  app.use((err, req, res, next) => {
    console.error('错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  });
}

module.exports = setupRoutes;