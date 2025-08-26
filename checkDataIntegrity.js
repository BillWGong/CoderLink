const fs = require('fs');
const path = require('path');

// 读取并统计JSON文件记录数量
function countRecords(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    return Array.isArray(jsonData) ? jsonData.length : 0;
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error.message);
    return 0;
  }
}

// 检查数据完整性
function checkDataIntegrity() {
  console.log('=== 数据完整性检查 ===\n');
  
  const dataFiles = [
    { name: '联系人', path: './data/contacts.json' },
    { name: '公司', path: './data/companies.json' },
    { name: '组织', path: './data/organizations.json' },
    { name: '标签', path: './data/tags.json' }
  ];
  
  dataFiles.forEach(file => {
    const count = countRecords(file.path);
    console.log(`${file.name}数量: ${count}`);
  });
  
  console.log('\n=== 检查新添加的联系人标签关联 ===\n');
  
  try {
    const contacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8'));
    const newContacts = contacts.filter(contact => 
      contact.tags && contact.tags.some(tag => tag.name === 'TRAE-SOLO-Hackathon')
    );
    
    console.log(`关联TRAE-SOLO-Hackathon标签的联系人数量: ${newContacts.length}`);
    
    // 检查前5个新联系人的标签
    console.log('\n前5个新联系人的标签关联情况:');
    newContacts.slice(0, 5).forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name}:`);
      contact.tags.forEach(tag => {
        console.log(`   - ${tag.name}`);
      });
    });
    
  } catch (error) {
    console.error('检查联系人标签关联失败:', error.message);
  }
  
  console.log('\n=== 数据格式验证 ===\n');
  
  // 验证数据格式
  try {
    const contacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8'));
    const companies = JSON.parse(fs.readFileSync('./data/companies.json', 'utf8'));
    const organizations = JSON.parse(fs.readFileSync('./data/organizations.json', 'utf8'));
    const tags = JSON.parse(fs.readFileSync('./data/tags.json', 'utf8'));
    
    console.log('✓ 所有JSON文件格式正确');
    
    // 检查必要字段
    const contactFields = ['_id', 'name', 'profile', 'phone', 'email', 'wechat'];
    const companyFields = ['_id', 'name', 'description'];
    const orgFields = ['_id', 'name', 'description'];
    const tagFields = ['_id', 'name'];
    
    let isValid = true;
    
    // 检查联系人字段
    if (contacts.length > 0) {
      const sampleContact = contacts[0];
      contactFields.forEach(field => {
        if (!sampleContact.hasOwnProperty(field)) {
          console.log(`✗ 联系人缺少字段: ${field}`);
          isValid = false;
        }
      });
    }
    
    // 检查公司字段
    if (companies.length > 0) {
      const sampleCompany = companies[0];
      companyFields.forEach(field => {
        if (!sampleCompany.hasOwnProperty(field)) {
          console.log(`✗ 公司缺少字段: ${field}`);
          isValid = false;
        }
      });
    }
    
    // 检查组织字段
    if (organizations.length > 0) {
      const sampleOrg = organizations[0];
      orgFields.forEach(field => {
        if (!sampleOrg.hasOwnProperty(field)) {
          console.log(`✗ 组织缺少字段: ${field}`);
          isValid = false;
        }
      });
    }
    
    // 检查标签字段
    if (tags.length > 0) {
      const sampleTag = tags[0];
      tagFields.forEach(field => {
        if (!sampleTag.hasOwnProperty(field)) {
          console.log(`✗ 标签缺少字段: ${field}`);
          isValid = false;
        }
      });
    }
    
    if (isValid) {
      console.log('✓ 所有数据字段完整');
    }
    
  } catch (error) {
    console.error('✗ 数据格式验证失败:', error.message);
  }
  
  console.log('\n=== 检查完成 ===');
}

// 运行检查
if (require.main === module) {
  checkDataIntegrity();
}

module.exports = { checkDataIntegrity };