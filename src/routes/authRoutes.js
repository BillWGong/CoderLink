const express = require('express');
const { getInstance: getPassportConfig } = require('../config/passport');
const { getInstance: getAuthMiddleware } = require('../middleware/auth');
const { getInstance: getUserModel } = require('../models/userModel');
const { getInstance: getJWTUtils } = require('../utils/jwt');

const router = express.Router();
const passportConfig = getPassportConfig();
const authMiddleware = getAuthMiddleware();
const userModel = getUserModel();
const jwtUtils = getJWTUtils();

// GitHub OAuth 登录
router.get('/github', passportConfig.authenticateGitHub());

// GitHub OAuth 回调
router.get('/github/authorized', 
  passportConfig.handleGitHubCallback(),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect('/?error=auth_failed');
      }

      const token = req.user.token;
      
      // 设置安全的HttpOnly cookie来存储token
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });
      
      // 直接重定向到首页，不在URL中暴露token
      res.redirect('/?login=success');
    } catch (error) {
      console.error('GitHub回调处理错误:', error);
      res.redirect('/?error=callback_failed');
    }
  }
);



// 获取当前用户信息
router.get('/me', authMiddleware.requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 返回用户信息（不包含敏感数据）
    const userInfo = {
      id: user.id,
      github_id: user.github_id,
      github_username: user.github_username,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      company: user.company,
      location: user.location,
      bio: user.bio,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      error: '获取用户信息失败',
      code: 'GET_USER_FAILED'
    });
  }
});

// 更新用户档案
router.put('/profile', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { name, company, location, bio } = req.body;
    
    // 验证输入数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await userModel.update(req.user.id, updateData);
    
    // 返回更新后的用户信息
    const userInfo = {
      id: updatedUser.id,
      github_id: updatedUser.github_id,
      github_username: updatedUser.github_username,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar_url: updatedUser.avatar_url,
      company: updatedUser.company,
      location: updatedUser.location,
      bio: updatedUser.bio,
      role: updatedUser.role,
      updated_at: updatedUser.updated_at
    };

    res.json({
      success: true,
      user: userInfo,
      message: '档案更新成功'
    });
  } catch (error) {
    console.error('更新用户档案错误:', error);
    res.status(500).json({ 
      error: '更新档案失败',
      code: 'UPDATE_PROFILE_FAILED'
    });
  }
});

// 用户登出
router.post('/logout', async (req, res) => {
  try {
    // 清除认证cookie
    res.clearCookie('auth_token');
    
    // 在实际应用中，可以将令牌加入黑名单
    // 这里简单返回成功消息
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('用户登出错误:', error);
    res.status(500).json({ 
      error: '登出失败',
      code: 'LOGOUT_FAILED'
    });
  }
});

// 刷新令牌
router.post('/refresh', authMiddleware.refreshToken);

// 验证令牌
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: '缺少令牌',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwtUtils.verifyToken(token);
    const user = await userModel.findById(decoded.sub);
    
    if (!user) {
      return res.status(401).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        github_username: user.github_username,
        role: user.role
      },
      expires_in: jwtUtils.getTokenRemainingTime(token)
    });
  } catch (error) {
    console.error('令牌验证错误:', error);
    
    if (error.message === '令牌已过期') {
      return res.json({
        success: true,
        valid: false,
        expired: true,
        message: '令牌已过期'
      });
    } else {
      return res.json({
        success: true,
        valid: false,
        message: '无效的令牌'
      });
    }
  }
});

// 获取当前登录状态（从cookie中读取token）
router.get('/status', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.json({
        success: true,
        authenticated: false,
        message: '未登录'
      });
    }

    const decoded = jwtUtils.verifyToken(token);
    const user = await userModel.findById(decoded.sub);
    
    if (!user) {
      // 清除无效的cookie
      res.clearCookie('auth_token');
      return res.json({
        success: true,
        authenticated: false,
        message: '用户不存在'
      });
    }

    // 返回用户信息和token给前端
    res.json({
      success: true,
      authenticated: true,
      token: token,
      user: {
        id: user.id,
        github_id: user.github_id,
        github_username: user.github_username,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        company: user.company,
        location: user.location,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      expires_in: jwtUtils.getTokenRemainingTime(token)
    });
  } catch (error) {
    console.error('获取登录状态错误:', error);
    
    // 清除无效的cookie
    res.clearCookie('auth_token');
    
    if (error.message === '令牌已过期') {
      return res.json({
        success: true,
        authenticated: false,
        expired: true,
        message: '令牌已过期'
      });
    } else {
      return res.json({
        success: true,
        authenticated: false,
        message: '无效的令牌'
      });
    }
  }
});

// 获取用户的GitHub仓库信息（需要额外的GitHub API调用）
router.get('/github/repositories', authMiddleware.requireAuth, async (req, res) => {
  try {
    // 注意：这需要存储用户的GitHub访问令牌
    // 目前我们只返回模拟数据，实际实现需要OAuth访问令牌
    res.json({
      success: true,
      repositories: [],
      message: '需要实现GitHub API集成以获取仓库信息'
    });
  } catch (error) {
    console.error('获取GitHub仓库错误:', error);
    res.status(500).json({ 
      error: '获取仓库信息失败',
      code: 'GET_REPOSITORIES_FAILED'
    });
  }
});

// 获取用户统计信息
router.get('/stats', authMiddleware.requireAuth, async (req, res) => {
  try {
    // 这里可以添加用户统计信息，如认领的联系人数量等
    const stats = {
      claimed_contacts: 0, // 需要从ContactOwnership模型获取
      pending_claims: 0,   // 需要从ClaimRequest模型获取
      total_connections: 0  // 需要计算用户的网络连接数
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ 
      error: '获取统计信息失败',
      code: 'GET_STATS_FAILED'
    });
  }
});

// 删除用户账号
router.delete('/account', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({ 
        error: '请确认删除操作',
        code: 'CONFIRMATION_REQUIRED'
      });
    }

    // 删除用户账号（需要同时清理相关数据）
    await userModel.delete(req.user.id);
    
    res.json({
      success: true,
      message: '账号删除成功'
    });
  } catch (error) {
    console.error('删除用户账号错误:', error);
    res.status(500).json({ 
      error: '删除账号失败',
      code: 'DELETE_ACCOUNT_FAILED'
    });
  }
});

module.exports = router;