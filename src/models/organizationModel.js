const { getInstance } = require('../services/dataManager');

// 获取数据管理器实例的函数
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

// 获取数据的辅助函数
function getOrganizations() {
  return getDataManager().getData('organizations');
}

function getContacts() {
  return getDataManager().getData('persons');
}

function getCompanies() {
  return getDataManager().getData('companies');
}

function getTags() {
  return getDataManager().getData('tags');
}

// 获取所有组织
async function getAllOrganizations() {
  await ensureInitialized();
  return getOrganizations();
}

// 根据ID获取组织
async function getOrganizationById(id) {
  await ensureInitialized();
  return getOrganizations().find(org => org.id === id);
}

// 创建新组织
async function createOrganization(orgData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const newOrganization = {
    id: dataManager.generateId(),
    ...orgData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  dataManager.addItem('organizations', newOrganization);
  await dataManager.saveData();
  return newOrganization;
}

// 更新组织
async function updateOrganization(id, updateData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const organization = getOrganizations().find(org => org.id === id);
  if (!organization) {
    throw new Error('组织不存在');
  }
  
  const updatedOrganization = {
    ...organization,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  dataManager.updateItem('organizations', id, updatedOrganization);
  await dataManager.saveData();
  return updatedOrganization;
}

// 删除组织
async function deleteOrganization(id) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const organization = getOrganizations().find(org => org.id === id);
  if (!organization) {
    throw new Error('组织不存在');
  }
  
  // 使用数据管理器的清理关联数据功能
  dataManager.cleanupRelatedData('organizations', id);
  dataManager.deleteItem('organizations', id);
  await dataManager.saveData();
  return organization;
}

// 组织模型
const Organization = {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  ensureInitialized
};

module.exports = { Organization };