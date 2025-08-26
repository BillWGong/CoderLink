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
function getTags() {
  return getDataManager().getData('tags');
}

function getContacts() {
  return getDataManager().getData('persons');
}

function getCompanies() {
  return getDataManager().getData('companies');
}

function getOrganizations() {
  return getDataManager().getData('organizations');
}

// 获取所有标签
async function getAllTags() {
  await ensureInitialized();
  return getTags();
}

// 根据ID获取标签
async function getTagById(id) {
  await ensureInitialized();
  return getTags().find(tag => tag._id === id);
}

// 创建新标签
async function createTag(tagData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const newTag = {
    _id: dataManager.generateId(),
    ...tagData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  dataManager.addItem('tags', newTag);
  await dataManager.scheduleSave('tags');
  return newTag;
}

// 更新标签
async function updateTag(id, updateData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const tag = getTags().find(tag => tag._id === id);
  if (!tag) {
    throw new Error('标签不存在');
  }
  
  const updatedTag = {
    ...tag,
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  dataManager.updateItem('tags', id, updatedTag);
  await dataManager.scheduleSave('tags');
  return updatedTag;
}

// 删除标签
async function deleteTag(id) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const tag = getTags().find(tag => tag._id === id);
  if (!tag) {
    throw new Error('标签不存在');
  }
  
  // 使用数据管理器的清理关联数据功能
  dataManager.cleanupRelatedData('tags', id);
  dataManager.deleteItem('tags', id);
  await dataManager.scheduleSave('tags');
  return tag;
}

// 标签模型
const Tag = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  ensureInitialized
};

module.exports = Tag;