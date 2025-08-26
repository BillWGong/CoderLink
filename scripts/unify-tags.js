const fs = require('fs');
const path = require('path');

// 读取tags.json文件
const tagsPath = path.join(__dirname, '..', 'data', 'tags.json');
const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));

console.log('开始统一标签类型...');
console.log(`总共有 ${tagsData.length} 个标签`);

// 统计原有类型分布
const typeCount = {};
tagsData.forEach(tag => {
  const type = tag.type || 'unknown';
  typeCount[type] = (typeCount[type] || 0) + 1;
});

console.log('原有类型分布:', typeCount);

// 定义颜色池，确保颜色多样性
const colorPool = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#06B6D4', // 青色
  '#F97316', // 深橙色
  '#84CC16', // 青绿色
  '#EC4899', // 粉色
  '#6366F1'  // 靛蓝色
];

// 统一标签类型
tagsData.forEach((tag, index) => {
  // 移除type字段
  delete tag.type;
  
  // 如果没有颜色或者颜色是默认的，分配新颜色
  if (!tag.color) {
    tag.color = colorPool[index % colorPool.length];
  }
  
  // 移除原始类型相关字段（可选，保留用于数据追溯）
  // delete tag._original_type;
  // delete tag._original_data;
});

console.log('标签类型统一完成');

// 写回文件
fs.writeFileSync(tagsPath, JSON.stringify(tagsData, null, 2), 'utf8');
console.log('tags.json文件已更新');

console.log('统一后的标签数量:', tagsData.length);
console.log('所有标签现在都是统一的标签类型');