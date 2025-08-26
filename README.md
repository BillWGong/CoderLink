# 联系人知识图谱管理系统

一个集成知识图谱可视化的联系人管理系统，用于管理和展示联系人、公司和组织之间的多维关系网络。

## 功能特点

- **知识图谱可视化**：直观展示联系人、公司和组织之间的关系网络
- **多重关系支持**：联系人可同时属于多个公司或组织，公司可属于多个组织
- **强大的物理引擎**：基于D3力导向布局，提供流畅的图谱交互体验
- **响应式界面**：详情面板动态显示节点信息，仅展示有效内容
- **高级筛选**：支持按类型和关系进行搜索和筛选
- **便捷的数据管理**：添加、编辑、删除联系人、公司和组织
- **直观的关系编辑**：使用标签式界面方便地管理多重关系
- **适应性布局**：节点位置智能计算，避免重叠
- **可视化交互优化**：悬停、选中高亮，点击查看详情
- **全面移动端适配**：响应式设计，在各种设备上提供良好的用户体验

## 项目结构

```
.
├── css/                   # CSS样式文件
│   └── styles.css         # 主样式表
├── data/                  # 数据文件存储目录
├── icon/                  # 图标资源
├── js/                    # JavaScript文件
│   └── script.js          # 主脚本文件  
├── node_modules/          # 依赖包
├── src/                   # 后端源代码
├── index.html             # 前端主页面
├── api.js                 # API接口配置
├── dataStorage.js         # 数据存储逻辑
├── generateData.js        # 测试数据生成脚本
├── models.js              # 数据模型定义
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 技术栈

- **前端**：原生HTML + CSS + JavaScript
- **图谱可视化**：D3.js + Force-Graph库
- **后端**：Node.js + Express
- **数据存储**：基于文件系统的JSON数据存储

## 快速开始

### 安装依赖

```bash
npm install
```

### 生成测试数据

```bash
npm run generate
```

### 启动开发服务器

```bash
npm run dev
```

### 启动生产服务器

```bash
npm start
```

## 知识图谱特性

- **节点分类**：组织(大)、公司(中)、联系人/自由职业者(小)
- **智能布局**：
  - 组织节点位于中心
  - 关联公司围绕组织节点分布
  - 联系人节点靠近其所属公司/组织
  - 自由职业者(无关联)在外围中等距离处布局
- **边界约束**：节点不会飘得太远，保持视图美观
- **物理引擎优化**：针对不同类型节点调整排斥力、引力和碰撞参数
- **交互增强**：
  - 悬停显示节点标签
  - 点击显示详细信息及关系
  - 高亮显示关联连接

## API 接口

### 联系人

- `GET /api/contacts` - 获取所有联系人
- `GET /api/contacts/:id` - 获取单个联系人
- `POST /api/contacts` - 创建联系人
- `PUT /api/contacts/:id` - 更新联系人
- `DELETE /api/contacts/:id` - 删除联系人

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

## 数据模型

### 联系人

```javascript
{
  _id: String,
  name: String,
  profile: String,
  companies: [             // 支持多公司关联
    {
      _id: String,
      name: String
    }
  ],
  organizations: [         // 支持多组织关联
    {
      _id: String,
      name: String
    }
  ],
  phone: String,
  email: String,
  wechat: String,
  avatar: String,
  createdAt: String,
  updatedAt: String
}
```

### 公司

```javascript
{
  _id: String,
  name: String,
  description: String,
  organizations: [         // 支持多组织关联
    {
      _id: String,
      name: String
    }
  ],
  createdAt: String,
  updatedAt: String
}
```

### 组织

```javascript
{
  _id: String,
  name: String,
  description: String,
  createdAt: String,
  updatedAt: String
}
```

## 界面优化

- **响应式详情面板**：只显示存在的信息，空信息优雅处理
- **关系编辑优化**：标签式多选界面，直观显示已选择的关系
- **模态框交互**：添加过渡动画和遮罩层，防止误操作
- **强大的搜索功能**：实时过滤联系人、公司和组织

## 移动端适配

- **响应式布局**：在不同尺寸的设备上自动调整界面布局
- **触摸优化**：增大点击区域，优化触摸交互
- **图谱优化**：
  - 调整节点大小和碰撞检测，便于触摸操作
  - 优化物理引擎参数，提供更稳定的移动体验
  - 自动调整视图缩放级别
- **侧边栏切换**：移动端上可折叠侧边栏，节省空间
- **垂直分区布局**：移动端上采用垂直分区布局，方便浏览和操作
- **尺寸优化**：表单元素、按钮和交互元素尺寸优化，提高可用性
- **横竖屏适配**：针对不同的屏幕方向提供优化的布局

## 许可

MIT 