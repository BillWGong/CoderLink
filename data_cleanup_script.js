const fs = require('fs');
const path = require('path');

// 数据清理和修复脚本
class DataCleanupScript {
    constructor() {
        this.personsFile = 'd:\\Joestar\\jojorn\\connectMeTrae\\data\\persons.json';
        this.tagsFile = 'd:\\Joestar\\jojorn\\connectMeTrae\\data\\tags.json';
        this.iconFolder = 'd:\\Joestar\\jojorn\\connectMeTrae\\icon';
        this.report = {
            profileToDescription: 0,
            duplicateFieldsRemoved: 0,
            avatarsCleared: 0,
            avatarsAdded: 0,
            invalidContactsRemoved: 0,
            tagConnectionsFixed: 0
        };
    }

    // 读取JSON文件
    readJsonFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return null;
        }
    }

    // 写入JSON文件
    writeJsonFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            return false;
        }
    }

    // 获取icon文件夹中的头像文件
    getAvailableAvatars() {
        try {
            const files = fs.readdirSync(this.iconFolder);
            const avatarMap = {};
            
            files.forEach(file => {
                const ext = path.extname(file).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jfif'].includes(ext)) {
                    const nameWithoutExt = path.basename(file, ext);
                    avatarMap[nameWithoutExt] = path.join(this.iconFolder, file);
                }
            });
            
            return avatarMap;
        } catch (error) {
            console.error('Error reading icon folder:', error);
            return {};
        }
    }

    // 将图片文件转换为base64
    imageToBase64(imagePath) {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const ext = path.extname(imagePath).toLowerCase();
            let mimeType = 'image/jpeg';
            
            switch (ext) {
                case '.png': mimeType = 'image/png'; break;
                case '.gif': mimeType = 'image/gif'; break;
                case '.webp': mimeType = 'image/webp'; break;
                case '.jfif': mimeType = 'image/jpeg'; break;
                default: mimeType = 'image/jpeg';
            }
            
            return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        } catch (error) {
            console.error(`Error converting image ${imagePath} to base64:`, error);
            return null;
        }
    }

    // 1. 统一字段名称：将"profile"改为"description"
    fixProfileToDescription(persons) {
        persons.forEach(person => {
            if (person.profile && !person.description) {
                person.description = person.profile;
                delete person.profile;
                this.report.profileToDescription++;
            }
        });
    }

    // 2. 清理重复字段：删除同时存在"profile"和"description"时的"profile"字段
    removeDuplicateFields(persons) {
        persons.forEach(person => {
            if (person.profile && person.description) {
                delete person.profile;
                this.report.duplicateFieldsRemoved++;
            }
        });
    }

    // 3. 清空所有头像数据
    clearAvatarData(persons) {
        persons.forEach(person => {
            if (person.avatar) {
                person.avatar = '';
                this.report.avatarsCleared++;
            }
        });
    }

    // 4. 根据icon文件夹添加头像
    addAvatarsFromIcons(persons) {
        const availableAvatars = this.getAvailableAvatars();
        
        persons.forEach(person => {
            if (person.name && availableAvatars[person.name]) {
                const base64Avatar = this.imageToBase64(availableAvatars[person.name]);
                if (base64Avatar) {
                    person.avatar = base64Avatar;
                    this.report.avatarsAdded++;
                }
            }
        });
    }

    // 5. 清理无效联系人
    removeInvalidContacts(persons) {
        const validPersons = persons.filter(person => {
            const hasValidName = person.name && 
                                person.name.trim() !== '' && 
                                person.name !== '????' &&
                                !person.name.includes('????');
            
            if (!hasValidName) {
                this.report.invalidContactsRemoved++;
                return false;
            }
            return true;
        });
        
        return validPersons;
    }

    // 6. 修复标签连接关系
    fixTagConnections(persons, tags) {
        // 重新计算每个标签的连接数
        const tagConnectionCounts = {};
        
        // 初始化计数
        tags.forEach(tag => {
            tagConnectionCounts[tag._id] = 0;
        });
        
        // 统计实际连接数
        persons.forEach(person => {
            if (person.tags && Array.isArray(person.tags)) {
                person.tags.forEach(tag => {
                    if (tagConnectionCounts.hasOwnProperty(tag._id)) {
                        tagConnectionCounts[tag._id]++;
                    }
                });
            }
            
            // 检查companies和organizations中的标签
            ['companies', 'organizations'].forEach(field => {
                if (person[field] && Array.isArray(person[field])) {
                    person[field].forEach(item => {
                        if (tagConnectionCounts.hasOwnProperty(item._id)) {
                            tagConnectionCounts[item._id]++;
                        }
                    });
                }
            });
        });
        
        // 更新标签的连接数
        tags.forEach(tag => {
            const newCount = tagConnectionCounts[tag._id] || 0;
            if (tag.connections !== newCount) {
                tag.connections = newCount;
                this.report.tagConnectionsFixed++;
            }
        });
    }

    // 执行完整的数据清理
    async executeCleanup() {
        console.log('开始数据清理和修复...');
        
        // 读取数据文件
        const persons = this.readJsonFile(this.personsFile);
        const tags = this.readJsonFile(this.tagsFile);
        
        if (!persons || !tags) {
            console.error('无法读取数据文件');
            return false;
        }
        
        console.log(`读取到 ${persons.length} 个联系人和 ${tags.length} 个标签`);
        
        // 执行清理步骤
        console.log('1. 统一字段名称：profile -> description');
        this.fixProfileToDescription(persons);
        
        console.log('2. 清理重复字段');
        this.removeDuplicateFields(persons);
        
        console.log('3. 清空头像数据');
        this.clearAvatarData(persons);
        
        console.log('4. 从icon文件夹添加头像');
        this.addAvatarsFromIcons(persons);
        
        console.log('5. 清理无效联系人');
        const cleanedPersons = this.removeInvalidContacts(persons);
        
        console.log('6. 修复标签连接关系');
        this.fixTagConnections(cleanedPersons, tags);
        
        // 保存清理后的数据
        console.log('保存清理后的数据...');
        const personsSuccess = this.writeJsonFile(this.personsFile, cleanedPersons);
        const tagsSuccess = this.writeJsonFile(this.tagsFile, tags);
        
        if (personsSuccess && tagsSuccess) {
            console.log('数据清理完成！');
            this.printReport();
            return true;
        } else {
            console.error('保存数据时出错');
            return false;
        }
    }

    // 打印修复报告
    printReport() {
        console.log('\n=== 数据修复报告 ===');
        console.log(`profile字段改为description: ${this.report.profileToDescription} 个`);
        console.log(`删除重复字段: ${this.report.duplicateFieldsRemoved} 个`);
        console.log(`清空头像数据: ${this.report.avatarsCleared} 个`);
        console.log(`添加新头像: ${this.report.avatarsAdded} 个`);
        console.log(`删除无效联系人: ${this.report.invalidContactsRemoved} 个`);
        console.log(`修复标签连接: ${this.report.tagConnectionsFixed} 个`);
        console.log('==================\n');
    }
}

// 执行脚本
if (require.main === module) {
    const cleanup = new DataCleanupScript();
    cleanup.executeCleanup().then(success => {
        if (success) {
            console.log('数据清理脚本执行成功！');
            process.exit(0);
        } else {
            console.error('数据清理脚本执行失败！');
            process.exit(1);
        }
    });
}

module.exports = DataCleanupScript;