const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbConfig = require('../config/database');

const DATA_DIR = dbConfig.dataDir;
const COMPANIES_FILE = path.join(DATA_DIR, dbConfig.companiesFile);
const CONTACTS_FILE = path.join(DATA_DIR, dbConfig.contactsFile);
const ORGANIZATIONS_FILE = path.join(DATA_DIR, dbConfig.organizationsFile);

// 确保数据目录存在
function ensureDataDirSync() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('数据目录已创建');
  }
}

// 生成随机名称
function generateRandomName() {
  const firstNames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
  const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平'];
  
  return firstNames[Math.floor(Math.random() * firstNames.length)] + lastNames[Math.floor(Math.random() * lastNames.length)];
}

// 生成随机公司名称
function generateRandomCompanyName() {
  const prefixes = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安'];
  const middleParts = ['科技', '网络', '电子', '信息', '通信', '软件', '金融', '教育', '医疗', '能源'];
  const suffixes = ['有限公司', '股份有限公司', '集团', '科技有限公司', '信息技术有限公司'];
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + 
         middleParts[Math.floor(Math.random() * middleParts.length)] + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

// 生成随机组织名称
function generateRandomOrganizationName() {
  const prefixes = ['中国', '国际', '亚洲', '欧洲', '美洲', '全球', '地区', '城市', '省级', '国家'];
  const middleParts = ['教育', '医疗', '环保', '文化', '艺术', '科学', '体育', '音乐', '舞蹈', '戏剧'];
  const suffixes = ['协会', '学会', '联盟', '组织', '基金会', '研究所', '中心', '俱乐部', '社团', '委员会'];
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + 
         middleParts[Math.floor(Math.random() * middleParts.length)] + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

// 生成随机电话号码
function generateRandomPhoneNumber() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
  let number = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  
  return number;
}

// 生成随机电子邮箱
function generateRandomEmail(name) {
  const domains = ['gmail.com', '163.com', 'qq.com', '126.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'sina.com', 'sohu.com', 'foxmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  // 使用拼音模拟名字转换，这里简化处理
  const randomString = Math.random().toString(36).substring(2, 10);
  
  return `${randomString}@${domain}`;
}

// 生成测试数据
function generateData() {
  ensureDataDirSync();
  
  // 生成组织数据
  const organizations = [];
  const orgCount = 5 + Math.floor(Math.random() * 10); // 5-15个组织
  
  for (let i = 0; i < orgCount; i++) {
    organizations.push({
      _id: uuidv4(),
      name: generateRandomOrganizationName(),
      description: `这是一个${['小型', '中型', '大型'][Math.floor(Math.random() * 3)]}组织`,
      createdAt: new Date().toISOString()
    });
  }
  
  // 生成公司数据
  const companies = [];
  const companyCount = 20 + Math.floor(Math.random() * 30); // 20-50家公司
  
  for (let i = 0; i < companyCount; i++) {
    // 决定公司属于的组织数量
    const orgCount = Math.random() > 0.7 ? 0 : (1 + Math.floor(Math.random() * 2)); // 70%不属于组织，30%属于1-3个组织
    const companyOrgs = [];
    
    // 随机选择组织
    if (orgCount > 0 && organizations.length > 0) {
      // 创建一个可用组织的副本以避免重复
      const availableOrgs = [...organizations];
      
      for (let j = 0; j < Math.min(orgCount, availableOrgs.length); j++) {
        const randomIndex = Math.floor(Math.random() * availableOrgs.length);
        const selectedOrg = availableOrgs.splice(randomIndex, 1)[0];
        
        companyOrgs.push({
          _id: selectedOrg._id,
          name: selectedOrg.name
        });
      }
    }
    
    companies.push({
      _id: uuidv4(),
      name: generateRandomCompanyName(),
      description: `这是一家${['小型', '中型', '大型'][Math.floor(Math.random() * 3)]}公司`,
      organizations: companyOrgs,
      createdAt: new Date().toISOString()
    });
  }
  
  // 生成联系人数据
  const contacts = [];
  const contactCount = 100 + Math.floor(Math.random() * 150); // 100-250个联系人
  
  for (let i = 0; i < contactCount; i++) {
    const name = generateRandomName();
    
    // 决定联系人属于的公司数量
    const companyCount = Math.random() > 0.3 ? (1 + Math.floor(Math.random() * 2)) : 0; // 70%属于1-3家公司
    const contactCompanies = [];
    
    // 随机选择公司
    if (companyCount > 0 && companies.length > 0) {
      // 创建一个可用公司的副本以避免重复
      const availableCompanies = [...companies];
      
      for (let j = 0; j < Math.min(companyCount, availableCompanies.length); j++) {
        const randomIndex = Math.floor(Math.random() * availableCompanies.length);
        const selectedCompany = availableCompanies.splice(randomIndex, 1)[0];
        
        contactCompanies.push({
          _id: selectedCompany._id,
          name: selectedCompany.name
        });
      }
    }
    
    // 决定联系人属于的组织数量
    const orgCount = Math.random() > 0.5 ? (1 + Math.floor(Math.random() * 2)) : 0; // 50%属于1-3个组织
    const contactOrgs = [];
    
    // 随机选择组织
    if (orgCount > 0 && organizations.length > 0) {
      // 创建一个可用组织的副本以避免重复
      const availableOrgs = [...organizations];
      
      for (let j = 0; j < Math.min(orgCount, availableOrgs.length); j++) {
        const randomIndex = Math.floor(Math.random() * availableOrgs.length);
        const selectedOrg = availableOrgs.splice(randomIndex, 1)[0];
        
        contactOrgs.push({
          _id: selectedOrg._id,
          name: selectedOrg.name
        });
      }
    }
    
    contacts.push({
      _id: uuidv4(),
      name: name,
      profile: `${name}是一位${['资深', '经验丰富的', '年轻的', '有才华的', '专业的'][Math.floor(Math.random() * 5)]}${['工程师', '管理人员', '销售人员', '研究员', '顾问', '专家', '设计师', '教师', '医生', '律师'][Math.floor(Math.random() * 10)]}`,
      companies: contactCompanies,
      organizations: contactOrgs,
      phone: generateRandomPhoneNumber(),
      email: generateRandomEmail(name),
      wechat: `wx_${Math.random().toString(36).substring(2, 10)}`,
      avatar: 'icon/common.png',
      createdAt: new Date().toISOString()
    });
  }
  
  // 写入数据文件
  fs.writeFileSync(ORGANIZATIONS_FILE, JSON.stringify(organizations, null, 2));
  console.log(`已生成${organizations.length}个组织数据`);
  
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
  console.log(`已生成${companies.length}家公司数据`);
  
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
  console.log(`已生成${contacts.length}位联系人数据`);
  
  return { organizations, companies, contacts };
}

// 如果直接运行此文件
if (require.main === module) {
  console.log('开始生成测试数据...');
  generateData();
  console.log('测试数据生成完成！');
}

module.exports = { generateData }; 