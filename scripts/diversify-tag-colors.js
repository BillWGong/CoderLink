const fs = require('fs');
const path = require('path');

// 定义多样化的颜色调色板
const colorPalette = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#06B6D4', // 青色
  '#F97316', // 深橙色
  '#84CC16', // 青绿色
  '#EC4899', // 粉色
  '#6366F1', // 靛蓝色
  '#14B8A6', // 蓝绿色
  '#F472B6', // 玫瑰色
  '#A855F7', // 紫罗兰色
  '#22C55E', // 翠绿色
  '#FB923C', // 琥珀色
  '#64748B', // 石板灰
  '#DC2626', // 深红色
  '#7C3AED', // 深紫色
  '#059669', // 深绿色
  '#D97706'  // 深橙色
];

function diversifyTagColors() {
  try {
    // 读取标签数据
    const tagsPath = path.join(__dirname, '..', 'data', 'tags.json');
    const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    
    console.log(`开始为 ${tagsData.length} 个标签分配多样化颜色...`);
    
    // 为每个标签分配不同的颜色
    tagsData.forEach((tag, index) => {
      // 使用模运算确保颜色循环使用
      tag.color = colorPalette[index % colorPalette.length];
    });
    
    // 保存更新后的数据
    fs.writeFileSync(tagsPath, JSON.stringify(tagsData, null, 2), 'utf8');
    
    // 统计颜色分布
    const colorStats = {};
    tagsData.forEach(tag => {
      colorStats[tag.color] = (colorStats[tag.color] || 0) + 1;
    });
    
    console.log('\n颜色分布统计:');
    Object.entries(colorStats).forEach(([color, count]) => {
      console.log(`${color}: ${count} 个标签`);
    });
    
    console.log('\n✅ 标签颜色多样化完成！');
    
  } catch (error) {
    console.error('❌ 处理标签颜色时出错:', error.message);
    process.exit(1);
  }
}

// 执行颜色多样化
diversifyTagColors();