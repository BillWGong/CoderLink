/**
 * 统一数据管理器 - 解决数据一致性问题
 * 单例模式，确保所有模型使用同一份数据
 */

const { loadDataFromFile, saveDataToFile } = require('../utils/dataStorage');
const EventEmitter = require('events');

class DataManager extends EventEmitter {
  constructor() {
    super();
    this.data = {
      persons: [],
      companies: [],
      organizations: [],
      tags: []
    };
    this.isLoaded = false;
    this.saveQueue = new Set();
    this.saveTimeout = null;
    // 数据版本控制
    this.dataVersion = Date.now();
    this.lastModified = new Date().toISOString();
  }

  /**
   * 初始化数据管理器
   */
  async initialize() {
    if (this.isLoaded) return;
    
    try {
      console.log('正在初始化数据管理器...');
      
      // 并行加载所有数据文件
      const [persons, companies, organizations, tags] = await Promise.all([
        this.loadSafeData('persons'),
        this.loadSafeData('companies'), 
        this.loadSafeData('organizations'),
        this.loadSafeData('tags')
      ]);
      
      this.data = { persons, companies, organizations, tags };
      this.isLoaded = true;
      
      console.log('数据管理器初始化完成:', {
        persons: persons.length,
        companies: companies.length,
        organizations: organizations.length,
        tags: tags.length
      });
      
      this.emit('initialized', this.data);
    } catch (error) {
      console.error('数据管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 安全加载数据，处理文件不存在的情况
   */
  async loadSafeData(type) {
    try {
      const data = await loadDataFromFile(type);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`加载${type}数据失败，使用空数组:`, error.message);
      return [];
    }
  }

  /**
   * 获取指定类型的数据
   */
  getData(type) {
    if (!this.isLoaded) {
      throw new Error('数据管理器尚未初始化，请先调用initialize()');
    }
    return this.data[type] || [];
  }

  /**
   * 获取所有数据
   */
  getAllData() {
    if (!this.isLoaded) {
      throw new Error('数据管理器尚未初始化，请先调用initialize()');
    }
    return { ...this.data };
  }

  /**
   * 更新数据版本
   */
  updateDataVersion() {
    this.dataVersion = Date.now();
    this.lastModified = new Date().toISOString();
  }

  /**
   * 获取数据版本信息
   */
  getVersionInfo() {
    return {
      version: this.dataVersion,
      lastModified: this.lastModified
    };
  }

  /**
   * 添加数据项
   */
  async addItem(type, item) {
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    
    // 生成ID（如果没有）
    if (!item._id) {
      item._id = this.generateId();
    }
    
    this.data[type].push(item);
    this.updateDataVersion();
    this.emit('itemAdded', { type, item });
    
    // 异步保存
    await this.scheduleSave(type);
    return item;
  }

  /**
   * 更新数据项
   */
  async updateItem(type, id, updates) {
    console.log(`[DEBUG] DataManager.updateItem - 类型: ${type}, ID: ${id}`);
    console.log(`[DEBUG] 更新数据:`, JSON.stringify(updates, null, 2));
    
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    
    const index = this.data[type].findIndex(item => item._id === id);
    if (index === -1) {
      throw new Error(`未找到ID为${id}的${type}`);
    }
    
    const oldItem = this.data[type][index];
    const newItem = { ...oldItem, ...updates, _id: id };
    this.data[type][index] = newItem;
    
    console.log(`[DEBUG] 数据更新成功 - 类型: ${type}, ID: ${id}`);
    console.log(`[DEBUG] 更新后的项目:`, JSON.stringify(newItem, null, 2));
    
    this.updateDataVersion();
    this.emit('itemUpdated', { type, id, oldItem, newItem });
    
    // 异步保存
    await this.scheduleSave(type);
    console.log(`[DEBUG] 保存操作已调度 - 类型: ${type}`);
    return newItem;
  }

  /**
   * 删除数据项
   */
  async deleteItem(type, id) {
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    
    const index = this.data[type].findIndex(item => item._id === id);
    if (index === -1) {
      throw new Error(`未找到ID为${id}的${type}`);
    }
    
    const deletedItem = this.data[type].splice(index, 1)[0];
    this.updateDataVersion();
    this.emit('itemDeleted', { type, id, deletedItem });
    
    // 处理关联数据清理
    await this.cleanupRelatedData(type, id);
    
    // 异步保存
    await this.scheduleSave(type);
    return deletedItem;
  }

  /**
   * 查找数据项
   */
  findItem(type, id) {
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    return this.data[type].find(item => item._id === id);
  }

  /**
   * 查找多个数据项
   */
  findItems(type, predicate) {
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    return this.data[type].filter(predicate);
  }

  /**
   * 清理关联数据
   */
  async cleanupRelatedData(deletedType, deletedId) {
    const cleanupTasks = [];
    
    if (deletedType === 'tags') {
      // 删除标签时，清理联系人中的标签引用
      this.data.persons.forEach(contact => {
        if (contact.tags) {
          contact.tags = contact.tags.filter(tag => 
            (typeof tag === 'object' ? tag._id : tag) !== deletedId
          );
        }
      });
      cleanupTasks.push(this.scheduleSave('persons'));
    }
    
    if (deletedType === 'companies') {
      // 删除公司时，清理联系人中的公司引用
      this.data.persons.forEach(contact => {
        if (contact.company === deletedId) {
          contact.company = null;
        }
      });
      cleanupTasks.push(this.scheduleSave('persons'));
    }
    
    if (deletedType === 'organizations') {
      // 删除组织时，清理相关引用
      this.data.persons.forEach(contact => {
        if (contact.organization === deletedId) {
          contact.organization = null;
        }
      });
      this.data.companies.forEach(company => {
        if (company.organization === deletedId) {
          company.organization = null;
        }
      });
      cleanupTasks.push(this.scheduleSave('persons'));
      cleanupTasks.push(this.scheduleSave('companies'));
    }
    
    await Promise.all(cleanupTasks);
  }

  /**
   * 计划保存操作（防抖）
   */
  async scheduleSave(type) {
    this.saveQueue.add(type);
    
    // 清除之前的定时器
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // 设置新的定时器，500ms后执行保存
    this.saveTimeout = setTimeout(async () => {
      await this.executeSave();
    }, 500);
  }

  /**
   * 执行保存操作
   */
  async executeSave() {
    const typesToSave = Array.from(this.saveQueue);
    this.saveQueue.clear();
    
    console.log(`[DEBUG] 开始执行保存操作 - 类型: [${typesToSave.join(', ')}]`);
    
    const savePromises = typesToSave.map(async (type) => {
      try {
        console.log(`[DEBUG] 正在保存 ${type} 数据到文件...`);
        await saveDataToFile(type, this.data[type]);
        console.log(`[DEBUG] ${type}数据保存成功`);
      } catch (error) {
        console.error(`[ERROR] 保存${type}数据失败:`, error);
        throw error;
      }
    });
    
    await Promise.all(savePromises);
    console.log(`[DEBUG] 所有数据保存完成 - 类型: [${typesToSave.join(', ')}]`);
    this.emit('dataSaved', typesToSave);
  }

  /**
   * 保存指定类型的数据（向后兼容）
   */
  async saveData(type) {
    if (!this.data[type]) {
      throw new Error(`未知的数据类型: ${type}`);
    }
    
    try {
      await saveDataToFile(type, this.data[type]);
      console.log(`${type}数据保存成功`);
    } catch (error) {
      console.error(`保存${type}数据失败:`, error);
      throw error;
    }
  }

  /**
   * 强制保存所有数据
   */
  async saveAll() {
    const savePromises = Object.keys(this.data).map(async (type) => {
      try {
        await saveDataToFile(type, this.data[type]);
        console.log(`${type}数据保存成功`);
      } catch (error) {
        console.error(`保存${type}数据失败:`, error);
        throw error;
      }
    });
    
    await Promise.all(savePromises);
    this.emit('allDataSaved');
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      persons: this.data.persons.length,
      companies: this.data.companies.length,
      organizations: this.data.organizations.length,
      tags: this.data.tags.length,
      isLoaded: this.isLoaded
    };
  }
}

// 单例实例
let instance = null;

module.exports = {
  getInstance() {
    if (!instance) {
      instance = new DataManager();
    }
    return instance;
  },
  DataManager
};