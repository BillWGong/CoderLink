const fs = require('fs');
const path = require('path');

// 读取JSON文件的辅助函数
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件 ${filePath} 失败:`, error.message);
        return null;
    }
}

// 写入JSON文件的辅助函数
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`文件 ${filePath} 已更新`);
        return true;
    } catch (error) {
        console.error(`写入文件 ${filePath} 失败:`, error.message);
        return false;
    }
}

// 修复重复的TRAE-SOLO-Hackathon标签
function fixDuplicateTags() {
    console.log('开始修复重复的TRAE-SOLO-Hackathon标签...');
    
    // 读取tags.json
    const tagsPath = path.join(__dirname, 'data', 'tags.json');
    const tags = readJsonFile(tagsPath);
    if (!tags) return;
    
    // 找到所有TRAE-SOLO-Hackathon标签
    const duplicateTags = tags.filter(tag => tag.name === 'TRAE-SOLO-Hackathon');
    console.log(`找到 ${duplicateTags.length} 个TRAE-SOLO-Hackathon标签:`);
    duplicateTags.forEach((tag, index) => {
        console.log(`  ${index + 1}. ID: ${tag._id}, 连接数: ${tag.connection_count}`);
    });
    
    if (duplicateTags.length <= 1) {
        console.log('没有发现重复标签');
        return;
    }
    
    // 选择保留的标签（保留连接数更多的那个，如果相同则保留第一个）
    const keepTag = duplicateTags.reduce((prev, current) => {
        return (current.connection_count > prev.connection_count) ? current : prev;
    });
    
    // 获取要删除的标签ID列表
    const tagsToRemove = duplicateTags.filter(tag => tag._id !== keepTag._id);
    const removeIds = tagsToRemove.map(tag => tag._id);
    
    console.log(`保留标签 ID: ${keepTag._id}`);
    console.log(`删除标签 IDs: ${removeIds.join(', ')}`);
    
    // 从tags.json中删除重复标签
    const updatedTags = tags.filter(tag => {
        if (tag.name === 'TRAE-SOLO-Hackathon') {
            return tag._id === keepTag._id;
        }
        return true;
    });
    
    // 读取persons.json
    const personsPath = path.join(__dirname, 'data', 'persons.json');
    const persons = readJsonFile(personsPath);
    if (!persons) return;
    
    // 更新persons.json中的标签引用
    let updatedPersonsCount = 0;
    let totalConnections = 0;
    
    persons.forEach(person => {
        if (person.tags && Array.isArray(person.tags)) {
            let personUpdated = false;
            person.tags.forEach(tag => {
                if (tag.name === 'TRAE-SOLO-Hackathon') {
                    totalConnections++;
                    if (removeIds.includes(tag._id)) {
                        tag._id = keepTag._id;
                        personUpdated = true;
                    }
                }
            });
            if (personUpdated) {
                updatedPersonsCount++;
            }
        }
    });
    
    // 更新保留标签的连接数
    const finalKeepTag = updatedTags.find(tag => tag._id === keepTag._id);
    if (finalKeepTag) {
        finalKeepTag.connection_count = totalConnections;
        finalKeepTag.updated_at = new Date().toISOString();
    }
    
    console.log(`更新了 ${updatedPersonsCount} 个人员的标签引用`);
    console.log(`TRAE-SOLO-Hackathon标签总连接数: ${totalConnections}`);
    
    // 保存更新后的文件
    const tagsSuccess = writeJsonFile(tagsPath, updatedTags);
    const personsSuccess = writeJsonFile(personsPath, persons);
    
    if (tagsSuccess && personsSuccess) {
        console.log('重复标签修复完成！');
        console.log(`最终保留的标签 ID: ${keepTag._id}`);
        console.log(`连接数: ${totalConnections}`);
    } else {
        console.log('修复过程中出现错误');
    }
}

// 运行修复
fixDuplicateTags();