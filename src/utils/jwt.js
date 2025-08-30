const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtils {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // 生成JWT令牌
  generateToken(payload) {
    try {
      const token = jwt.sign(
        {
          sub: payload.id,
          github_id: payload.github_id,
          username: payload.github_username,
          role: payload.role,
          iat: Math.floor(Date.now() / 1000)
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
          issuer: 'CoderLink',
          audience: 'CoderLink-Users'
        }
      );
      
      return token;
    } catch (error) {
      console.error('生成JWT令牌失败:', error);
      throw new Error('令牌生成失败');
    }
  }

  // 验证JWT令牌
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'CoderLink',
        audience: 'CoderLink-Users'
      });
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      } else {
        console.error('验证JWT令牌失败:', error);
        throw new Error('令牌验证失败');
      }
    }
  }

  // 刷新令牌
  refreshToken(token) {
    try {
      // 验证当前令牌（忽略过期时间）
      const decoded = jwt.verify(token, this.secret, {
        ignoreExpiration: true,
        issuer: 'CoderLink',
        audience: 'CoderLink-Users'
      });
      
      // 生成新令牌
      const newToken = this.generateToken({
        id: decoded.sub,
        github_id: decoded.github_id,
        github_username: decoded.username,
        role: decoded.role
      });
      
      return newToken;
    } catch (error) {
      console.error('刷新JWT令牌失败:', error);
      throw new Error('令牌刷新失败');
    }
  }

  // 解码令牌（不验证）
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('解码JWT令牌失败:', error);
      throw new Error('令牌解码失败');
    }
  }

  // 检查令牌是否即将过期（在指定分钟内过期）
  isTokenExpiringSoon(token, minutesThreshold = 30) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp;
      const timeUntilExpiration = expirationTime - currentTime;
      const thresholdInSeconds = minutesThreshold * 60;
      
      return timeUntilExpiration <= thresholdInSeconds;
    } catch (error) {
      return true; // 如果无法解码，认为需要刷新
    }
  }

  // 获取令牌的剩余有效时间（秒）
  getTokenRemainingTime(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      
      return Math.max(0, remainingTime);
    } catch (error) {
      return 0;
    }
  }

  // 从请求头中提取令牌
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  // 生成API密钥（用于服务间通信）
  generateApiKey(payload, expiresIn = '30d') {
    try {
      const token = jwt.sign(
        {
          ...payload,
          type: 'api_key',
          iat: Math.floor(Date.now() / 1000)
        },
        this.secret,
        {
          expiresIn,
          issuer: 'CoderLink-API',
          audience: 'CoderLink-Services'
        }
      );
      
      return token;
    } catch (error) {
      console.error('生成API密钥失败:', error);
      throw new Error('API密钥生成失败');
    }
  }

  // 验证API密钥
  verifyApiKey(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'CoderLink-API',
        audience: 'CoderLink-Services'
      });
      
      if (decoded.type !== 'api_key') {
        throw new Error('无效的API密钥类型');
      }
      
      return decoded;
    } catch (error) {
      console.error('验证API密钥失败:', error);
      throw new Error('API密钥验证失败');
    }
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new JWTUtils();
  }
  return instance;
}

module.exports = { JWTUtils, getInstance };