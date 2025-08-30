const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ClaimRequestModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/claim_requests.json');
    this.claimRequests = [];
  }

  async initialize() {
    try {
      await this.loadClaimRequests();
      console.log('认领申请模型初始化完成');
    } catch (error) {
      console.error('认领申请模型初始化失败:', error);
      this.claimRequests = [];
      await this.saveClaimRequests();
    }
  }

  async loadClaimRequests() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      this.claimRequests = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.claimRequests = [];
        await this.saveClaimRequests();
      } else {
        throw error;
      }
    }
  }

  async saveClaimRequests() {
    try {
      const dataDir = path.dirname(this.dataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.dataPath, JSON.stringify(this.claimRequests, null, 2));
    } catch (error) {
      console.error('保存认领申请数据失败:', error);
      throw error;
    }
  }

  // 创建认领申请
  async create(requestData) {
    const claimRequest = {
      id: uuidv4(),
      user_id: requestData.user_id,
      contact_id: requestData.contact_id,
      reason: requestData.reason || '',
      status: 'pending',
      admin_id: null,
      admin_comment: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.claimRequests.push(claimRequest);
    await this.saveClaimRequests();
    return claimRequest;
  }

  // 根据ID查找认领申请
  async findById(id) {
    return this.claimRequests.find(request => request.id === id);
  }

  // 根据用户ID查找认领申请
  async findByUserId(userId) {
    return this.claimRequests.filter(request => request.user_id === userId);
  }

  // 根据联系人ID查找认领申请
  async findByContactId(contactId) {
    return this.claimRequests.filter(request => request.contact_id === contactId);
  }

  // 根据状态查找认领申请
  async findByStatus(status) {
    return this.claimRequests.filter(request => request.status === status);
  }

  // 获取待审核的申请
  async getPendingRequests() {
    return this.claimRequests.filter(request => request.status === 'pending');
  }

  // 更新认领申请状态
  async updateStatus(id, status, adminId, adminComment = null) {
    const requestIndex = this.claimRequests.findIndex(request => request.id === id);
    if (requestIndex === -1) {
      throw new Error('认领申请不存在');
    }

    const request = this.claimRequests[requestIndex];
    const updatedRequest = {
      ...request,
      status,
      admin_id: adminId,
      admin_comment: adminComment,
      updated_at: new Date().toISOString()
    };

    this.claimRequests[requestIndex] = updatedRequest;
    await this.saveClaimRequests();
    return updatedRequest;
  }

  // 检查用户是否已经申请过某个联系人
  async hasUserClaimedContact(userId, contactId) {
    return this.claimRequests.some(request => 
      request.user_id === userId && 
      request.contact_id === contactId && 
      (request.status === 'pending' || request.status === 'approved')
    );
  }

  // 获取所有认领申请
  async findAll() {
    return this.claimRequests;
  }

  // 删除认领申请
  async delete(id) {
    const requestIndex = this.claimRequests.findIndex(request => request.id === id);
    if (requestIndex === -1) {
      throw new Error('认领申请不存在');
    }

    const deletedRequest = this.claimRequests.splice(requestIndex, 1)[0];
    await this.saveClaimRequests();
    return deletedRequest;
  }

  // 批准认领申请
  async approve(id, adminId, adminComment = null) {
    return await this.updateStatus(id, 'approved', adminId, adminComment);
  }

  // 拒绝认领申请
  async reject(id, adminId, adminComment = null) {
    return await this.updateStatus(id, 'rejected', adminId, adminComment);
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ClaimRequestModel();
  }
  return instance;
}

module.exports = { ClaimRequestModel, getInstance };