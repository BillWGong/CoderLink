const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/users.json');
    this.users = [];
  }

  async initialize() {
    try {
      await this.loadUsers();
      console.log('用户模型初始化完成');
    } catch (error) {
      console.error('用户模型初始化失败:', error);
      // 如果文件不存在，创建空的用户数组
      this.users = [];
      await this.saveUsers();
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      this.users = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，创建空数组
        this.users = [];
        await this.saveUsers();
      } else {
        throw error;
      }
    }
  }

  async saveUsers() {
    try {
      // 确保data目录存在
      const dataDir = path.dirname(this.dataPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.dataPath, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw error;
    }
  }

  // 根据GitHub ID查找用户
  async findByGithubId(githubId) {
    return this.users.find(user => user.github_id === githubId.toString());
  }

  // 根据用户ID查找用户
  async findById(id) {
    return this.users.find(user => user.id === id);
  }

  // 创建新用户
  async create(userData) {
    const user = {
      id: uuidv4(),
      github_id: userData.github_id.toString(),
      github_username: userData.github_username,
      email: userData.email,
      avatar_url: userData.avatar_url,
      name: userData.name,
      company: userData.company,
      location: userData.location,
      bio: userData.bio,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.users.push(user);
    await this.saveUsers();
    return user;
  }

  // 更新用户信息
  async update(id, updateData) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const user = this.users[userIndex];
    const updatedUser = {
      ...user,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    this.users[userIndex] = updatedUser;
    await this.saveUsers();
    return updatedUser;
  }

  // 删除用户
  async delete(id) {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    const deletedUser = this.users.splice(userIndex, 1)[0];
    await this.saveUsers();
    return deletedUser;
  }

  // 获取所有用户
  async findAll() {
    return this.users;
  }

  // 根据角色查找用户
  async findByRole(role) {
    return this.users.filter(user => user.role === role);
  }

  // 更新用户的GitHub信息
  async updateGithubInfo(githubId, githubData) {
    const user = await this.findByGithubId(githubId);
    if (!user) {
      throw new Error('用户不存在');
    }

    return await this.update(user.id, {
      github_username: githubData.login,
      email: githubData.email,
      avatar_url: githubData.avatar_url,
      name: githubData.name,
      company: githubData.company,
      location: githubData.location,
      bio: githubData.bio
    });
  }
}

// 单例模式
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new UserModel();
  }
  return instance;
}

module.exports = { UserModel, getInstance };