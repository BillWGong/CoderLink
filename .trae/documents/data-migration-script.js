/**
 * 数据迁移脚本
 * 将现有的 companies.json, organizations.json, tags.json 合并为统一的 tags.json
 * 将 contacts.json 重构为 persons.json
 */

const fs = require('fs');
const path = require('path');

// 配置路径
const DATA_DIR = path.join(__dirname, '../../data');
const BACKUP_DIR = path.join(DATA_DIR, 'backup');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * 备份现有数据文件
 */
function backupExistingData() {
    console.log('📦 开始备份现有数据...');
    
    const filesToBackup = ['contacts.json', 'companies.json', 'organizations.json', 'tags.json'];
    
    filesToBackup.forEach(filename => {
        const sourcePath = path.join(DATA_DIR, filename);
        const backupPath = path.join(BACKUP_DIR, `${Date.now()}_${filename}`);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, backupPath);
            console.log(`✅ 已备份: ${filename} -> ${path.basename(backupPath)}`);
        } else {
            console.log(`⚠️  文件不存在: ${filename}`);
        }
    });
    
    console.log('✅ 数据备份完成\n');
}

/**
 * 读取现有数据文件
 */
function loadExistingData() {
    console.log('📖 读取现有数据文件...');
    
    const contacts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'contacts.json'), 'utf8'));
    const companies = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'companies.json'), 'utf8'));
    const organizations = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'organizations.json'), 'utf8'));
    const tags = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tags.json'), 'utf8'));
    
    console.log(`📊 数据统计:`);
    console.log(`   - 联系人: ${contacts.length}`);
    console.log(`   - 公司: ${companies.length}`);
    console.log(`   - 组织: ${organizations.length}`);
    console.log(`   - 标签: ${tags.length}`);
    console.log('');
    
    return { contacts, companies, organizations, tags };
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 将公司数据转换为标签
 */
function convertCompaniesToTags(companies) {
    console.log('🏢 转换公司数据为标签...');
    
    return companies.map(company => {
        const tag = {
            _id: company._id,
            name: company.name,
            description: company.description || '',
            type: 'company',
            color: '#3B82F6', // 蓝色
            parent_tags: [],
            child_tags: [],
            connection_count: 0,
            created_at: company.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // 保留原始数据用于调试
            _original_type: 'company',
            _original_data: company
        };
        
        // 如果公司有关联的组织，添加为父标签
        if (company.organizations && company.organizations.length > 0) {
            tag.parent_tags = company.organizations;
        }
        
        return tag;
    });
}

/**
 * 将组织数据转换为标签
 */
function convertOrganizationsToTags(organizations) {
    console.log('🏛️ 转换组织数据为标签...');
    
    return organizations.map(org => ({
        _id: org._id,
        name: org.name,
        description: org.description || '',
        type: 'organization',
        color: '#10B981', // 绿色
        parent_tags: [],
        child_tags: [],
        connection_count: 0,
        created_at: org.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _original_type: 'organization',
        _original_data: org
    }));
}

/**
 * 转换现有标签数据
 */
function convertExistingTags(tags) {
    console.log('🏷️ 转换现有标签数据...');
    
    return tags.map(tag => ({
        _id: tag._id,
        name: tag.name,
        description: tag.description || '',
        type: 'skill', // 默认为技能标签
        color: '#F59E0B', // 橙色
        parent_tags: [],
        child_tags: [],
        connection_count: 0,
        created_at: tag.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _original_type: 'tag',
        _original_data: tag
    }));
}

/**
 * 计算标签连接数量
 */
function calculateTagConnections(persons, allTags) {
    console.log('🔗 计算标签连接数量...');
    
    const tagConnections = {};
    
    // 初始化计数器
    allTags.forEach(tag => {
        tagConnections[tag._id] = 0;
    });
    
    // 统计人员关联的标签
    persons.forEach(person => {
        if (person.tags && person.tags.length > 0) {
            person.tags.forEach(tagId => {
                if (tagConnections[tagId] !== undefined) {
                    tagConnections[tagId]++;
                }
            });
        }
    });
    
    // 统计标签间关联
    allTags.forEach(tag => {
        if (tag.parent_tags && tag.parent_tags.length > 0) {
            tag.parent_tags.forEach(parentId => {
                if (tagConnections[parentId] !== undefined) {
                    tagConnections[parentId]++;
                }
            });
        }
    });
    
    // 更新标签的连接数量
    allTags.forEach(tag => {
        tag.connection_count = tagConnections[tag._id] || 0;
    });
    
    console.log('📊 标签连接统计:');
    const sortedTags = allTags
        .filter(tag => tag.connection_count > 0)
        .sort((a, b) => b.connection_count - a.connection_count)
        .slice(0, 10);
    
    sortedTags.forEach(tag => {
        console.log(`   - ${tag.name} (${tag.type}): ${tag.connection_count} 个连接`);
    });
    console.log('');
    
    return allTags;
}

/**
 * 将联系人数据转换为人员数据
 */
function convertContactsToPersons(contacts) {
    console.log('👥 转换联系人数据为人员数据...');
    
    return contacts.map(contact => {
        const person = {
            _id: contact._id,
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            description: contact.description || '',
            avatar: contact.avatar || '',
            tags: [],
            created_at: contact.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            _original_data: contact
        };
        
        // 合并公司和组织到标签数组
        if (contact.companies && contact.companies.length > 0) {
            person.tags.push(...contact.companies);
        }
        
        if (contact.organizations && contact.organizations.length > 0) {
            person.tags.push(...contact.organizations);
        }
        
        if (contact.tags && contact.tags.length > 0) {
            person.tags.push(...contact.tags);
        }
        
        // 去重
        person.tags = [...new Set(person.tags)];
        
        return person;
    });
}

/**
 * 建立标签层级关系
 */
function establishTagHierarchy(allTags, companies) {
    console.log('🌳 建立标签层级关系...');
    
    // 为每个标签创建映射
    const tagMap = {};
    allTags.forEach(tag => {
        tagMap[tag._id] = tag;
    });
    
    // 处理公司-组织关系
    companies.forEach(company => {
        if (company.organizations && company.organizations.length > 0) {
            const companyTag = tagMap[company._id];
            if (companyTag) {
                company.organizations.forEach(orgId => {
                    const orgTag = tagMap[orgId];
                    if (orgTag) {
                        // 公司的父标签是组织
                        if (!companyTag.parent_tags.includes(orgId)) {
                            companyTag.parent_tags.push(orgId);
                        }
                        // 组织的子标签是公司
                        if (!orgTag.child_tags.includes(company._id)) {
                            orgTag.child_tags.push(company._id);
                        }
                    }
                });
            }
        }
    });
    
    console.log('✅ 标签层级关系建立完成\n');
    return allTags;
}

/**
 * 验证迁移结果
 */
function validateMigration(originalData, newData) {
    console.log('🔍 验证迁移结果...');
    
    const { contacts, companies, organizations, tags } = originalData;
    const { persons, tags: newTags } = newData;
    
    // 验证数量
    console.log('📊 数量验证:');
    console.log(`   - 原联系人: ${contacts.length}, 新人员: ${persons.length}`);
    console.log(`   - 原实体总数: ${companies.length + organizations.length + tags.length}`);
    console.log(`   - 新标签总数: ${newTags.length}`);
    
    // 验证关联关系
    let totalOriginalConnections = 0;
    let totalNewConnections = 0;
    
    contacts.forEach(contact => {
        const companyCount = contact.companies ? contact.companies.length : 0;
        const orgCount = contact.organizations ? contact.organizations.length : 0;
        const tagCount = contact.tags ? contact.tags.length : 0;
        totalOriginalConnections += companyCount + orgCount + tagCount;
    });
    
    persons.forEach(person => {
        totalNewConnections += person.tags ? person.tags.length : 0;
    });
    
    console.log(`   - 原关联关系: ${totalOriginalConnections}`);
    console.log(`   - 新关联关系: ${totalNewConnections}`);
    
    // 验证数据完整性
    const missingPersons = [];
    const missingTags = [];
    
    contacts.forEach(contact => {
        const person = persons.find(p => p._id === contact._id);
        if (!person) {
            missingPersons.push(contact._id);
        }
    });
    
    [...companies, ...organizations, ...tags].forEach(entity => {
        const tag = newTags.find(t => t._id === entity._id);
        if (!tag) {
            missingTags.push(entity._id);
        }
    });
    
    if (missingPersons.length > 0) {
        console.log(`❌ 缺失人员: ${missingPersons.length} 个`);
    }
    
    if (missingTags.length > 0) {
        console.log(`❌ 缺失标签: ${missingTags.length} 个`);
    }
    
    if (missingPersons.length === 0 && missingTags.length === 0) {
        console.log('✅ 数据完整性验证通过');
    }
    
    console.log('');
}

/**
 * 保存新数据文件
 */
function saveNewData(persons, tags) {
    console.log('💾 保存新数据文件...');
    
    // 保存人员数据
    const personsPath = path.join(DATA_DIR, 'persons.json');
    fs.writeFileSync(personsPath, JSON.stringify(persons, null, 2), 'utf8');
    console.log(`✅ 已保存: persons.json (${persons.length} 条记录)`);
    
    // 保存标签数据
    const tagsPath = path.join(DATA_DIR, 'tags_new.json');
    fs.writeFileSync(tagsPath, JSON.stringify(tags, null, 2), 'utf8');
    console.log(`✅ 已保存: tags_new.json (${tags.length} 条记录)`);
    
    console.log('\n📋 迁移摘要:');
    console.log(`   - 生成了 ${persons.length} 个人员记录`);
    console.log(`   - 生成了 ${tags.length} 个标签记录`);
    console.log(`   - 标签类型分布:`);
    
    const typeCount = {};
    tags.forEach(tag => {
        typeCount[tag.type] = (typeCount[tag.type] || 0) + 1;
    });
    
    Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`     * ${type}: ${count} 个`);
    });
    
    console.log('\n🎉 数据迁移完成！');
    console.log('\n📝 下一步:');
    console.log('   1. 检查生成的 persons.json 和 tags_new.json 文件');
    console.log('   2. 确认数据正确后，将 tags_new.json 重命名为 tags.json');
    console.log('   3. 更新前端代码以使用新的数据结构');
}

/**
 * 主迁移函数
 */
function migrateData() {
    console.log('🚀 开始数据迁移流程\n');
    
    try {
        // 1. 备份现有数据
        backupExistingData();
        
        // 2. 读取现有数据
        const originalData = loadExistingData();
        const { contacts, companies, organizations, tags } = originalData;
        
        // 3. 转换数据
        const companyTags = convertCompaniesToTags(companies);
        const organizationTags = convertOrganizationsToTags(organizations);
        const skillTags = convertExistingTags(tags);
        
        // 4. 合并所有标签
        let allTags = [...companyTags, ...organizationTags, ...skillTags];
        
        // 5. 建立标签层级关系
        allTags = establishTagHierarchy(allTags, companies);
        
        // 6. 转换联系人为人员
        const persons = convertContactsToPersons(contacts);
        
        // 7. 计算标签连接数量
        allTags = calculateTagConnections(persons, allTags);
        
        // 8. 验证迁移结果
        validateMigration(originalData, { persons, tags: allTags });
        
        // 9. 保存新数据
        saveNewData(persons, allTags);
        
    } catch (error) {
        console.error('❌ 迁移过程中发生错误:', error);
        console.log('\n🔄 请检查错误信息并重试');
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    migrateData();
}

module.exports = {
    migrateData,
    backupExistingData,
    loadExistingData,
    validateMigration
};