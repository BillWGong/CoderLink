const path = require('path');

// 数据库配置
const dbConfig = {
  dataDir: path.join(__dirname, '../../data'),
  contactsFile: 'persons.json',
  companiesFile: 'companies.json',
  organizationsFile: 'organizations.json',
  tagsFile: 'tags.json'
};

module.exports = dbConfig;