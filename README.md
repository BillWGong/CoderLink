# 联系人知识图谱管理系统

一个基于现代Web技术栈的智能联系人管理系统，集成知识图谱可视化、标签管理和关系网络分析功能，为个人和团队提供强大的人脉关系管理工具。

## 🚀 核心特性

### 知识图谱可视化
- **3D力导向布局**：基于D3.js的物理引擎，提供流畅的图谱交互体验
- **智能节点布局**：组织居中、公司环绕、联系人就近分布的层次化布局
- **实时交互反馈**：悬停高亮、点击详情、拖拽调整位置
- **多层级关系展示**：清晰展示联系人-公司-组织的复杂关系网络

### 标签管理系统
- **层次化标签结构**：支持父子标签关系，构建知识分类体系
- **智能标签关联**：自动计算标签连接数量和关系强度
- **标签可视化**：标签作为独立节点参与图谱渲染
- **批量标签操作**：支持标签的创建、编辑、删除和关联管理

### 多维关系管理
- **多重关系支持**：联系人可同时属于多个公司或组织
- **动态关系编辑**：直观的标签式界面管理复杂关系
- **关系强度分析**：基于连接数量计算节点重要性
- **关系路径追踪**：可视化展示任意两个节点间的关系路径

### 响应式用户体验
- **自适应界面**：支持桌面端和移动端的完美适配
- **智能详情面板**：动态显示节点信息，仅展示有效内容
- **高性能渲染**：优化的DOM操作和内存管理
- **无障碍设计**：支持键盘导航和屏幕阅读器

## 📁 项目架构

### 目录结构
```
.
├── src/                   # 后端源代码
│   ├── controllers/       # 控制器层
│   │   ├── contactController.js
│   │   ├── companyController.js
│   │   ├── organizationController.js
│   │   └── tagController.js
│   ├── models/           # 数据模型层
│   │   ├── contactModel.js
│   │   ├── companyModel.js
│   │   ├── organizationModel.js
│   │   └── tagModel.js
│   ├── routes/           # 路由层
│   │   ├── contactRoutes.js
│   │   ├── companyRoutes.js
│   │   ├── organizationRoutes.js
│   │   ├── tagRoutes.js
│   │   └── dataRoutes.js
│   ├── services/         # 业务逻辑层
│   │   └── dataManager.js
│   ├── middleware/       # 中间件
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── validation.js
│   ├── utils/           # 工具函数
│   │   ├── dataStorage.js
│   │   └── generateData.js
│   └── server.js        # 服务器入口
├── js/                  # 前端JavaScript
│   ├── components/      # 组件模块
│   ├── services/        # 前端服务
│   ├── utils/          # 前端工具
│   └── script.js       # 主脚本文件
├── css/                # 样式文件
│   ├── styles.css      # 主样式表
│   ├── mobile.css      # 移动端样式
│   └── avatarUploader.css
├── data/               # 数据存储
│   ├── contacts.json   # 联系人数据
│   ├── companies.json  # 公司数据
│   ├── organizations.json # 组织数据
│   ├── tags.json       # 标签数据
│   └── backup/         # 数据备份
├── icon/               # 头像资源
├── scripts/            # 工具脚本
│   ├── diversify-tag-colors.js
│   └── unify-tags.js
├── .trae/              # 项目文档
│   └── documents/
├── index.html          # 前端主页面
├── package.json        # 项目配置
├── vercel.json         # 部署配置
└── README.md           # 项目说明
```

### 架构设计
- **分层架构**：采用经典的MVC架构模式，清晰分离关注点
- **模块化设计**：前后端代码模块化组织，便于维护和扩展
- **RESTful API**：标准化的API接口设计，支持CRUD操作
- **数据驱动**：基于JSON文件的轻量级数据存储方案
- **响应式前端**：原生JavaScript + CSS实现的响应式界面

## 🛠️ 技术栈

### 后端技术
- **运行环境**：Node.js 22.11.0
- **Web框架**：Express.js 4.18.2
- **数据验证**：Validator.js 13.15.15
- **唯一标识**：UUID 9.0.0
- **开发工具**：Nodemon 3.1.10

### 前端技术
- **核心技术**：原生HTML5 + CSS3 + ES6+ JavaScript
- **图谱可视化**：D3.js + Force-Graph库
- **响应式设计**：CSS Grid + Flexbox
- **移动端适配**：媒体查询 + 触摸事件优化
- **性能优化**：DOM虚拟化 + 事件委托

### 数据存储
- **存储方案**：基于文件系统的JSON数据存储
- **数据备份**：自动备份机制，支持数据恢复
- **数据同步**：内存缓存 + 异步持久化
- **数据迁移**：版本化数据结构，支持平滑升级

### 开发工具
- **包管理**：NPM
- **版本控制**：Git
- **部署平台**：Vercel
- **代码规范**：ESLint + Prettier（规划中）
- **测试框架**：Jest（规划中）

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- NPM >= 8.0.0
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd connectMeTrae
```

2. **安装依赖**
```bash
npm install
```

3. **生成测试数据**（可选）
```bash
npm run generate
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

### 生产部署

```bash
# 启动生产服务器
npm start

# 或使用PM2进行进程管理
npm install -g pm2
pm2 start src/server.js --name "contacts-management"
```

### 可用脚本

- `npm start` - 启动生产服务器
- `npm run dev` - 启动开发服务器（支持热重载）
- `npm run generate` - 生成测试数据
- `npm run generate-data` - 生成数据（备用命令）

## 🌐 知识图谱特性

### 可视化引擎
- **力导向图布局**：基于D3.js的物理模拟算法，自动优化节点分布
- **多层次渲染**：支持节点、连线、标签的分层渲染，提升性能
- **动态缩放**：无级缩放支持，从宏观网络到微观细节
- **智能布局**：根据节点重要性和连接密度自动调整布局

### 交互体验
- **节点操作**：拖拽、点击、悬停等多种交互方式
- **实时搜索**：支持模糊搜索，实时高亮匹配节点
- **关系追踪**：点击节点显示关联路径，支持多度关系探索
- **视图控制**：平移、缩放、重置等视图操作

### 性能优化
- **虚拟化渲染**：大规模数据集的高效渲染
- **增量更新**：仅更新变化的节点，减少重绘开销
- **内存管理**：智能缓存机制，防止内存泄漏
- **响应式适配**：自适应不同屏幕尺寸和设备性能

### 数据分析
- **网络指标**：计算节点中心性、聚类系数等网络特征
- **关系挖掘**：自动发现潜在关联和社区结构
- **趋势分析**：时间序列数据的动态可视化
- **导出功能**：支持图片、数据等多种格式导出

## 📡 API 接口

### 联系人管理
- `GET /api/contacts` - 获取所有联系人列表
- `GET /api/contacts/:id` - 获取指定联系人详细信息
- `POST /api/contacts` - 创建新联系人
- `PUT /api/contacts/:id` - 更新联系人信息
- `DELETE /api/contacts/:id` - 删除指定联系人

### 人员管理
- `GET /api/persons` - 获取所有人员列表
- `GET /api/persons/:id` - 获取指定人员详细信息
- `POST /api/persons` - 创建新人员档案
- `PUT /api/persons/:id` - 更新人员信息
- `DELETE /api/persons/:id` - 删除指定人员

### 标签管理
- `GET /api/tags` - 获取所有标签列表
- `GET /api/tags/:id` - 获取指定标签详细信息
- `POST /api/tags` - 创建新标签
- `PUT /api/tags/:id` - 更新标签信息
- `DELETE /api/tags/:id` - 删除指定标签

### 数据统计
- `GET /api/stats/overview` - 获取系统概览统计
- `GET /api/stats/relationships` - 获取关系网络统计
- `GET /api/stats/tags` - 获取标签使用统计

### 搜索功能
- `GET /api/search?q={query}` - 全局搜索
- `GET /api/search/contacts?q={query}` - 搜索联系人
- `GET /api/search/persons?q={query}` - 搜索人员
- `GET /api/search/tags?q={query}` - 搜索标签

### 公司

- `GET /api/companies` - 获取所有公司
- `GET /api/companies/:id` - 获取单个公司
- `POST /api/companies` - 创建公司
- `PUT /api/companies/:id` - 更新公司
- `DELETE /api/companies/:id` - 删除公司

### 组织

- `GET /api/organizations` - 获取所有组织
- `GET /api/organizations/:id` - 获取单个组织
- `POST /api/organizations` - 创建组织
- `PUT /api/organizations/:id` - 更新组织
- `DELETE /api/organizations/:id` - 删除组织

## 📊 数据模型

### Contact（联系人/组织）
```json
{
  "id": "string",
  "name": "string",
  "type": "organization|company|person|freelancer",
  "description": "string",
  "connections": ["contact_id1", "contact_id2"],
  "connection_count": "number",
  "tags": ["tag_id1", "tag_id2"],
  "metadata": {
    "industry": "string",
    "location": "string",
    "website": "string"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Person（人员档案）
```json
{
  "id": "string",
  "name": "string",
  "position": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "tags": ["tag_id1", "tag_id2"],
  "social_links": {
    "linkedin": "string",
    "twitter": "string",
    "github": "string"
  },
  "skills": ["skill1", "skill2"],
  "notes": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Tag（标签）
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "color": "string",
  "category": "string",
  "connections": ["contact_id1", "person_id1"],
  "connection_count": "number",
  "usage_stats": {
    "total_usage": "number",
    "last_used": "timestamp"
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## 🏷️ 标签管理系统

### 核心功能
- **智能分类**：支持多维度标签分类，如行业、技能、项目等
- **动态关联**：标签与联系人、人员的多对多关联关系
- **可视化展示**：标签在知识图谱中以独特节点形式展现
- **统计分析**：实时统计标签使用频率和关联度

### 标签特性
- **颜色编码**：支持自定义标签颜色，便于视觉识别
- **层级结构**：支持父子标签关系，构建标签体系
- **搜索过滤**：基于标签的快速搜索和过滤功能
- **批量操作**：支持批量添加、删除和修改标签

### 应用场景
- **行业分类**：按行业对联系人进行分组管理
- **技能标记**：标记人员的专业技能和能力
- **项目关联**：将相关人员按项目进行标签化管理
- **关系追踪**：通过标签快速识别特定类型的关系网络

## 🎨 界面优化

### 响应式设计
- **多设备适配**：完美支持桌面端、平板和移动端
- **弹性布局**：基于CSS Grid和Flexbox的现代布局
- **触摸优化**：针对移动设备的触摸交互优化
- **性能优先**：轻量级设计，快速加载和响应

### 用户体验
- **流畅动画**：60fps的平滑动画效果
- **直观操作**：符合用户习惯的交互设计
- **即时反馈**：操作结果的实时视觉反馈
- **智能布局**：自适应的图谱布局算法

### 视觉设计
- **现代风格**：简洁清爽的现代化界面
- **色彩体系**：科学的色彩搭配和对比度
- **图标系统**：统一的图标设计语言
- **字体优化**：多语言字体的最佳显示效果

### 交互优化
- **响应式详情面板**：只显示存在的信息，空信息优雅处理
- **关系编辑优化**：标签式多选界面，直观显示已选择的关系
- **模态框交互**：添加过渡动画和遮罩层，防止误操作
- **强大的搜索功能**：实时过滤联系人、公司和组织

## 📱 移动端适配

### 触摸交互
- **多点触控**：支持双指缩放、旋转等手势操作
- **触摸拖拽**：流畅的节点拖拽体验
- **手势识别**：智能识别点击、长按、滑动等手势
- **触觉反馈**：适当的震动反馈增强交互体验

### 界面适配
- **响应式导航**：移动端专用的侧滑导航菜单
- **自适应布局**：根据屏幕方向自动调整布局
- **触摸友好**：按钮和交互区域符合移动端标准
- **性能优化**：针对移动设备的渲染优化

### 移动端特性
- **离线支持**：本地数据缓存，支持离线浏览
- **快速加载**：优化的资源加载策略
- **省电模式**：智能降低动画频率节省电量
- **网络适配**：根据网络状况调整数据加载策略

## ⚡ 性能优化

### 前端优化
- **虚拟化渲染**：大数据集的高效渲染技术
- **懒加载**：按需加载图片和组件
- **代码分割**：模块化加载减少初始包大小
- **缓存策略**：智能的浏览器缓存管理

### 后端优化
- **内存管理**：高效的数据结构和内存使用
- **异步处理**：非阻塞的I/O操作
- **数据压缩**：API响应的gzip压缩
- **连接池**：数据库连接的复用机制

### 网络优化
- **HTTP/2支持**：多路复用提升传输效率
- **CDN加速**：静态资源的全球分发
- **API优化**：减少请求次数和数据传输量
- **实时同步**：WebSocket的高效数据同步

## 🏗️ 架构改进

### 代码质量
- **模块化设计**：清晰的模块边界和职责分离
- **错误处理**：完善的异常捕获和错误恢复机制
- **日志系统**：结构化的日志记录和监控
- **测试覆盖**：单元测试和集成测试的完整覆盖

### 可维护性
- **代码规范**：统一的编码标准和最佳实践
- **文档完善**：详细的API文档和开发指南
- **版本控制**：规范的Git工作流和版本管理
- **持续集成**：自动化的构建、测试和部署流程

### 扩展性
- **插件架构**：支持功能扩展的插件系统
- **配置管理**：灵活的配置文件和环境变量
- **国际化**：多语言支持的i18n框架
- **主题系统**：可定制的UI主题和样式

## ✨ 项目特色

### 技术亮点
- **原生技术栈**：无框架依赖，纯原生Web技术实现
- **知识图谱**：基于D3.js的专业级图谱可视化
- **实时交互**：毫秒级响应的用户交互体验
- **数据驱动**：完整的数据模型和关系管理

### 创新功能
- **智能布局**：自适应的图谱布局算法
- **多维关系**：支持复杂的多对多关系网络
- **标签系统**：灵活的分类和标记机制
- **响应式设计**：跨设备的一致体验

### 业务价值
- **关系洞察**：可视化展现复杂的人际关系网络
- **高效管理**：提升联系人管理的效率和准确性
- **数据分析**：深入的关系网络分析和统计
- **扩展性强**：支持大规模数据和复杂业务场景

## 🔮 未来规划

### 短期目标（1-3个月）
- [ ] 完善测试框架和单元测试覆盖
- [ ] 实现数据导入导出功能
- [ ] 添加高级搜索和过滤功能
- [ ] 优化移动端用户体验

### 中期目标（3-6个月）
- [ ] 集成第三方数据源（LinkedIn, GitHub等）
- [ ] 实现实时协作功能
- [ ] 添加数据分析和报表功能
- [ ] 支持自定义字段和表单

### 长期目标（6-12个月）
- [ ] 微服务架构重构
- [ ] AI驱动的关系推荐
- [ ] 企业级权限管理
- [ ] 云端部署和SaaS化

## 🤝 贡献指南

### 开发环境
1. Fork 项目到你的GitHub账户
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建Pull Request

### 代码规范
- 遵循ESLint配置的代码风格
- 编写清晰的注释和文档
- 确保所有测试通过
- 遵循语义化版本控制

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

- 项目主页：[GitHub Repository](https://github.com/your-username/connectMeTrae)
- 问题反馈：[Issues](https://github.com/your-username/connectMeTrae/issues)
- 功能建议：[Discussions](https://github.com/your-username/connectMeTrae/discussions)

---

**ConnectMeTrae** - 让关系网络可视化，让连接更有价值 🌟