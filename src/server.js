const express = require('express');
const path = require('path');
const { getInstance } = require('./services/dataManager');
const setupRoutes = require('./routes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据管理器
async function initializeData() {
  console.log('正在初始化数据管理器...');
  try {
    const dataManager = getInstance();
    await dataManager.initialize();
    console.log('数据管理器初始化完成');
  } catch (error) {
    console.error('数据管理器初始化失败:', error);
    throw error;
  }
}

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..')));
app.use(logger);

// 设置路由
setupRoutes(app);

// 错误处理中间件（必须在路由之后）
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 先初始化数据管理器
    await initializeData();
    
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`访问 http://localhost:${PORT} 查看应用`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 如果这个文件被直接运行
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
