const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { getInstance: getUserModel } = require('../models/userModel');
const { getInstance: getJWTUtils } = require('../utils/jwt');
require('dotenv').config();

// 设置Node.js的网络配置
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // 临时禁用SSL验证用于调试
const https = require('https');
const http = require('http');

// 配置代理设置（如果需要）
const proxyConfig = {
  timeout: 30000, // 30秒超时
  keepAlive: true
};

// 创建自定义的HTTPS Agent
const httpsAgent = new https.Agent({
  timeout: 30000,
  keepAlive: true,
  rejectUnauthorized: false // 临时禁用SSL验证
});

// 监控HTTPS请求
const originalRequest = https.request;
https.request = function(options, callback) {
  console.log('HTTPS请求:', {
    hostname: options.hostname || options.host,
    path: options.path,
    method: options.method,
    headers: options.headers,
    timeout: options.timeout || 30000
  });
  
  // 设置超时和Agent
  options.timeout = options.timeout || 30000;
  options.agent = httpsAgent;
  
  const req = originalRequest.call(this, options, callback);
  
  req.on('timeout', () => {
    console.error('HTTPS请求超时:', options.hostname + options.path);
    req.destroy();
  });
  
  req.on('error', (error) => {
    console.error('HTTPS请求错误:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  });
  
  return req;
};

class PassportConfig {
  constructor() {
    this.userModel = getUserModel();
    this.jwtUtils = getJWTUtils();
    this.setupGitHubStrategy();
    this.setupSerialization();
  }

  setupGitHubStrategy() {
    console.log('设置GitHub OAuth策略，配置信息:', {
      clientID: process.env.GITHUB_CLIENT_ID ? '已配置' : '未配置',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ? '已配置' : '未配置',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/login/github/authorized'
    });
    
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/login/github/authorized'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub OAuth 回调，用户信息:', {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value
        });

        // 查找现有用户
        let user = await this.userModel.findByGithubId(profile.id);
        
        if (user) {
          // 更新现有用户的GitHub信息
          user = await this.userModel.updateGithubInfo(profile.id, {
            login: profile.username,
            email: profile.emails?.[0]?.value || user.email,
            avatar_url: profile.photos?.[0]?.value || user.avatar_url,
            name: profile.displayName || user.name,
            company: profile._json?.company || user.company,
            location: profile._json?.location || user.location,
            bio: profile._json?.bio || user.bio
          });
          
          console.log('更新现有用户信息:', user.github_username);
        } else {
          // 创建新用户
          user = await this.userModel.create({
            github_id: profile.id,
            github_username: profile.username,
            email: profile.emails?.[0]?.value,
            avatar_url: profile.photos?.[0]?.value,
            name: profile.displayName,
            company: profile._json?.company,
            location: profile._json?.location,
            bio: profile._json?.bio,
            role: 'user'
          });
          
          console.log('创建新用户:', user.github_username);
        }

        // 生成JWT令牌
        const token = this.jwtUtils.generateToken(user);
        
        // 将令牌添加到用户对象中，以便在回调中使用
        user.token = token;
        
        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth 策略错误:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          statusCode: error.statusCode,
          data: error.data
        });
        return done(error, null);
      }
    }));
  }

  setupSerialization() {
    // 序列化用户（存储到session）
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    // 反序列化用户（从session恢复）
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.userModel.findById(id);
        done(null, user);
      } catch (error) {
        console.error('用户反序列化错误:', error);
        done(error, null);
      }
    });
  }

  // 获取配置的中间件
  getMiddleware() {
    return {
      initialize: passport.initialize(),
      session: passport.session()
    };
  }

  // GitHub认证路由处理器
  authenticateGitHub() {
    return passport.authenticate('github', { 
      scope: ['user:email', 'read:user'] 
    });
  }

  // GitHub回调路由处理器
  handleGitHubCallback() {
    return passport.authenticate('github', { 
      failureRedirect: '/login?error=auth_failed',
      session: false // 我们使用JWT，不需要session
    });
  }

  // 验证GitHub访问令牌
  async verifyGitHubToken(accessToken) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'CoderLink-App'
        }
      });

      if (!response.ok) {
        throw new Error('GitHub API请求失败');
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('验证GitHub令牌失败:', error);
      throw error;
    }
  }

  // 获取GitHub用户的公开仓库
  async getUserRepositories(accessToken, username) {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?type=public&sort=updated&per_page=10`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'CoderLink-App'
        }
      });

      if (!response.ok) {
        throw new Error('获取GitHub仓库失败');
      }

      const repositories = await response.json();
      return repositories.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updated_at: repo.updated_at
      }));
    } catch (error) {
      console.error('获取GitHub仓库失败:', error);
      return [];
    }
  }

  // 获取GitHub用户的组织信息
  async getUserOrganizations(accessToken) {
    try {
      const response = await fetch('https://api.github.com/user/orgs', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'CoderLink-App'
        }
      });

      if (!response.ok) {
        throw new Error('获取GitHub组织失败');
      }

      const organizations = await response.json();
      return organizations.map(org => ({
        name: org.login,
        description: org.description,
        url: org.html_url,
        avatar_url: org.avatar_url
      }));
    } catch (error) {
      console.error('获取GitHub组织失败:', error);
      return [];
    }
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new PassportConfig();
  }
  return instance;
}

module.exports = { PassportConfig, getInstance };