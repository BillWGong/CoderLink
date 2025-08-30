const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ContactOwnershipModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/contact_ownership.json');
    this.ownerships = [];
  }

  async initialize() {
    try {
      await this.loadOwnerships();
      console.log('联系人所有权模型初始化完成');
    } catch (error) {
      console.error('联系人所有权模型初始化失败:', error);
      this.ownerships = [];
      await this.saveOwnerships();
    }
  }

  async loadOwnerships() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      this.ownerships = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.ownerships = [];
        await this.saveOwnerships();
      } else {
        throw error;
      }
    }
  }

  async saveOwnerships() {
    try {
      const dataDir = path.dirname(this.dataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.dataPath, JSON.stringify(this.ownerships, null, 2));
    } catch (error) {
      console.error('保存联系人所有权数据失败:', error);
      throw error;
    }
  }

  // 创建所有权关系
  async create(ownershipData) {
    // 检查是否已存在相同的所有权关系
    const existing = await this.findByContactAndUser(ownershipData.contact_id, ownershipData.user_id);
    if (existing) {
      throw new Error('该用户已拥有此联系人的所有权');
    }

    const ownership = {
      id: uuidv4(),
      contact_id: ownershipData.contact_id,
      user_id: ownershipData.user_id,
      claimed_at: new Date().toISOString()
    };

    this.ownerships.push(ownership);
    await this.saveOwnerships();
    return ownership;
  }

  // 根据联系人ID和用户ID查找所有权
  async findByContactAndUser(contactId, userId) {
    return this.ownerships.find(ownership => 
      ownership.contact_id === contactId && ownership.user_id === userId
    );
  }

  // 根据联系人ID查找所有者
  async findOwnersByContactId(contactId) {
    return this.ownerships.filter(ownership => ownership.contact_id === contactId);
  }

  // 根据用户ID查找拥有的联系人
  async findContactsByUserId(userId) {
    return this.ownerships.filter(ownership => ownership.user_id === userId);
  }

  // 检查用户是否拥有联系人
  async hasOwnership(contactId, userId) {
    const ownership = await this.findByContactAndUser(contactId, userId);
    return !!ownership;
  }

  // 检查联系人是否已被认领
  async isContactClaimed(contactId) {
    const owners = await this.findOwnersByContactId(contactId);
    return owners.length > 0;
  }

  // 获取未被认领的联系人ID列表
  async getUnclaimedContactIds(allContactIds) {
    const claimedContactIds = new Set(
      this.ownerships.map(ownership => ownership.contact_id)
    );
    
    return allContactIds.filter(contactId => !claimedContactIds.has(contactId));
  }

  // 删除所有权关系
  async delete(contactId, userId) {
    const ownershipIndex = this.ownerships.findIndex(ownership => 
      ownership.contact_id === contactId && ownership.user_id === userId
    );
    
    if (ownershipIndex === -1) {
      throw new Error('所有权关系不存在');
    }

    const deletedOwnership = this.ownerships.splice(ownershipIndex, 1)[0];
    await this.saveOwnerships();
    return deletedOwnership;
  }

  // 根据ID删除所有权关系
  async deleteById(id) {
    const ownershipIndex = this.ownerships.findIndex(ownership => ownership.id === id);
    
    if (ownershipIndex === -1) {
      throw new Error('所有权关系不存在');
    }

    const deletedOwnership = this.ownerships.splice(ownershipIndex, 1)[0];
    await this.saveOwnerships();
    return deletedOwnership;
  }

  // 转移所有权（从一个用户转移到另一个用户）
  async transfer(contactId, fromUserId, toUserId) {
    const ownership = await this.findByContactAndUser(contactId, fromUserId);
    if (!ownership) {
      throw new Error('原所有权关系不存在');
    }

    // 检查目标用户是否已拥有该联系人
    const existingOwnership = await this.findByContactAndUser(contactId, toUserId);
    if (existingOwnership) {
      throw new Error('目标用户已拥有此联系人的所有权');
    }

    // 删除原所有权
    await this.delete(contactId, fromUserId);
    
    // 创建新所有权
    return await this.create({
      contact_id: contactId,
      user_id: toUserId
    });
  }

  // 获取所有所有权关系
  async findAll() {
    return this.ownerships;
  }

  // 批量创建所有权关系
  async createBatch(ownershipDataArray) {
    const createdOwnerships = [];
    
    for (const ownershipData of ownershipDataArray) {
      try {
        const ownership = await this.create(ownershipData);
        createdOwnerships.push(ownership);
      } catch (error) {
        console.warn(`创建所有权关系失败: ${error.message}`, ownershipData);
      }
    }
    
    return createdOwnerships;
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new ContactOwnershipModel();
  }
  return instance;
}

module.exports = { ContactOwnershipModel, getInstance };