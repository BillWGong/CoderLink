const { getInstance: getJWTUtils } = require('../utils/jwt');
const { getInstance: getUserModel } = require('../models/userModel');
const { getInstance: getContactOwnership } = require('../models/contactOwnershipModel');

class AuthMiddleware {
  constructor() {
    this.jwtUtils = getJWTUtils();
    this.userModel = getUserModel();
    this.contactOwnership = getContactOwnership();
  }

  // 验证JWT令牌
  requireAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.jwtUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({ 
          error: '未提供认证令牌',
          code: 'NO_TOKEN'
        });
      }

      // 验证令牌
      const decoded = this.jwtUtils.verifyToken(token);
      
      // 获取用户信息
      const user = await this.userModel.findById(decoded.sub);
      if (!user) {
        return res.status(401).json({ 
          error: '用户不存在',
          code: 'USER_NOT_FOUND'
        });
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: user.id,
        github_id: user.github_id,
        github_username: user.github_username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url
      };
      
      req.token = token;
      
      next();
    } catch (error) {
      console.error('认证中间件错误:', error);
      
      if (error.message === '令牌已过期') {
        return res.status(401).json({ 
          error: '令牌已过期，请重新登录',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.message === '无效的令牌') {
        return res.status(401).json({ 
          error: '无效的令牌',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          error: '认证失败',
          code: 'AUTH_FAILED'
        });
      }
    }
  };

  // 可选认证（不强制要求登录）
  optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.jwtUtils.extractTokenFromHeader(authHeader);
      
      if (token) {
        try {
          const decoded = this.jwtUtils.verifyToken(token);
          const user = await this.userModel.findById(decoded.sub);
          
          if (user) {
            req.user = {
              id: user.id,
              github_id: user.github_id,
              github_username: user.github_username,
              email: user.email,
              name: user.name,
              role: user.role,
              avatar_url: user.avatar_url
            };
            req.token = token;
          }
        } catch (error) {
          // 令牌无效时不报错，继续执行
          console.warn('可选认证中令牌验证失败:', error.message);
        }
      }
      
      next();
    } catch (error) {
      console.error('可选认证中间件错误:', error);
      next(); // 继续执行，不阻止请求
    }
  };

  // 要求管理员权限
  requireAdmin = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: '需要认证',
          code: 'AUTH_REQUIRED'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          error: '需要管理员权限',
          code: 'ADMIN_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('管理员权限验证错误:', error);
      return res.status(500).json({ 
        error: '权限验证失败',
        code: 'PERMISSION_CHECK_FAILED'
      });
    }
  };

  // 验证联系人所有权
  requireContactOwnership = async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: '需要认证',
          code: 'AUTH_REQUIRED'
        });
      }

      const contactId = req.params.id || req.params.contactId;
      if (!contactId) {
        return res.status(400).json({ 
          error: '缺少联系人ID',
          code: 'MISSING_CONTACT_ID'
        });
      }

      // 管理员可以访问所有联系人
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // 检查用户是否拥有该联系人
      const hasOwnership = await this.contactOwnership.hasOwnership(contactId, req.user.id);
      if (!hasOwnership) {
        return res.status(403).json({ 
          error: '您没有权限访问此联系人',
          code: 'NO_CONTACT_PERMISSION'
        });
      }

      next();
    } catch (error) {
      console.error('联系人所有权验证错误:', error);
      return res.status(500).json({ 
        error: '权限验证失败',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };

  // 验证用户只能访问自己的资源
  requireSelfOrAdmin = (userIdParam = 'userId') => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({ 
            error: '需要认证',
            code: 'AUTH_REQUIRED'
          });
        }

        const targetUserId = req.params[userIdParam];
        if (!targetUserId) {
          return res.status(400).json({ 
            error: '缺少用户ID',
            code: 'MISSING_USER_ID'
          });
        }

        // 管理员可以访问所有用户资源
        if (req.user.role === 'admin') {
          next();
          return;
        }

        // 用户只能访问自己的资源
        if (req.user.id !== targetUserId) {
          return res.status(403).json({ 
            error: '您只能访问自己的资源',
            code: 'SELF_ACCESS_ONLY'
          });
        }

        next();
      } catch (error) {
        console.error('自身资源访问验证错误:', error);
        return res.status(500).json({ 
          error: '权限验证失败',
          code: 'SELF_ACCESS_CHECK_FAILED'
        });
      }
    };
  };

  // 检查令牌是否需要刷新
  checkTokenRefresh = async (req, res, next) => {
    try {
      if (req.token && this.jwtUtils.isTokenExpiringSoon(req.token, 60)) {
        // 令牌将在1小时内过期，添加刷新提示
        res.set('X-Token-Refresh-Needed', 'true');
        
        const remainingTime = this.jwtUtils.getTokenRemainingTime(req.token);
        res.set('X-Token-Remaining-Time', remainingTime.toString());
      }
      
      next();
    } catch (error) {
      console.error('令牌刷新检查错误:', error);
      next(); // 不阻止请求继续
    }
  };

  // 刷新令牌端点
  refreshToken = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = this.jwtUtils.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({ 
          error: '未提供令牌',
          code: 'NO_TOKEN'
        });
      }

      const newToken = this.jwtUtils.refreshToken(token);
      
      res.json({
        success: true,
        token: newToken,
        message: '令牌刷新成功'
      });
    } catch (error) {
      console.error('令牌刷新失败:', error);
      return res.status(401).json({ 
        error: '令牌刷新失败',
        code: 'TOKEN_REFRESH_FAILED'
      });
    }
  };
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new AuthMiddleware();
  }
  return instance;
}

module.exports = { AuthMiddleware, getInstance };