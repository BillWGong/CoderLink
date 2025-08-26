const fs = require('fs');
const path = require('path');

// 定义正确和错误的标签ID
const CORRECT_TAG_ID = '512d1aca-8bd0-4c0a-9784-daca188bb162';
const INCORRECT_TAG_ID = '94848d40-2a22-4c3f-964f-b2301fd0a57e';
const TAG_NAME = 'TRAE-SOLO-Hackathon';

// 文件路径
const PERSONS_FILE = path.join(__dirname, 'data', 'persons.json');

function fixTagIds() {
    try {
        console.log('开始修复标签ID...');
        
        // 读取persons.json文件
        const personsData = JSON.parse(fs.readFileSync(PERSONS_FILE, 'utf8'));
        
        let fixedCount = 0;
        let totalPersons = personsData.length;
        
        // 遍历所有人员
        personsData.forEach((person, personIndex) => {
            if (person.tags && Array.isArray(person.tags)) {
                // 遍历每个人的标签
                person.tags.forEach((tag, tagIndex) => {
                    // 检查是否是TRAE-SOLO-Hackathon标签且ID不正确
                    if (tag.name === TAG_NAME && tag._id === INCORRECT_TAG_ID) {
                        console.log(`修复人员 "${person.name}" 的 ${TAG_NAME} 标签ID`);
                        console.log(`  错误ID: ${INCORRECT_TAG_ID}`);
                        console.log(`  正确ID: ${CORRECT_TAG_ID}`);
                        
                        // 替换为正确的ID
                        person.tags[tagIndex]._id = CORRECT_TAG_ID;
                        fixedCount++;
                    }
                });
            }
        });
        
        // 如果有修复，保存文件
        if (fixedCount > 0) {
            // 创建备份
            const backupFile = PERSONS_FILE.replace('.json', `_backup_${Date.now()}.json`);
            fs.writeFileSync(backupFile, fs.readFileSync(PERSONS_FILE));
            console.log(`已创建备份文件: ${path.basename(backupFile)}`);
            
            // 保存修复后的数据
            fs.writeFileSync(PERSONS_FILE, JSON.stringify(personsData, null, 2));
            console.log(`已保存修复后的数据到 ${path.basename(PERSONS_FILE)}`);
        }
        
        // 输出结果
        console.log('\n=== 修复结果 ===');
        console.log(`总人员数: ${totalPersons}`);
        console.log(`修复的标签数: ${fixedCount}`);
        
        if (fixedCount === 0) {
            console.log('没有发现需要修复的标签ID。');
        } else {
            console.log(`成功修复了 ${fixedCount} 个 ${TAG_NAME} 标签的ID。`);
        }
        
    } catch (error) {
        console.error('修复过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 运行修复脚本
fixTagIds();