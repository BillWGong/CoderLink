const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 读取现有数据
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件 ${filePath} 失败:`, error);
    return [];
  }
}

// 写入数据
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`已更新 ${filePath}`);
  } catch (error) {
    console.error(`写入文件 ${filePath} 失败:`, error);
  }
}

// 24个新联系人的数据
const newContactsData = [
  {
    name: "张三",
    profile: "独立开发者，专注于前端技术和用户体验设计，来自周周黑客松",
    location: "北京",
    company: "北京迈达斯技术",
    organization: "Startup Grind广州",
    phone: "13800138001",
    email: "zhangsan@example.com",
    wechat: "zhangsan_dev",
    tags: ["独立开发者", "前端开发", "React", "TypeScript"]
  },
  {
    name: "李四",
    profile: "全栈开发工程师，擅长React和Node.js开发",
    location: "上海",
    company: "上海科技创新公司",
    organization: "TechCrunch上海",
    phone: "13800138002",
    email: "lisi@example.com",
    wechat: "lisi_fullstack",
    tags: ["全栈开发", "React", "Node.js", "JavaScript"]
  },
  {
    name: "王五",
    profile: "AI算法工程师，专注于机器学习和深度学习",
    location: "深圳",
    company: "深圳AI科技",
    organization: "AI研究院",
    phone: "13800138003",
    email: "wangwu@example.com",
    wechat: "wangwu_ai",
    tags: ["AI开发", "算法工程师", "Python", "机器学习", "深度学习"]
  },
  {
    name: "赵六",
    profile: "产品经理，负责移动应用产品设计和用户体验",
    location: "杭州",
    company: "杭州北冥星眸科技",
    organization: "产品经理联盟",
    phone: "13800138004",
    email: "zhaoliu@example.com",
    wechat: "zhaoliu_pm",
    tags: ["产品经理", "UI/UX设计", "移动开发"]
  },
  {
    name: "孙七",
    profile: "创业公司CEO，专注于区块链技术应用",
    location: "成都",
    company: "成都区块链创新",
    organization: "创业者联盟",
    phone: "13800138005",
    email: "sunqi@example.com",
    wechat: "sunqi_ceo",
    tags: ["CEO", "创始人", "创业者", "区块链"]
  },
  {
    name: "周八",
    profile: "数据科学家，专注于大数据分析和可视化",
    location: "广州",
    company: "广州数据科技",
    organization: "数据科学协会",
    phone: "13800138006",
    email: "zhouba@example.com",
    wechat: "zhouba_data",
    tags: ["数据科学", "Python", "机器学习", "大数据"]
  },
  {
    name: "吴九",
    profile: "后端开发工程师，擅长微服务架构设计",
    location: "南京",
    company: "南京云计算公司",
    organization: "云计算联盟",
    phone: "13800138007",
    email: "wujiu@example.com",
    wechat: "wujiu_backend",
    tags: ["后端开发", "云计算", "Java", "微服务"]
  },
  {
    name: "郑十",
    profile: "移动应用开发者，专注于Flutter跨平台开发",
    location: "西安",
    company: "西安移动科技",
    organization: "移动开发者社区",
    phone: "13800138008",
    email: "zhengshi@example.com",
    wechat: "zhengshi_mobile",
    tags: ["移动开发", "Flutter", "跨平台开发"]
  },
  {
    name: "钱十一",
    profile: "网络安全专家，专注于系统安全和渗透测试",
    location: "武汉",
    company: "武汉安全科技",
    organization: "SecureNexusLab",
    phone: "13800138009",
    email: "qianshiyi@example.com",
    wechat: "qianshiyi_security",
    tags: ["网络安全", "渗透测试", "系统安全"]
  },
  {
    name: "孙十二",
    profile: "DevOps工程师，专注于CI/CD和容器化部署",
    location: "长沙",
    company: "长沙云服务",
    organization: "DevOps社区",
    phone: "13800138010",
    email: "sunshier@example.com",
    wechat: "sunshier_devops",
    tags: ["DevOps", "容器化", "CI/CD"]
  },
  {
    name: "李十三",
    profile: "游戏开发者，专注于Unity 3D游戏引擎开发",
    location: "厦门",
    company: "厦门游戏工作室",
    organization: "游戏开发者联盟",
    phone: "13800138011",
    email: "lishisan@example.com",
    wechat: "lishisan_game",
    tags: ["游戏开发", "Unity", "3D开发"]
  },
  {
    name: "王十四",
    profile: "计算机视觉工程师，专注于图像识别和处理",
    location: "青岛",
    company: "青岛视觉科技",
    organization: "计算机视觉研究所",
    phone: "13800138012",
    email: "wangshisi@example.com",
    wechat: "wangshisi_cv",
    tags: ["计算机视觉", "图像处理", "AI开发", "Python"]
  },
  {
    name: "张十五",
    profile: "自然语言处理专家，专注于对话系统开发",
    location: "大连",
    company: "大连NLP科技",
    organization: "NLP研究院",
    phone: "13800138013",
    email: "zhangshiwu@example.com",
    wechat: "zhangshiwu_nlp",
    tags: ["自然语言处理", "对话系统", "AI开发", "Python"]
  },
  {
    name: "赵十六",
    profile: "前端架构师，专注于Vue.js生态系统开发",
    location: "苏州",
    company: "苏州前端科技",
    organization: "Vue.js中国社区",
    phone: "13800138014",
    email: "zhaoshiliu@example.com",
    wechat: "zhaoshiliu_vue",
    tags: ["前端开发", "Vue", "JavaScript", "架构师"]
  },
  {
    name: "孙十七",
    profile: "实习生，计算机科学专业，对机器学习感兴趣",
    location: "北京",
    company: "北京大学",
    organization: "机器学习实验室",
    phone: "13800138015",
    email: "sunshiqi@example.com",
    wechat: "sunshiqi_intern",
    tags: ["实习生", "学生", "机器学习", "Python"]
  },
  {
    name: "周十八",
    profile: "Swift开发者，专注于iOS应用开发",
    location: "深圳",
    company: "深圳移动应用",
    organization: "iOS开发者社区",
    phone: "13800138016",
    email: "zhoushiba@example.com",
    wechat: "zhoushiba_ios",
    tags: ["移动开发", "Swift", "iOS开发"]
  },
  {
    name: "吴十九",
    profile: "Kotlin开发者，专注于Android应用开发",
    location: "广州",
    company: "广州安卓科技",
    organization: "Android开发者联盟",
    phone: "13800138017",
    email: "wushijiu@example.com",
    wechat: "wushijiu_android",
    tags: ["移动开发", "Kotlin", "Android开发"]
  },
  {
    name: "郑二十",
    profile: "Go语言开发者，专注于高性能后端服务",
    location: "杭州",
    company: "杭州高性能计算",
    organization: "Go语言中国社区",
    phone: "13800138018",
    email: "zhengershi@example.com",
    wechat: "zhengershi_go",
    tags: ["后端开发", "Go", "高性能计算"]
  },
  {
    name: "钱二十一",
    profile: "React Native开发者，专注于跨平台移动应用",
    location: "上海",
    company: "上海跨平台科技",
    organization: "React Native中国",
    phone: "13800138019",
    email: "qianershi@example.com",
    wechat: "qianershi_rn",
    tags: ["移动开发", "React Native", "跨平台开发", "React"]
  },
  {
    name: "孙二十二",
    profile: "ENFP性格的创业者，专注于教育科技领域",
    location: "成都",
    company: "成都教育创新",
    organization: "教育科技联盟",
    phone: "13800138020",
    email: "sunershi@example.com",
    wechat: "sunershi_edu",
    tags: ["创业者", "教育科技", "ENFP"]
  },
  {
    name: "李二十三",
    profile: "INTJ性格的技术专家，专注于系统架构设计",
    location: "南京",
    company: "南京系统架构",
    organization: "系统架构师协会",
    phone: "13800138021",
    email: "liershi@example.com",
    wechat: "liershi_arch",
    tags: ["系统架构", "技术专家", "INTJ"]
  },
  {
    name: "王二十四",
    profile: "TypeScript专家，专注于大型前端项目架构",
    location: "西安",
    company: "西安前端架构",
    organization: "TypeScript中国社区",
    phone: "13800138022",
    email: "wangershi@example.com",
    wechat: "wangershi_ts",
    tags: ["前端开发", "TypeScript", "JavaScript", "架构师"]
  },
  {
    name: "赵二十五",
    profile: "OPPO公司的产品经理，专注于智能手机产品设计",
    location: "深圳",
    company: "OPPO",
    organization: "智能手机产品联盟",
    phone: "13800138023",
    email: "zhaoershi@example.com",
    wechat: "zhaoershi_oppo",
    tags: ["产品经理", "智能手机", "产品设计"]
  },
  {
    name: "孙二十六",
    profile: "AstraCore量子星辰的量子计算研究员",
    location: "北京",
    company: "AstraCore量子星辰",
    organization: "量子计算研究院",
    phone: "13800138024",
    email: "sunershi@example.com",
    wechat: "sunershi_quantum",
    tags: ["量子计算", "研究员", "前沿科技"]
  }
];

// 主函数
function addNewContacts() {
  console.log('开始添加24个新联系人...');
  
  // 读取现有数据
  const contacts = readJsonFile('./data/contacts.json');
  const companies = readJsonFile('./data/companies.json');
  const organizations = readJsonFile('./data/organizations.json');
  const tags = readJsonFile('./data/tags.json');
  
  // 创建标签映射
  const tagMap = {};
  tags.forEach(tag => {
    tagMap[tag.name] = tag;
  });
  
  // 创建公司映射
  const companyMap = {};
  companies.forEach(company => {
    companyMap[company.name] = company;
  });
  
  // 创建组织映射
  const orgMap = {};
  organizations.forEach(org => {
    orgMap[org.name] = org;
  });
  
  // 需要创建的新公司和组织
  const newCompanies = [];
  const newOrganizations = [];
  
  // 处理每个新联系人
  newContactsData.forEach(contactData => {
    // 检查并创建公司
    if (contactData.company && !companyMap[contactData.company]) {
      const newCompany = {
        _id: uuidv4(),
        name: contactData.company,
        description: `${contactData.company}是一家专业的科技公司`,
        organizations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      companies.push(newCompany);
      newCompanies.push(newCompany);
      companyMap[contactData.company] = newCompany;
    }
    
    // 检查并创建组织
    if (contactData.organization && !orgMap[contactData.organization]) {
      const newOrg = {
        _id: uuidv4(),
        name: contactData.organization,
        description: `${contactData.organization}是一个专业的技术组织`,
        createdAt: new Date().toISOString()
      };
      organizations.push(newOrg);
      newOrganizations.push(newOrg);
      orgMap[contactData.organization] = newOrg;
    }
    
    // 创建联系人
    const newContact = {
      _id: uuidv4(),
      name: contactData.name,
      profile: contactData.profile,
      companies: contactData.company ? [{
        _id: companyMap[contactData.company]._id,
        name: companyMap[contactData.company].name
      }] : [],
      organizations: contactData.organization ? [{
        _id: orgMap[contactData.organization]._id,
        name: orgMap[contactData.organization].name
      }] : [],
      phone: contactData.phone,
      email: contactData.email,
      wechat: contactData.wechat,
      avatar: 'icon/common.png',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 添加TRAE-SOLO-Hackathon标签
    if (tagMap['TRAE-SOLO-Hackathon']) {
      newContact.tags.push({
        _id: tagMap['TRAE-SOLO-Hackathon']._id,
        name: tagMap['TRAE-SOLO-Hackathon'].name
      });
    }
    
    // 添加其他标签
    contactData.tags.forEach(tagName => {
      if (tagMap[tagName]) {
        newContact.tags.push({
          _id: tagMap[tagName]._id,
          name: tagMap[tagName].name
        });
      }
    });
    
    contacts.push(newContact);
  });
  
  // 保存更新后的数据
  writeJsonFile('./data/contacts.json', contacts);
  writeJsonFile('./data/companies.json', companies);
  writeJsonFile('./data/organizations.json', organizations);
  
  console.log(`成功添加了 ${newContactsData.length} 个新联系人`);
  console.log(`创建了 ${newCompanies.length} 个新公司`);
  console.log(`创建了 ${newOrganizations.length} 个新组织`);
  console.log('所有联系人都已关联到TRAE-SOLO-Hackathon标签和相应的技能标签');
}

// 运行脚本
if (require.main === module) {
  addNewContacts();
}

module.exports = { addNewContacts };