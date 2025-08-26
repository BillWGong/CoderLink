# 代码重构实施计划

## 1. 重构概览

本文档详细说明如何将现有代码从支持4种实体类型（联系人、公司、组织、标签）重构为支持2种实体类型（人员、标签）的统一架构。

## 2. 文件修改清单

### 2.1 核心JavaScript文件

* `js/script.js` - 主要逻辑文件（重点修改）

* `generateData.js` - 数据生成逻辑（可选更新）

* `dataStorage.js` - 数据存储逻辑（需要更新）

### 2.2 数据文件

* `data/persons.json` - 新的人员数据文件

* `data/tags.json` - 重构后的统一标签文件

### 2.3 HTML文件

* `index.html` - 表单和UI元素更新

## 3. 详细修改计划

### 3.1 script.js 核心函数重构

#### 3.1.1 loadData() 函数修改

**当前代码：**

```javascript
async function loadData() {
    try {
        const [contacts, companies, organizations, tags] = await Promise.all([
            fetch('./data/contacts.json').then(response => response.json()),
            fetch('./data/companies.json').then(response => response.json()),
            fetch('./data/organizations.json').then(response => response.json()),
            fetch('./data/tags.json').then(response => response.json())
        ]);
        
        // 存储到全局变量
        window.contactsData = contacts;
        window.companiesData = companies;
        window.organizationsData = organizations;
        window.tagsData = tags;
        
        // 创建图谱数据
        const graphData = createGraphData(contacts, companies, organizations, tags);
        // ...
    } catch (error) {
        console.error('Error loading data:', error);
    }
}
```

**重构后代码：**

```javascript
async function loadData() {
    try {
        const [persons, tags] = await Promise.all([
            fetch('./data/persons.json').then(response => response.json()),
            fetch('./data/tags.json').then(response => response.json())
        ]);
        
        // 存储到全局变量
        window.personsData = persons;
        window.tagsData = tags;
        
        console.log(`📊 数据加载完成: ${persons.length} 个人员, ${tags.length} 个标签`);
        
        // 创建图谱数据
        const graphData = createGraphData(persons, tags);
        
        if (graphData && graphData.nodes && graphData.links) {
            window.graphData = graphData;
            console.log(`🎯 图谱数据: ${graphData.nodes.length} 个节点, ${graphData.links.length} 个连接`);
            
            // 初始化图谱
            if (initGraph()) {
                setupToolbar();
            }
            
            // 更新列表显示
            updatePersonsList();
            updateTagsList();
        }
        
    } catch (error) {
        console.error('❌ 数据加载失败:', error);
        showErrorMessage('数据加载失败，请刷新页面重试');
    }
}
```

#### 3.1.2 createGraphData() 函数重构

**当前代码结构：**

```javascript
function createGraphData(contacts, companies, organizations, tags) {
    const nodes = [];
    const links = [];
    
    // 添加标签节点
    tags.forEach(tag => { /* ... */ });
    
    // 添加组织节点
    organizations.forEach(org => { /* ... */ });
    
    // 添加公司节点
    companies.forEach(company => { /* ... */ });
    
    // 添加联系人节点
    contacts.forEach(contact => { /* ... */ });
    
    // 创建各种链接关系
    // ...
    
    return { nodes, links };
}
```

**重构后代码：**

```javascript
function createGraphData(persons, tags) {
    const nodes = [];
    const links = [];
    
    console.log('🔄 开始创建图谱数据...');
    
    // 添加标签节点（动态大小）
    tags.forEach(tag => {
        const nodeSize = calculateTagSize(tag.connection_count);
        const nodeColor = getTagColor(tag.type);
        
        nodes.push({
            id: tag._id,
            name: tag.name,
            type: 'tag',
            subtype: tag.type,
            size: nodeSize,
            color: nodeColor,
            description: tag.description,
            connection_count: tag.connection_count,
            parent_tags: tag.parent_tags || [],
            child_tags: tag.child_tags || [],
            created_at: tag.created_at,
            updated_at: tag.updated_at
        });
    });
    
    // 添加人员节点
    persons.forEach(person => {
        nodes.push({
            id: person._id,
            name: person.name,
            type: 'person',
            size: 15, // 固定大小
            color: '#4F46E5', // 人员统一颜色
            email: person.email,
            phone: person.phone,
            description: person.description,
            avatar: person.avatar,
            tags: person.tags || [],
            created_at: person.created_at,
            updated_at: person.updated_at
        });
        
        // 创建人员-标签链接
        if (person.tags && person.tags.length > 0) {
            person.tags.forEach(tagId => {
                links.push({
                    source: person._id,
                    target: tagId,
                    type: 'person-tag',
                    strength: 1
                });
            });
        }
    });
    
    // 创建标签-标签层级链接
    tags.forEach(tag => {
        if (tag.parent_tags && tag.parent_tags.length > 0) {
            tag.parent_tags.forEach(parentId => {
                links.push({
                    source: tag._id,
                    target: parentId,
                    type: 'tag-hierarchy',
                    strength: 0.5
                });
            });
        }
    });
    
    console.log(`✅ 图谱数据创建完成: ${nodes.length} 个节点, ${links.length} 个连接`);
    
    return { nodes, links };
}
```

#### 3.1.3 新增辅助函数

```javascript
/**
 * 计算标签大小
 * @param {number} connectionCount - 连接数量
 * @returns {number} 节点大小
 */
function calculateTagSize(connectionCount) {
    const minSize = 8;
    const maxSize = 30;
    const baseSize = 12;
    
    if (!connectionCount || connectionCount === 0) {
        return baseSize;
    }
    
    // 使用对数缩放，避免大标签过于突出
    const scaledSize = baseSize + Math.log(connectionCount + 1) * 3;
    return Math.min(Math.max(scaledSize, minSize), maxSize);
}

/**
 * 获取标签颜色
 * @param {string} tagType - 标签类型
 * @returns {string} 颜色代码
 */
function getTagColor(tagType) {
    const colorMap = {
        company: '#3B82F6',      // 蓝色 - 公司
        organization: '#10B981',  // 绿色 - 组织
        skill: '#F59E0B',        // 橙色 - 技能
        industry: '#8B5CF6',     // 紫色 - 行业
        location: '#EF4444',     // 红色 - 地点
        custom: '#6B7280'        // 灰色 - 自定义
    };
    return colorMap[tagType] || colorMap.custom;
}

/**
 * 获取标签类型显示名称
 * @param {string} tagType - 标签类型
 * @returns {string} 显示名称
 */
function getTagTypeDisplayName(tagType) {
    const nameMap = {
        company: '公司',
        organization: '组织',
        skill: '技能',
        industry: '行业',
        location: '地点',
        custom: '自定义'
    };
    return nameMap[tagType] || '未知';
}
```

#### 3.1.4 节点渲染逻辑重构

**在 initGraph() 函数中的节点渲染部分：**

```javascript
// 自定义节点渲染
graph.nodeCanvasObject((node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = Math.max(12 / globalScale, 4);
    ctx.font = `${fontSize}px Arial`;
    
    // 根据节点类型渲染
    if (node.type === 'person') {
        // 人员节点渲染
        renderPersonNode(node, ctx, globalScale, fontSize);
    } else if (node.type === 'tag') {
        // 标签节点渲染
        renderTagNode(node, ctx, globalScale, fontSize);
    }
    
    // 选中状态高亮
    if (selectedNode && selectedNode.id === node.id) {
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 3 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // 悬停状态高亮
    if (hoveredNode && hoveredNode.id === node.id) {
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 2 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 2, 0, 2 * Math.PI);
        ctx.stroke();
    }
});

/**
 * 渲染人员节点
 */
function renderPersonNode(node, ctx, globalScale, fontSize) {
    const radius = node.size;
    
    // 绘制头像或默认圆形
    if (node.avatar && node.avatar !== 'icon/common.png') {
        // 绘制头像
        const img = getOrLoadImage(node.avatar);
        if (img && img.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(img, node.x - radius, node.y - radius, radius * 2, radius * 2);
            ctx.restore();
        } else {
            // 头像加载中，显示默认圆形
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    } else {
        // 默认圆形
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y + radius + fontSize + 2);
}

/**
 * 渲染标签节点
 */
function renderTagNode(node, ctx, globalScale, fontSize) {
    const radius = node.size;
    
    // 绘制标签圆形
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制标签类型图标（可选）
    const icon = getTagTypeIcon(node.subtype);
    if (icon && fontSize > 8) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${fontSize * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, node.x, node.y);
    }
    
    // 绘制连接数量（如果大于0）
    if (node.connection_count > 0 && fontSize > 6) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${fontSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.connection_count.toString(), node.x, node.y + radius * 0.3);
    }
    
    // 绘制标签名称
    ctx.fillStyle = '#333';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.name, node.x, node.y + radius + fontSize + 2);
}

/**
 * 获取标签类型图标
 */
function getTagTypeIcon(tagType) {
    const iconMap = {
        company: '🏢',
        organization: '🏛️',
        skill: '⚡',
        industry: '🏭',
        location: '📍',
        custom: '🏷️'
    };
    return iconMap[tagType] || '🏷️';
}
```

### 3.2 列表更新函数

#### 3.2.1 更新人员列表

```javascript
function updatePersonsList() {
    const personsListContainer = document.getElementById('persons-list');
    if (!personsListContainer || !window.personsData) return;
    
    personsListContainer.innerHTML = '';
    
    window.personsData.forEach(person => {
        const personElement = document.createElement('div');
        personElement.className = 'person-item';
        personElement.innerHTML = `
            <div class="person-info">
                <div class="person-avatar">
                    ${person.avatar && person.avatar !== 'icon/common.png' 
                        ? `<img src="${person.avatar}" alt="${person.name}" />` 
                        : '<div class="default-avatar">👤</div>'
                    }
                </div>
                <div class="person-details">
                    <h4>${person.name}</h4>
                    <p class="person-contact">
                        ${person.email ? `📧 ${person.email}` : ''}
                        ${person.phone ? `📞 ${person.phone}` : ''}
                    </p>
                    <div class="person-tags">
                        ${(person.tags || []).map(tagId => {
                            const tag = window.tagsData.find(t => t._id === tagId);
                            return tag ? `<span class="tag-chip" style="background-color: ${tag.color}20; color: ${tag.color}">${tag.name}</span>` : '';
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        personElement.addEventListener('click', () => {
            highlightNode(person._id);
            showPersonDetails(person);
        });
        
        personsListContainer.appendChild(personElement);
    });
}
```

#### 3.2.2 更新标签列表

```javascript
function updateTagsList() {
    const tagsListContainer = document.getElementById('tags-list');
    if (!tagsListContainer || !window.tagsData) return;
    
    tagsListContainer.innerHTML = '';
    
    // 按连接数量排序
    const sortedTags = [...window.tagsData].sort((a, b) => (b.connection_count || 0) - (a.connection_count || 0));
    
    sortedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            <div class="tag-info">
                <div class="tag-icon" style="background-color: ${tag.color}">
                    ${getTagTypeIcon(tag.type)}
                </div>
                <div class="tag-details">
                    <h4>${tag.name}</h4>
                    <p class="tag-type">${getTagTypeDisplayName(tag.type)}</p>
                    <p class="tag-connections">${tag.connection_count || 0} 个连接</p>
                    ${tag.description ? `<p class="tag-description">${tag.description}</p>` : ''}
                </div>
            </div>
        `;
        
        tagElement.addEventListener('click', () => {
            highlightNode(tag._id);
            showTagDetails(tag);
        });
        
        tagsListContainer.appendChild(tagElement);
    });
}
```

### 3.3 详情面板更新

#### 3.3.1 人员详情面板

```javascript
function showPersonDetails(person) {
    const detailsPanel = document.getElementById('details-panel');
    if (!detailsPanel) return;
    
    const relatedTags = (person.tags || []).map(tagId => {
        return window.tagsData.find(t => t._id === tagId);
    }).filter(Boolean);
    
    detailsPanel.innerHTML = `
        <div class="details-header">
            <h3>👤 ${person.name}</h3>
            <button class="close-btn" onclick="hideDetailsPanel()">×</button>
        </div>
        <div class="details-content">
            <div class="person-avatar-large">
                ${person.avatar && person.avatar !== 'icon/common.png' 
                    ? `<img src="${person.avatar}" alt="${person.name}" />` 
                    : '<div class="default-avatar-large">👤</div>'
                }
            </div>
            <div class="contact-info">
                ${person.email ? `<p>📧 ${person.email}</p>` : ''}
                ${person.phone ? `<p>📞 ${person.phone}</p>` : ''}
                ${person.description ? `<p class="description">💬 ${person.description}</p>` : ''}
            </div>
            <div class="related-tags">
                <h4>关联标签 (${relatedTags.length})</h4>
                <div class="tags-grid">
                    ${relatedTags.map(tag => `
                        <div class="tag-card" style="border-left: 4px solid ${tag.color}">
                            <span class="tag-icon">${getTagTypeIcon(tag.type)}</span>
                            <span class="tag-name">${tag.name}</span>
                            <span class="tag-type">${getTagTypeDisplayName(tag.type)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="actions">
                <button class="btn-primary" onclick="editPerson('${person._id}')">编辑</button>
                <button class="btn-secondary" onclick="deletePerson('${person._id}')">删除</button>
            </div>
        </div>
    `;
    
    detailsPanel.classList.add('show');
}
```

#### 3.3.2 标签详情面板

```javascript
function showTagDetails(tag) {
    const detailsPanel = document.getElementById('details-panel');
    if (!detailsPanel) return;
    
    // 查找关联的人员
    const relatedPersons = window.personsData.filter(person => 
        person.tags && person.tags.includes(tag._id)
    );
    
    // 查找父标签和子标签
    const parentTags = (tag.parent_tags || []).map(parentId => 
        window.tagsData.find(t => t._id === parentId)
    ).filter(Boolean);
    
    const childTags = (tag.child_tags || []).map(childId => 
        window.tagsData.find(t => t._id === childId)
    ).filter(Boolean);
    
    detailsPanel.innerHTML = `
        <div class="details-header">
            <h3>
                <span class="tag-icon" style="color: ${tag.color}">${getTagTypeIcon(tag.type)}</span>
                ${tag.name}
            </h3>
            <button class="close-btn" onclick="hideDetailsPanel()">×</button>
        </div>
        <div class="details-content">
            <div class="tag-info">
                <p><strong>类型:</strong> ${getTagTypeDisplayName(tag.type)}</p>
                <p><strong>连接数:</strong> ${tag.connection_count || 0}</p>
                ${tag.description ? `<p><strong>描述:</strong> ${tag.description}</p>` : ''}
            </div>
            
            ${parentTags.length > 0 ? `
                <div class="parent-tags">
                    <h4>父标签 (${parentTags.length})</h4>
                    <div class="tags-grid">
                        ${parentTags.map(parentTag => `
                            <div class="tag-card" style="border-left: 4px solid ${parentTag.color}">
                                <span class="tag-icon">${getTagTypeIcon(parentTag.type)}</span>
                                <span class="tag-name">${parentTag.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${childTags.length > 0 ? `
                <div class="child-tags">
                    <h4>子标签 (${childTags.length})</h4>
                    <div class="tags-grid">
                        ${childTags.map(childTag => `
                            <div class="tag-card" style="border-left: 4px solid ${childTag.color}">
                                <span class="tag-icon">${getTagTypeIcon(childTag.type)}</span>
                                <span class="tag-name">${childTag.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="related-persons">
                <h4>关联人员 (${relatedPersons.length})</h4>
                <div class="persons-grid">
                    ${relatedPersons.map(person => `
                        <div class="person-card">
                            <div class="person-avatar-small">
                                ${person.avatar && person.avatar !== 'icon/common.png' 
                                    ? `<img src="${person.avatar}" alt="${person.name}" />` 
                                    : '<div class="default-avatar-small">👤</div>'
                                }
                            </div>
                            <span class="person-name">${person.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="actions">
                <button class="btn-primary" onclick="editTag('${tag._id}')">编辑</button>
                <button class="btn-secondary" onclick="deleteTag('${tag._id}')">删除</button>
            </div>
        </div>
    `;
    
    detailsPanel.classList.add('show');
}
```

## 4. HTML表单更新

### 4.1 添加人员表单

```html
<!-- 在index.html中更新添加人员的表单 -->
<div id="add-person-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>添加新人员</h3>
            <button class="close-btn" onclick="closeModal('add-person-modal')">×</button>
        </div>
        <form id="add-person-form">
            <div class="form-group">
                <label for="person-name">姓名 *</label>
                <input type="text" id="person-name" name="name" required>
            </div>
            <div class="form-group">
                <label for="person-email">邮箱</label>
                <input type="email" id="person-email" name="email">
            </div>
            <div class="form-group">
                <label for="person-phone">电话</label>
                <input type="tel" id="person-phone" name="phone">
            </div>
            <div class="form-group">
                <label for="person-description">描述</label>
                <textarea id="person-description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="person-avatar">头像URL</label>
                <input type="url" id="person-avatar" name="avatar">
            </div>
            <div class="form-group">
                <label for="person-tags">关联标签</label>
                <div id="person-tags-selector" class="tags-selector">
                    <!-- 动态生成标签选择器 -->
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal('add-person-modal')">取消</button>
                <button type="submit" class="btn-primary">添加人员</button>
            </div>
        </form>
    </div>
</div>
```

### 4.2 添加标签表单

```html
<!-- 添加标签的表单 -->
<div id="add-tag-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>添加新标签</h3>
            <button class="close-btn" onclick="closeModal('add-tag-modal')">×</button>
        </div>
        <form id="add-tag-form">
            <div class="form-group">
                <label for="tag-name">标签名称 *</label>
                <input type="text" id="tag-name" name="name" required>
            </div>
            <div class="form-group">
                <label for="tag-type">标签类型 *</label>
                <select id="tag-type" name="type" required>
                    <option value="">请选择类型</option>
                    <option value="company">公司</option>
                    <option value="organization">组织</option>
                    <option value="skill">技能</option>
                    <option value="industry">行业</option>
                    <option value="location">地点</option>
                    <option value="custom">自定义</option>
                </select>
            </div>
            <div class="form-group">
                <label for="tag-description">描述</label>
                <textarea id="tag-description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="tag-color">颜色</label>
                <input type="color" id="tag-color" name="color">
            </div>
            <div class="form-group">
                <label for="tag-parent-tags">父标签</label>
                <div id="tag-parent-tags-selector" class="tags-selector">
                    <!-- 动态生成父标签选择器 -->
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal('add-tag-modal')">取消</button>
                <button type="submit" class="btn-primary">添加标签</button>
            </div>
        </form>
    </div>
</div>
```

## 5. CSS样式更新

### 5.1 新增样式类

```css
/* 标签相关样式 */
.tag-chip {
    display: inline-block;
    padding: 2px 8px;
    margin: 2px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.tag-card {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin: 4px 0;
    background: #f8f9fa;
    border-radius: 6px;
    gap: 8px;
}

.tag-icon {
    font-size: 16px;
    width: 20px;
    text-align: center;
}

.tag-name {
    font-weight: 500;
    flex: 1;
}

.tag-type {
    font-size: 12px;
    color: #6b7280;
}

.tag-connections {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}

/* 人员相关样式 */
.person-avatar-small {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
}

.person-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 16px;
}

.default-avatar-small,
.default-avatar-large {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e5e7eb;
    color: #6b7280;
    font-size: 14px;
}

.default-avatar-large {
    font-size: 32px;
}

/* 网格布局 */
.tags-grid,
.persons-grid {
    display: grid;
    gap: 8px;
    margin-top: 8px;
}

.tags-grid {
    grid-template-columns: 1fr;
}

.persons-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.person-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    text-align: center;
    gap: 8px;
}

.person-name {
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
}

/* 标签选择器 */
.tags-selector {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px;
}

.tag-option {
    display: flex;
    align-items: center;
    padding: 6px;
    margin: 2px 0;
    border-radius: 4px;
    cursor: pointer;
    gap: 8px;
}

.tag-option:hover {
    background: #f3f4f6;
}

.tag-option.selected {
    background: #dbeafe;
    color: #1d4ed8;
}

.tag-option input[type="checkbox"] {
    margin: 0;
}
```

## 6. 实施时间表

### 第1天：数据迁移

* [ ] 运行数据迁移脚本

* [ ] 验证迁移结果

* [ ] 备份原始数据

### 第2天：核心函数重构

* [ ] 修改 `loadData()` 函数

* [ ] 重写 `createGraphData()` 函数

* [ ] 添加辅助函数

### 第3天：渲染逻辑更新

* [ ] 更新节点渲染逻辑

* [ ] 实现动态标签大小

* [ ] 优化颜色方案

### 第4天：UI组件更新

* [ ] 更新列表显示函数

* [ ] 修改详情面板

* [ ] 更新表单组件

### 第5天：测试和优化

* [ ] 功能测试

* [ ] 性能优化

* [ ] 用户体验调优

## 7. 测试检查清单

### 数据完整性

* [ ] 所有人员数据正确迁移

* [ ] 所有标签数据正确合并

* [ ] 关联关系保持完整

* [ ] 标签连接数量准确

### 功能测试

* [ ] 图谱正确显示节点

* [ ] 标签大小动态调整

* [ ] 节点点击和悬停正常

* [ ] 详情面板显示正确

* [ ] 搜索功能正常

* [ ] 添加/编辑/删除功能正常

### 性能测试

* [ ] 大数据量渲染性能

* [ ] 内存使用合理

* [ ] 交互响应及时

### 用户体验

* [ ] 界面布局合理

* [ ] 操作流程顺畅

* [ ] 错误处理友好

* [ ] 移动端适配良好

***

**注意事项：**

1. 在实施过程中，建议逐步进行，每完成一个阶段都要进行测试
2. 保留原始数据备份，以便出现问题时快速回滚
3. 重构过程中注意保持现有功能的稳定性
4. 及时更新相关文档和注释

