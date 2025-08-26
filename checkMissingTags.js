const fs = require('fs');
const path = require('path');

// 读取persons.json文件
function readPersonsData() {
    const personsPath = path.join(__dirname, 'data', 'persons.json');
    const personsData = JSON.parse(fs.readFileSync(personsPath, 'utf8'));
    return personsData;
}

// 读取tags.json文件
function readTagsData() {
    const tagsPath = path.join(__dirname, 'data', 'tags.json');
    const tagsData = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
    return tagsData;
}

// 收集persons.json中所有唯一的标签ID
function collectPersonTagIds() {
    const persons = readPersonsData();
    const tagIds = new Set();
    
    persons.forEach(person => {
        if (person.tags && Array.isArray(person.tags)) {
            person.tags.forEach(tag => {
                if (typeof tag === 'object' && tag._id) {
                    tagIds.add(tag._id);
                } else if (typeof tag === 'string') {
                    tagIds.add(tag);
                }
            });
        }
    });
    
    return Array.from(tagIds);
}

// 收集tags.json中现有的标签ID
function collectExistingTagIds() {
    const tags = readTagsData();
    return tags.map(tag => tag._id);
}

// 找出缺失的标签ID
function findMissingTagIds() {
    const personTagIds = collectPersonTagIds();
    const existingTagIds = new Set(collectExistingTagIds());
    
    const missingTagIds = personTagIds.filter(tagId => !existingTagIds.has(tagId));
    
    console.log('=== 标签ID检查结果 ===');
    console.log(`persons.json中总共有 ${personTagIds.length} 个唯一标签ID`);
    console.log(`tags.json中现有 ${existingTagIds.size} 个标签`);
    console.log(`缺失的标签ID数量: ${missingTagIds.length}`);
    
    if (missingTagIds.length > 0) {
        console.log('\n缺失的标签ID列表:');
        missingTagIds.forEach((tagId, index) => {
            console.log(`${index + 1}. ${tagId}`);
        });
    } else {
        console.log('\n✅ 所有标签ID都存在于tags.json中');
    }
    
    return missingTagIds;
}

// 为缺失的标签创建标签对象
function createMissingTags(missingTagIds) {
    const persons = readPersonsData();
    const missingTags = [];
    
    missingTagIds.forEach(tagId => {
        // 从persons.json中找到这个标签的名称
        let tagName = tagId; // 默认使用ID作为名称
        
        for (const person of persons) {
            if (person.tags && Array.isArray(person.tags)) {
                const foundTag = person.tags.find(tag => 
                    (typeof tag === 'object' && tag._id === tagId) ||
                    (typeof tag === 'string' && tag === tagId)
                );
                
                if (foundTag && typeof foundTag === 'object' && foundTag.name) {
                    tagName = foundTag.name;
                    break;
                }
            }
        }
        
        // 创建新的标签对象
        const newTag = {
            _id: tagId,
            name: tagName,
            description: `自动生成的标签: ${tagName}`,
            color: '#6B7280', // 默认灰色
            parent_tags: [],
            child_tags: [],
            connection_count: 0
        };
        
        missingTags.push(newTag);
    });
    
    return missingTags;
}

// 更新tags.json文件
function updateTagsFile(missingTags) {
    if (missingTags.length === 0) {
        console.log('\n没有需要添加的标签');
        return;
    }
    
    const existingTags = readTagsData();
    const updatedTags = [...existingTags, ...missingTags];
    
    const tagsPath = path.join(__dirname, 'data', 'tags.json');
    fs.writeFileSync(tagsPath, JSON.stringify(updatedTags, null, 2), 'utf8');
    
    console.log(`\n✅ 已添加 ${missingTags.length} 个缺失的标签到tags.json`);
    missingTags.forEach((tag, index) => {
        console.log(`${index + 1}. ${tag.name} (${tag._id})`);
    });
}

// 重新计算标签连接数量
function recalculateTagConnections() {
    const persons = readPersonsData();
    const tags = readTagsData();
    
    // 创建标签连接计数器
    const tagConnectionCounts = {};
    
    // 初始化所有标签的连接数为0
    tags.forEach(tag => {
        tagConnectionCounts[tag._id] = 0;
    });
    
    // 统计每个标签被多少人员关联
    persons.forEach(person => {
        if (person.tags && Array.isArray(person.tags)) {
            person.tags.forEach(tag => {
                const tagId = typeof tag === 'object' ? tag._id : tag;
                if (tagConnectionCounts.hasOwnProperty(tagId)) {
                    tagConnectionCounts[tagId]++;
                }
            });
        }
    });
    
    // 更新标签的connection_count字段
    const updatedTags = tags.map(tag => ({
        ...tag,
        connection_count: tagConnectionCounts[tag._id] || 0
    }));
    
    // 保存更新后的tags.json
    const tagsPath = path.join(__dirname, 'data', 'tags.json');
    fs.writeFileSync(tagsPath, JSON.stringify(updatedTags, null, 2), 'utf8');
    
    console.log('\n✅ 已重新计算所有标签的连接数量');
    
    // 显示连接数统计
    const connectionStats = Object.entries(tagConnectionCounts)
        .filter(([_, count]) => count > 0)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10);
    
    console.log('\n前10个最多连接的标签:');
    connectionStats.forEach(([tagId, count]) => {
        const tag = updatedTags.find(t => t._id === tagId);
        console.log(`${tag ? tag.name : tagId}: ${count} 个连接`);
    });
}

// 主函数
function main() {
    console.log('开始检查人员与标签连接缺失问题...');
    
    try {
        // 1. 找出缺失的标签ID
        const missingTagIds = findMissingTagIds();
        
        // 2. 为缺失的标签创建标签对象
        const missingTags = createMissingTags(missingTagIds);
        
        // 3. 更新tags.json文件
        updateTagsFile(missingTags);
        
        // 4. 重新计算标签连接数量
        recalculateTagConnections();
        
        console.log('\n🎉 人员与标签连接问题修复完成!');
        
    } catch (error) {
        console.error('处理过程中出现错误:', error);
    }
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = {
    collectPersonTagIds,
    collectExistingTagIds,
    findMissingTagIds,
    createMissingTags,
    updateTagsFile,
    recalculateTagConnections
};