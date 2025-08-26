const fs = require('fs');
const path = require('path');

// 读取tags.json文件
const tagsFilePath = path.join(__dirname, 'data', 'tags.json');
const tagsData = JSON.parse(fs.readFileSync(tagsFilePath, 'utf8'));

console.log('开始修复标签parent-child关系...');

// 创建一个映射来快速查找标签
const tagMap = new Map();
tagsData.forEach(tag => {
  tagMap.set(tag._id, tag);
});

// 修复parent-child关系
let fixedCount = 0;

tagsData.forEach(tag => {
  // 检查每个标签的parent_tags
  if (tag.parent_tags && tag.parent_tags.length > 0) {
    tag.parent_tags.forEach(parentTag => {
      const parentTagData = tagMap.get(parentTag._id);
      if (parentTagData) {
        // 检查父标签的child_tags中是否包含当前标签
        const hasChild = parentTagData.child_tags.some(child => child._id === tag._id);
        if (!hasChild) {
          // 添加到父标签的child_tags中
          parentTagData.child_tags.push({
            _id: tag._id,
            name: tag.name
          });
          
          // 更新父标签的connection_count
          parentTagData.connection_count = parentTagData.child_tags.length + parentTagData.connections.length;
          
          console.log(`修复: 将"${tag.name}"添加到"${parentTagData.name}"的child_tags中`);
          fixedCount++;
        }
      }
    });
  }
  
  // 检查每个标签的child_tags
  if (tag.child_tags && tag.child_tags.length > 0) {
    tag.child_tags.forEach(childTag => {
      const childTagData = tagMap.get(childTag._id);
      if (childTagData) {
        // 检查子标签的parent_tags中是否包含当前标签
        const hasParent = childTagData.parent_tags.some(parent => parent._id === tag._id);
        if (!hasParent) {
          // 添加到子标签的parent_tags中
          childTagData.parent_tags.push({
            _id: tag._id,
            name: tag.name
          });
          
          console.log(`修复: 将"${tag.name}"添加到"${childTagData.name}"的parent_tags中`);
          fixedCount++;
        }
      }
    });
  }
});

// 重新计算所有标签的connection_count
tagsData.forEach(tag => {
  const totalConnections = (tag.connections ? tag.connections.length : 0) + 
                          (tag.child_tags ? tag.child_tags.length : 0) + 
                          (tag.parent_tags ? tag.parent_tags.length : 0);
  
  if (tag.connection_count !== totalConnections) {
    console.log(`更新"${tag.name}"的connection_count: ${tag.connection_count} -> ${totalConnections}`);
    tag.connection_count = totalConnections;
    fixedCount++;
  }
});

// 保存修复后的数据
if (fixedCount > 0) {
  // 创建备份
  const backupPath = path.join(__dirname, 'data', `tags_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, fs.readFileSync(tagsFilePath, 'utf8'));
  console.log(`创建备份文件: ${backupPath}`);
  
  // 保存修复后的数据
  fs.writeFileSync(tagsFilePath, JSON.stringify(tagsData, null, 2));
  console.log(`修复完成! 共修复了 ${fixedCount} 个问题`);
  
  // 显示"奇绩创坛"标签的修复结果
  const qijiTag = tagsData.find(tag => tag.name === '奇绩创坛');
  if (qijiTag) {
    console.log('\n"奇绩创坛"标签修复结果:');
    console.log(`- connection_count: ${qijiTag.connection_count}`);
    console.log(`- child_tags: ${qijiTag.child_tags.map(child => child.name).join(', ')}`);
    console.log(`- parent_tags: ${qijiTag.parent_tags.map(parent => parent.name).join(', ')}`);
  }
} else {
  console.log('没有发现需要修复的问题');
}

console.log('标签关系修复完成!');