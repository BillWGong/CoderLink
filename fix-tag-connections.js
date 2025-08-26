const fs = require('fs');
const path = require('path');

// 读取tags.json文件
const tagsPath = path.join(__dirname, 'data', 'tags.json');
const tags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));

console.log('开始修复标签连接统计...');

// 修复每个标签的连接统计
tags.forEach(tag => {
  const originalConnectionCount = tag.connection_count;
  const originalConnections = [...tag.connections];
  
  // 重新计算connections数组，包含所有类型的连接
  const allConnections = new Set();
  
  // 添加现有的连接（联系人连接）
  tag.connections.forEach(id => allConnections.add(id));
  
  // 添加parent_tags中的标签ID
  tag.parent_tags.forEach(parentTag => {
    allConnections.add(parentTag._id);
  });
  
  // 添加child_tags中的标签ID
  tag.child_tags.forEach(childTag => {
    allConnections.add(childTag._id);
  });
  
  // 更新connections数组和connection_count
  tag.connections = Array.from(allConnections);
  tag.connection_count = tag.connections.length;
  
  // 输出修复信息
  if (originalConnectionCount !== tag.connection_count) {
    console.log(`修复标签 "${tag.name}":`);
    console.log(`  原连接数: ${originalConnectionCount} -> 新连接数: ${tag.connection_count}`);
    console.log(`  原connections: [${originalConnections.join(', ')}]`);
    console.log(`  新connections: [${tag.connections.join(', ')}]`);
    console.log('');
  }
});

// 创建备份
const backupPath = path.join(__dirname, 'data', `tags_backup_${Date.now()}.json`);
fs.writeFileSync(backupPath, fs.readFileSync(tagsPath, 'utf8'));
console.log(`已创建备份文件: ${backupPath}`);

// 写入修复后的数据
fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2));
console.log('标签连接统计修复完成！');

// 验证修复结果
console.log('\n验证修复结果:');
const qijiTag = tags.find(tag => tag.name === '奇绩创坛');
if (qijiTag) {
  console.log(`"奇绩创坛" 标签:`);
  console.log(`  连接数: ${qijiTag.connection_count}`);
  console.log(`  连接列表: [${qijiTag.connections.join(', ')}]`);
  console.log(`  子标签: [${qijiTag.child_tags.map(t => t.name).join(', ')}]`);
}

const shangliTag = tags.find(tag => tag.name === '熵增力场');
if (shangliTag) {
  console.log(`"熵增力场" 标签:`);
  console.log(`  连接数: ${shangliTag.connection_count}`);
  console.log(`  连接列表: [${shangliTag.connections.join(', ')}]`);
  console.log(`  父标签: [${shangliTag.parent_tags.map(t => t.name).join(', ')}]`);
}