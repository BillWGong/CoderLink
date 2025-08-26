// 重定向到新的数据生成脚本位置
const { generateData } = require('./src/utils/generateData');

// 导出函数，保持向后兼容性
module.exports = { generateData };

// 如果直接运行此文件
if (require.main === module) {
  console.log('正在调用新的数据生成工具...');
  generateData();
} 