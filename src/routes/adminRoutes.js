const express = require('express');
const { getInstance: getAuthMiddleware } = require('../middleware/auth');
const { getInstance: getUserModel } = require('../models/userModel');
const { getInstance: getContactOwnership } = require('../models/contactOwnershipModel');
const { getInstance: getClaimRequestModel } = require('../models/claimRequestModel');

const router = express.Router();
const authMiddleware = getAuthMiddleware();
const userModel = getUserModel();
const contactOwnership = getContactOwnership();
const claimRequestModel = getClaimRequestModel();

// 所有管理员路由都需要管理员权限
router.use(authMiddleware.requireAuth);
router.use(authMiddleware.requireAdmin);

// 获取待审核的认领申请
router.get('/claims/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pendingClaims = await claimRequestModel.getPendingRequests();
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedClaims = pendingClaims.slice(startIndex, endIndex);
    
    // 获取申请用户信息
    const claimsWithUserInfo = await Promise.all(
      paginatedClaims.map(async (claim) => {
        const user = await userModel.findById(claim.user_id);
        return {
          ...claim,
          user: user ? {
            id: user.id,
            github_username: user.github_username,
            name: user.name,
            avatar_url: user.avatar_url,
            email: user.email
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      claims: claimsWithUserInfo,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: pendingClaims.length,
        total_pages: Math.ceil(pendingClaims.length / limit)
      }
    });
  } catch (error) {
    console.error('获取待审核申请错误:', error);
    res.status(500).json({ 
      error: '获取待审核申请失败',
      code: 'GET_PENDING_CLAIMS_FAILED'
    });
  }
});

// 获取所有认领申请（包含历史记录）
router.get('/claims', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, user_id } = req.query;
    
    let claims = await claimRequestModel.findAll();
    
    // 按状态过滤
    if (status) {
      claims = claims.filter(claim => claim.status === status);
    }
    
    // 按用户过滤
    if (user_id) {
      claims = claims.filter(claim => claim.user_id === user_id);
    }
    
    // 按创建时间倒序排列
    claims.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedClaims = claims.slice(startIndex, endIndex);
    
    // 获取用户和管理员信息
    const claimsWithInfo = await Promise.all(
      paginatedClaims.map(async (claim) => {
        const user = await userModel.findById(claim.user_id);
        const admin = claim.admin_id ? await userModel.findById(claim.admin_id) : null;
        
        return {
          ...claim,
          user: user ? {
            id: user.id,
            github_username: user.github_username,
            name: user.name,
            avatar_url: user.avatar_url
          } : null,
          admin: admin ? {
            id: admin.id,
            github_username: admin.github_username,
            name: admin.name
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      claims: claimsWithInfo,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: claims.length,
        total_pages: Math.ceil(claims.length / limit)
      }
    });
  } catch (error) {
    console.error('获取认领申请错误:', error);
    res.status(500).json({ 
      error: '获取认领申请失败',
      code: 'GET_CLAIMS_FAILED'
    });
  }
});

// 批准认领申请
router.put('/claims/:claimId/approve', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { comment } = req.body;
    
    const claim = await claimRequestModel.findById(claimId);
    if (!claim) {
      return res.status(404).json({ 
        error: '认领申请不存在',
        code: 'CLAIM_NOT_FOUND'
      });
    }
    
    if (claim.status !== 'pending') {
      return res.status(400).json({ 
        error: '只能审核待处理的申请',
        code: 'CLAIM_ALREADY_PROCESSED'
      });
    }
    
    // 检查联系人是否已被其他用户认领
    const isAlreadyClaimed = await contactOwnership.isContactClaimed(claim.contact_id);
    if (isAlreadyClaimed) {
      // 自动拒绝申请
      await claimRequestModel.reject(claimId, req.user.id, '联系人已被其他用户认领');
      return res.status(400).json({ 
        error: '联系人已被其他用户认领',
        code: 'CONTACT_ALREADY_CLAIMED'
      });
    }
    
    // 批准申请
    const approvedClaim = await claimRequestModel.approve(claimId, req.user.id, comment);
    
    // 创建所有权关系
    await contactOwnership.create({
      contact_id: claim.contact_id,
      user_id: claim.user_id
    });
    
    res.json({
      success: true,
      claim: approvedClaim,
      message: '认领申请已批准'
    });
  } catch (error) {
    console.error('批准认领申请错误:', error);
    res.status(500).json({ 
      error: '批准申请失败',
      code: 'APPROVE_CLAIM_FAILED'
    });
  }
});

// 拒绝认领申请
router.put('/claims/:claimId/reject', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { comment } = req.body;
    
    const claim = await claimRequestModel.findById(claimId);
    if (!claim) {
      return res.status(404).json({ 
        error: '认领申请不存在',
        code: 'CLAIM_NOT_FOUND'
      });
    }
    
    if (claim.status !== 'pending') {
      return res.status(400).json({ 
        error: '只能审核待处理的申请',
        code: 'CLAIM_ALREADY_PROCESSED'
      });
    }
    
    const rejectedClaim = await claimRequestModel.reject(claimId, req.user.id, comment || '申请被拒绝');
    
    res.json({
      success: true,
      claim: rejectedClaim,
      message: '认领申请已拒绝'
    });
  } catch (error) {
    console.error('拒绝认领申请错误:', error);
    res.status(500).json({ 
      error: '拒绝申请失败',
      code: 'REJECT_CLAIM_FAILED'
    });
  }
});

// 批量处理认领申请
router.post('/claims/batch', async (req, res) => {
  try {
    const { action, claim_ids, comment } = req.body;
    
    if (!action || !claim_ids || !Array.isArray(claim_ids)) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: '无效的操作类型',
        code: 'INVALID_ACTION'
      });
    }
    
    const results = [];
    
    for (const claimId of claim_ids) {
      try {
        const claim = await claimRequestModel.findById(claimId);
        if (!claim || claim.status !== 'pending') {
          results.push({
            claim_id: claimId,
            success: false,
            error: '申请不存在或已处理'
          });
          continue;
        }
        
        if (action === 'approve') {
          // 检查联系人是否已被认领
          const isAlreadyClaimed = await contactOwnership.isContactClaimed(claim.contact_id);
          if (isAlreadyClaimed) {
            await claimRequestModel.reject(claimId, req.user.id, '联系人已被其他用户认领');
            results.push({
              claim_id: claimId,
              success: false,
              error: '联系人已被其他用户认领'
            });
            continue;
          }
          
          await claimRequestModel.approve(claimId, req.user.id, comment);
          await contactOwnership.create({
            contact_id: claim.contact_id,
            user_id: claim.user_id
          });
        } else {
          await claimRequestModel.reject(claimId, req.user.id, comment || '批量拒绝');
        }
        
        results.push({
          claim_id: claimId,
          success: true,
          action
        });
      } catch (error) {
        results.push({
          claim_id: claimId,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      results,
      summary: {
        total: claim_ids.length,
        success: successCount,
        failed: claim_ids.length - successCount
      },
      message: `批量操作完成，成功处理 ${successCount}/${claim_ids.length} 个申请`
    });
  } catch (error) {
    console.error('批量处理认领申请错误:', error);
    res.status(500).json({ 
      error: '批量处理失败',
      code: 'BATCH_PROCESS_FAILED'
    });
  }
});

// 获取所有用户列表
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let users = await userModel.findAll();
    
    // 按角色过滤
    if (role) {
      users = users.filter(user => user.role === role);
    }
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.github_username.toLowerCase().includes(searchLower) ||
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    
    // 按创建时间倒序排列
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    // 获取用户统计信息
    const usersWithStats = await Promise.all(
      paginatedUsers.map(async (user) => {
        const ownerships = await contactOwnership.findContactsByUserId(user.id);
        const claims = await claimRequestModel.findByUserId(user.id);
        
        return {
          id: user.id,
          github_id: user.github_id,
          github_username: user.github_username,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          company: user.company,
          location: user.location,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
          stats: {
            owned_contacts: ownerships.length,
            total_claims: claims.length,
            pending_claims: claims.filter(c => c.status === 'pending').length
          }
        };
      })
    );
    
    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: users.length,
        total_pages: Math.ceil(users.length / limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      error: '获取用户列表失败',
      code: 'GET_USERS_FAILED'
    });
  }
});

// 更新用户角色
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        error: '无效的角色类型',
        code: 'INVALID_ROLE'
      });
    }
    
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 防止管理员降级自己
    if (userId === req.user.id && role === 'user') {
      return res.status(400).json({ 
        error: '不能降级自己的管理员权限',
        code: 'CANNOT_DEMOTE_SELF'
      });
    }
    
    const updatedUser = await userModel.update(userId, { role });
    
    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        github_username: updatedUser.github_username,
        role: updatedUser.role,
        updated_at: updatedUser.updated_at
      },
      message: `用户角色已更新为 ${role}`
    });
  } catch (error) {
    console.error('更新用户角色错误:', error);
    res.status(500).json({ 
      error: '更新用户角色失败',
      code: 'UPDATE_USER_ROLE_FAILED'
    });
  }
});

// 获取系统统计信息
router.get('/stats', async (req, res) => {
  try {
    const users = await userModel.findAll();
    const claims = await claimRequestModel.findAll();
    const ownerships = await contactOwnership.findAll();
    
    const stats = {
      total_users: users.length,
      admin_users: users.filter(u => u.role === 'admin').length,
      regular_users: users.filter(u => u.role === 'user').length,
      total_claims: claims.length,
      pending_claims: claims.filter(c => c.status === 'pending').length,
      approved_claims: claims.filter(c => c.status === 'approved').length,
      rejected_claims: claims.filter(c => c.status === 'rejected').length,
      total_ownerships: ownerships.length,
      claimed_contacts: new Set(ownerships.map(o => o.contact_id)).size,
      claim_approval_rate: claims.length > 0 ? 
        (claims.filter(c => c.status === 'approved').length / claims.length * 100).toFixed(1) : 0
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取系统统计错误:', error);
    res.status(500).json({ 
      error: '获取系统统计失败',
      code: 'GET_SYSTEM_STATS_FAILED'
    });
  }
});

module.exports = router;