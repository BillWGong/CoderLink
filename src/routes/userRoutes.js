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

// 获取用户档案
router.get('/profile', authMiddleware.requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 获取用户拥有的联系人
    const ownedContacts = await contactOwnership.findContactsByUserId(req.user.id);
    
    // 获取用户的认领申请
    const claimRequests = await claimRequestModel.findByUserId(req.user.id);

    const userProfile = {
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
      updated_at: user.updated_at,
      stats: {
        owned_contacts: ownedContacts.length,
        pending_claims: claimRequests.filter(req => req.status === 'pending').length,
        approved_claims: claimRequests.filter(req => req.status === 'approved').length,
        rejected_claims: claimRequests.filter(req => req.status === 'rejected').length
      }
    };

    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('获取用户档案错误:', error);
    res.status(500).json({ 
      error: '获取用户档案失败',
      code: 'GET_PROFILE_FAILED'
    });
  }
});

// 获取用户拥有的联系人
router.get('/contacts', authMiddleware.requireAuth, async (req, res) => {
  try {
    const ownerships = await contactOwnership.findContactsByUserId(req.user.id);
    const contactIds = ownerships.map(ownership => ownership.contact_id);
    
    // 这里需要从联系人模型获取完整的联系人信息
    // 暂时返回联系人ID列表
    res.json({
      success: true,
      contacts: contactIds,
      count: contactIds.length
    });
  } catch (error) {
    console.error('获取用户联系人错误:', error);
    res.status(500).json({ 
      error: '获取联系人列表失败',
      code: 'GET_CONTACTS_FAILED'
    });
  }
});

// 获取用户的认领申请历史
router.get('/claims', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let claimRequests = await claimRequestModel.findByUserId(req.user.id);
    
    // 按状态过滤
    if (status) {
      claimRequests = claimRequests.filter(request => request.status === status);
    }
    
    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRequests = claimRequests.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      claims: paginatedRequests,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: claimRequests.length,
        total_pages: Math.ceil(claimRequests.length / limit)
      }
    });
  } catch (error) {
    console.error('获取认领申请历史错误:', error);
    res.status(500).json({ 
      error: '获取认领申请历史失败',
      code: 'GET_CLAIMS_FAILED'
    });
  }
});

// 提交认领申请
router.post('/claims', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { contact_id, reason } = req.body;
    
    if (!contact_id) {
      return res.status(400).json({ 
        error: '缺少联系人ID',
        code: 'MISSING_CONTACT_ID'
      });
    }

    // 检查是否已经申请过
    const existingClaim = await claimRequestModel.hasUserClaimedContact(req.user.id, contact_id);
    if (existingClaim) {
      return res.status(400).json({ 
        error: '您已经申请过此联系人',
        code: 'ALREADY_CLAIMED'
      });
    }

    // 检查联系人是否已被认领
    const isAlreadyClaimed = await contactOwnership.isContactClaimed(contact_id);
    if (isAlreadyClaimed) {
      return res.status(400).json({ 
        error: '此联系人已被其他用户认领',
        code: 'CONTACT_ALREADY_CLAIMED'
      });
    }

    // 创建认领申请
    const claimRequest = await claimRequestModel.create({
      user_id: req.user.id,
      contact_id,
      reason: reason || ''
    });

    res.status(201).json({
      success: true,
      claim: claimRequest,
      message: '认领申请提交成功，等待管理员审核'
    });
  } catch (error) {
    console.error('提交认领申请错误:', error);
    res.status(500).json({ 
      error: '提交认领申请失败',
      code: 'SUBMIT_CLAIM_FAILED'
    });
  }
});

// 撤销认领申请
router.delete('/claims/:claimId', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { claimId } = req.params;
    
    const claimRequest = await claimRequestModel.findById(claimId);
    if (!claimRequest) {
      return res.status(404).json({ 
        error: '认领申请不存在',
        code: 'CLAIM_NOT_FOUND'
      });
    }

    // 检查是否是用户自己的申请
    if (claimRequest.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: '您只能撤销自己的申请',
        code: 'NOT_YOUR_CLAIM'
      });
    }

    // 只能撤销待审核的申请
    if (claimRequest.status !== 'pending') {
      return res.status(400).json({ 
        error: '只能撤销待审核的申请',
        code: 'CANNOT_REVOKE_PROCESSED_CLAIM'
      });
    }

    await claimRequestModel.delete(claimId);
    
    res.json({
      success: true,
      message: '认领申请已撤销'
    });
  } catch (error) {
    console.error('撤销认领申请错误:', error);
    res.status(500).json({ 
      error: '撤销认领申请失败',
      code: 'REVOKE_CLAIM_FAILED'
    });
  }
});

// 获取可认领的联系人列表
router.get('/available-contacts', authMiddleware.requireAuth, async (req, res) => {
  try {
    // 这里需要从联系人模型获取所有联系人，然后过滤出未被认领的
    // 暂时返回空列表，需要与联系人模型集成
    const availableContacts = [];
    
    res.json({
      success: true,
      contacts: availableContacts,
      count: availableContacts.length
    });
  } catch (error) {
    console.error('获取可认领联系人错误:', error);
    res.status(500).json({ 
      error: '获取可认领联系人失败',
      code: 'GET_AVAILABLE_CONTACTS_FAILED'
    });
  }
});

// 获取用户统计信息
router.get('/stats', authMiddleware.requireAuth, async (req, res) => {
  try {
    const ownerships = await contactOwnership.findContactsByUserId(req.user.id);
    const claimRequests = await claimRequestModel.findByUserId(req.user.id);
    
    const stats = {
      owned_contacts: ownerships.length,
      total_claims: claimRequests.length,
      pending_claims: claimRequests.filter(req => req.status === 'pending').length,
      approved_claims: claimRequests.filter(req => req.status === 'approved').length,
      rejected_claims: claimRequests.filter(req => req.status === 'rejected').length,
      claim_success_rate: claimRequests.length > 0 ? 
        (claimRequests.filter(req => req.status === 'approved').length / claimRequests.length * 100).toFixed(1) : 0
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

// 更新用户设置
router.put('/settings', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { notifications, privacy, preferences } = req.body;
    
    // 这里可以扩展用户设置功能
    // 目前只是返回成功消息
    res.json({
      success: true,
      message: '设置更新成功',
      settings: {
        notifications: notifications || {},
        privacy: privacy || {},
        preferences: preferences || {}
      }
    });
  } catch (error) {
    console.error('更新用户设置错误:', error);
    res.status(500).json({ 
      error: '更新设置失败',
      code: 'UPDATE_SETTINGS_FAILED'
    });
  }
});

module.exports = router;