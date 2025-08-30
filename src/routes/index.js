const express = require('express');
const contactRoutes = require('./contactRoutes');
const companyRoutes = require('./companyRoutes');
const organizationRoutes = require('./organizationRoutes');
const tagRoutes = require('./tagRoutes');
const dataRoutes = require('./dataRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const aiRoutes = require('./aiRoutes');
const { getInstance: getPassportConfig } = require('../config/passport');
const path = require('path');
const fs = require('fs');

// 创建路由函数
function setupRoutes(app) {
  // GitHub OAuth 回调 - 用户自定义路径（直接在主路由处理）
  const passportConfig = getPassportConfig();
  app.get('/login/github/authorized', 
    passportConfig.handleGitHubCallback(),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.redirect('/login?error=auth_failed');
        }

        const token = req.user.token;
        
        // 重定向到前端，并在URL中包含令牌
        // 在生产环境中，建议使用更安全的方式传递令牌
        res.redirect(`/?token=${encodeURIComponent(token)}&login=success`);
      } catch (error) {
        console.error('GitHub回调处理错误:', error);
        res.redirect('/login?error=callback_failed');
      }
    }
  );
  
  // 认证路由
  app.use('/auth', authRoutes);
  
  // API 路由
  app.use('/api/contacts', contactRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/data', dataRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);
  
  // 提供前端页面
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
  });
  
  // GitHub OAuth 回调页面
  app.get('/auth/callback', (req, res) => {
    res.sendFile(path.join(__dirname, '../../auth/callback.html'));
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
  app.use('/icon', express.static(path.join(__dirname, '../../icon')));
  
  // 处理其他静态文件
  app.use(express.static(path.join(__dirname, '../..')));
  
  // 404 处理
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    });
  });
}

module.exports = setupRoutes;