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
function getCompanies() {
  return getDataManager().getData('companies');
}

function getContacts() {
  return getDataManager().getData('persons');
}

function getOrganizations() {
  return getDataManager().getData('organizations');
}

function getTags() {
  return getDataManager().getData('tags');
}

// 获取所有公司
async function getAllCompanies() {
  await ensureInitialized();
  return getCompanies();
}

// 根据ID获取公司
async function getCompanyById(id) {
  await ensureInitialized();
  return getCompanies().find(company => company.id === id);
}

// 创建新公司
async function createCompany(companyData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const newCompany = {
    id: dataManager.generateId(),
    ...companyData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  dataManager.addItem('companies', newCompany);
  await dataManager.saveData();
  return newCompany;
}

// 更新公司
async function updateCompany(id, updateData) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const company = getCompanies().find(company => company.id === id);
  if (!company) {
    throw new Error('公司不存在');
  }
  
  const updatedCompany = {
    ...company,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  dataManager.updateItem('companies', id, updatedCompany);
  await dataManager.saveData();
  return updatedCompany;
}

// 删除公司
async function deleteCompany(id) {
  await ensureInitialized();
  const dataManager = getDataManager();
  const company = getCompanies().find(company => company.id === id);
  if (!company) {
    throw new Error('公司不存在');
  }
  
  // 使用数据管理器的清理关联数据功能
  dataManager.cleanupRelatedData('companies', id);
  dataManager.deleteItem('companies', id);
  await dataManager.saveData();
  return company;
}

// 公司模型
const Company = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  ensureInitialized
};

module.exports = { Company };