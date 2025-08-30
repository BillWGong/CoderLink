const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { getInstance } = require('./services/dataManager');
const { getInstance: getUserModel } = require('./models/userModel');
const { getInstance: getClaimRequestModel } = require('./models/claimRequestModel');
const { getInstance: getContactOwnership } = require('./models/contactOwnershipModel');
const { getInstance: getPassportConfig } = require('./config/passport');
const setupRoutes = require('./routes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据管理器和认证系统
async function initializeData() {
  console.log('正在初始化数据管理器...');
  try {
    const dataManager = getInstance();
    await dataManager.initialize();
    console.log('数据管理器初始化完成');
    
    // 初始化用户相关模型
    const userModel = getUserModel();
    await userModel.initialize();
    console.log('用户模型初始化完成');
    
    const claimRequestModel = getClaimRequestModel();
    await claimRequestModel.initialize();
    console.log('认领申请模型初始化完成');
    
    const contactOwnership = getContactOwnership();
    await contactOwnership.initialize();
    console.log('联系人所有权模型初始化完成');
    
  } catch (error) {
    console.error('数据管理器初始化失败:', error);
    throw error;
  }
}

// 中间件
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    ['https://your-domain.com'] : 
    ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session 配置（用于 Passport）
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret_here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

// Passport 中间件
const passportConfig = getPassportConfig();
const passportMiddleware = passportConfig.getMiddleware();
app.use(passportMiddleware.initialize);
app.use(passportMiddleware.session);

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
