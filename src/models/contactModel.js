const { v4: uuidv4 } = require('uuid');
const { getInstance } = require('../services/dataManager');

// 获取数据管理器实例
function getDataManager() {
  return getInstance();
}

// 确保数据管理器已初始化
async function ensureInitialized() {
  const dataManager = getDataManager();
  if (!dataManager.isLoaded) {
    await dataManager.initialize();
  }
}

// 获取联系人数据的辅助函数
function getContacts() {
  return getDataManager().getData('persons');
}

function getCompanies() {
  return getDataManager().getData('companies');
}

function getOrganizations() {
  return getDataManager().getData('organizations');
}

function getTags() {
  return getDataManager().getData('tags');
}

// 获取所有联系人
async function getAllContacts() {
  await ensureInitialized();
  return getContacts();
}

// 根据ID获取联系人
async function getContactById(id) {
  await ensureInitialized();
  return getContacts().find(contact => contact._id === id);
}

// 创建新联系人
async function createContact(contactData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const newContact = {
    _id: dataManager.generateId(),
    ...contactData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await dataManager.addItem('persons', newContact);
  return newContact;
}

// 更新联系人
async function updateContact(id, updateData) {
  await ensureInitialized();
  const contact = getContacts().find(contact => contact._id === id);
  if (!contact) {
    throw new Error('联系人不存在');
  }
  
  const updates = {
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  const dataManager = getDataManager();
  return await dataManager.updateItem('persons', id, updates);
}

// 删除联系人
async function deleteContact(id) {
  await ensureInitialized();
  const contact = getContacts().find(contact => contact._id === id);
  if (!contact) {
    throw new Error('联系人不存在');
  }
  
  const dataManager = getDataManager();
  return await dataManager.deleteItem('persons', id);
}

// 联系人模型
const Contact = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  // 兼容性方法
  ensureInitialized
};

module.exports = Contact;