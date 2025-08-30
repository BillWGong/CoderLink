const https = require('https');
const http = require('http');
const { URL } = require('url');

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
    
    if (!this.apiKey) {
      console.warn('DeepSeek API key not found in environment variables');
    }
  }

  async makeRequest(url, options) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const requestModule = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = requestModule.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async chatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const requestBody = JSON.stringify({
      model: options.model || 'deepseek-chat',
      messages: messages,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.7,
      stream: false
    });

    try {
      const response = await this.makeRequest(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: requestBody
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }

  async intelligentSearch(query, contextData) {
    const systemPrompt = `你是一个智能联系人搜索助手。你需要根据用户的查询，在提供的联系人数据中找到最相关的信息。\n\n联系人数据结构包括：\n- persons: 个人联系人，包含姓名、简介、标签、公司、组织等信息\n- companies: 公司信息\n- organizations: 组织信息\n- tags: 标签信息\n\n请根据用户查询返回最相关的联系人信息，并提供简洁明了的回答。如果没有找到相关信息，请礼貌地说明。`;

    // 优化数据，只发送关键信息以避免超出token限制
    const optimizedData = {
      persons: contextData.persons.map(person => ({
        name: person.name,
        profile: person.profile ? person.profile.substring(0, 200) : '',
        tags: person.tags ? person.tags.slice(0, 5) : [],
        companies: person.companies ? person.companies.slice(0, 3).map(c => c.name || c) : [],
        organizations: person.organizations ? person.organizations.slice(0, 3).map(o => o.name || o) : []
      })),
      companies: contextData.companies.map(company => ({
        name: company.name,
        description: company.description ? company.description.substring(0, 100) : ''
      })),
      organizations: contextData.organizations.map(org => ({
        name: org.name,
        description: org.description ? org.description.substring(0, 100) : ''
      })),
      tags: contextData.tags.map(tag => ({
        name: tag.name,
        description: tag.description ? tag.description.substring(0, 50) : ''
      }))
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user', 
        content: `查询：${query}\n\n联系人数据摘要：${JSON.stringify(optimizedData, null, 2)}`
      }
    ];

    return await this.chatCompletion(messages, {
      max_tokens: 800,
      temperature: 0.3
    });
  }

  async analyzeRelationships(contactData) {
    const systemPrompt = `你是一个关系网络分析专家。请分析提供的联系人数据，识别其中的关系模式、共同点和潜在连接。\n\n请从以下角度进行分析：\n1. 共同的公司或组织\n2. 相似的技能标签或兴趣\n3. 可能的合作机会\n4. 网络中的关键节点\n\n请提供结构化的分析结果。`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `请分析以下联系人数据：\n${JSON.stringify(contactData, null, 2)}`
      }
    ];

    return await this.chatCompletion(messages, {
      max_tokens: 1200,
      temperature: 0.4
    });
  }

  // 搜索类型识别
  classifySearchType(query) {
    const personKeywords = ['人', '开发者', '工程师', '设计师', '产品经理', '程序员', '架构师', '技术', '员工', '同事'];
    const orgKeywords = ['公司', '组织', '团队', '社区', '机构', '企业', '工作室', '实验室', '部门'];
    
    const hasPersonKeywords = personKeywords.some(keyword => 
      query.includes(keyword)
    );
    const hasOrgKeywords = orgKeywords.some(keyword => 
      query.includes(keyword)
    );
    
    if (hasPersonKeywords && !hasOrgKeywords) return 'person';
    if (hasOrgKeywords && !hasPersonKeywords) return 'organization';
    return 'mixed';
  }

  // 格式化人物卡片
  formatPersonCard(person) {
    return {
      type: 'person',
      id: person._id || person.id,
      name: person.name || '未知姓名',
      avatar: person.avatar || '/icon/common.png',
      title: person.title || person.position || '未知职位',
      company: person.company || (person.companies && person.companies[0] ? 
        (typeof person.companies[0] === 'string' ? person.companies[0] : person.companies[0].name) : '未知公司'),
      tags: person.tags ? person.tags.slice(0, 5).map(tag => 
        typeof tag === 'string' ? tag : tag.name
      ) : [],
      contact: {
        email: person.email,
        phone: person.phone
      }
    };
  }

  // 格式化组织卡片
  formatOrganizationCard(org, relatedPersons = []) {
    return {
      type: 'organization',
      id: org._id || org.id,
      name: org.name || '未知组织',
      icon: org.icon || '/icon/common.png',
      category: org.category || org.type || '未分类',
      description: org.description || '',
      location: org.location || null,
      relatedPersons: relatedPersons.map(person => this.formatPersonCard(person))
    };
  }

  // 修复不完整的JSON
  repairIncompleteJSON(jsonStr) {
    try {
      // 如果JSON已经完整，直接返回
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (error) {
      console.log('尝试修复不完整的JSON:', jsonStr);
      
      let repairedJson = jsonStr.trim();
      
      // 处理常见的不完整情况
      
      // 1. 缺少结束大括号
      if (repairedJson.startsWith('{') && !repairedJson.endsWith('}')) {
        // 计算需要的结束括号数量
        const openBraces = (repairedJson.match(/\{/g) || []).length;
        const closeBraces = (repairedJson.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        for (let i = 0; i < missingBraces; i++) {
          repairedJson += '}';
        }
      }
      
      // 2. 处理不完整的字段值
      // 如果message字段后面没有值，补充默认值
      if (repairedJson.includes('"message":') && !repairedJson.includes('"message":"')) {
        repairedJson = repairedJson.replace(/"message":\s*$/, '"message": ""');
        repairedJson = repairedJson.replace(/"message":\s*,/, '"message": "",');
        repairedJson = repairedJson.replace(/"message":\s*}/, '"message": ""}');
      }
      
      // 3. 处理缺少引号的情况
      repairedJson = repairedJson.replace(/"message":\s*([^"\[\{][^,}]*)/, '"message": "$1"');
      
      // 4. 处理末尾缺少引号的情况
      repairedJson = repairedJson.replace(/"message":\s*"([^"]*?)$/, '"message": "$1"');
      
      // 5. 确保所有必需字段都存在
      try {
        const parsed = JSON.parse(repairedJson);
        
        // 补充缺失的字段
        if (!parsed.type) parsed.type = 'empty';
        if (!parsed.persons) parsed.persons = [];
        if (!parsed.organizations) parsed.organizations = [];
        if (!parsed.message) parsed.message = '';
        
        return JSON.stringify(parsed);
      } catch (stillError) {
        console.log('JSON修复失败，使用备用方案');
        return this.createFallbackJSON();
      }
    }
  }

  // 从损坏的JSON中提取信息
  extractFromBrokenJSON(brokenJson) {
    try {
      const result = {
        type: 'empty',
        persons: [],
        organizations: [],
        message: '搜索处理出错，请重试'
      };
      
      // 尝试提取type字段
      const typeMatch = brokenJson.match(/"type":\s*"([^"]*)"/i);
      if (typeMatch) {
        result.type = typeMatch[1];
      }
      
      // 尝试提取persons数组
      const personsMatch = brokenJson.match(/"persons":\s*\[([^\]]*?)\]/i);
      if (personsMatch) {
        try {
          const personsStr = '[' + personsMatch[1] + ']';
          const persons = JSON.parse(personsStr);
          result.persons = persons.filter(p => typeof p === 'string');
        } catch (e) {
          // 提取失败，保持空数组
        }
      }
      
      // 尝试提取organizations数组
      const orgsMatch = brokenJson.match(/"organizations":\s*\[([^\]]*?)\]/i);
      if (orgsMatch) {
        try {
          const orgsStr = '[' + orgsMatch[1] + ']';
          const orgs = JSON.parse(orgsStr);
          result.organizations = orgs.filter(o => typeof o === 'string');
        } catch (e) {
          // 提取失败，保持空数组
        }
      }
      
      // 尝试提取message字段
      const messageMatch = brokenJson.match(/"message":\s*"([^"]*)"/i);
      if (messageMatch) {
        result.message = messageMatch[1];
      }
      
      return result;
    } catch (error) {
      console.error('从损坏JSON提取信息失败:', error);
      return null;
    }
  }

  // 创建备用JSON
  createFallbackJSON() {
    return JSON.stringify({
      type: 'empty',
      persons: [],
      organizations: [],
      message: '搜索处理出错，请重试'
    });
  }

  // AI卡片搜索
  async cardSearch(query, contextData, options = {}) {
    const { searchType = 'auto', limit = 10 } = options;
    
    // 确定搜索类型
    const actualSearchType = searchType === 'auto' ? this.classifySearchType(query) : searchType;
    
    const systemPrompt = `你是一个智能联系人搜索助手。根据用户查询，返回最相关的联系人信息。

【重要】你必须严格按照以下JSON格式返回结果：

{
  "type": "person",
  "persons": ["人物ID1", "人物ID2"],
  "organizations": [],
  "message": ""
}

【格式要求】
1. 只返回纯JSON，不要添加任何解释、注释或markdown格式
2. 所有字段都必须存在：type, persons, organizations, message
3. 字符串值必须用双引号包围
4. message字段必须有值，即使是空字符串也要写成 "message": ""
5. 数组字段即使为空也要写成 []

【搜索规则】
- 找到人物：{"type": "person", "persons": ["ID1"], "organizations": [], "message": ""}
- 找到组织：{"type": "organization", "persons": [], "organizations": ["ID1"], "message": ""}
- 都找到：{"type": "mixed", "persons": ["ID1"], "organizations": ["ID2"], "message": ""}
- 都没找到：{"type": "empty", "persons": [], "organizations": [], "message": "没有找到相关结果"}

【示例输出】
{"type": "person", "persons": ["12345"], "organizations": [], "message": ""}

请确保JSON格式完整且可解析。`

    // 优化数据，只发送关键信息
    const optimizedData = {
      persons: contextData.persons.map(person => ({
        id: person._id || person.id,
        name: person.name,
        profile: person.profile ? person.profile.substring(0, 200) : '',
        tags: person.tags ? person.tags.slice(0, 5) : [],
        companies: person.companies ? person.companies.slice(0, 3).map(c => c.name || c) : [],
        organizations: person.organizations ? person.organizations.slice(0, 3).map(o => o.name || o) : []
      })),
      organizations: contextData.organizations.map(org => ({
        id: org._id || org.id,
        name: org.name,
        description: org.description ? org.description.substring(0, 100) : '',
        category: org.category || org.type
      }))
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user', 
        content: `查询：${query}\n搜索类型：${actualSearchType}\n\n数据：${JSON.stringify(optimizedData, null, 2)}`
      }
    ];

    try {
      const aiResponse = await this.chatCompletion(messages, {
        max_tokens: 500,
        temperature: 0.2
      });

      // 解析AI返回的JSON
      let searchResult;
      try {
        // 清理AI返回的内容，移除可能的markdown格式
        let cleanResponse = aiResponse.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
        }
        
        // 尝试修复不完整的JSON
        cleanResponse = this.repairIncompleteJSON(cleanResponse);
        
        searchResult = JSON.parse(cleanResponse);
        
        // 验证必需字段
        if (!searchResult.type) {
          searchResult.type = 'empty';
        }
        if (!searchResult.persons) {
          searchResult.persons = [];
        }
        if (!searchResult.organizations) {
          searchResult.organizations = [];
        }
        if (!searchResult.message) {
          searchResult.message = searchResult.type === 'empty' ? '没有找到相关结果' : '';
        }
        
      } catch (parseError) {
        console.error('AI返回格式错误:', aiResponse);
        console.error('解析错误:', parseError.message);
        
        // 尝试从错误的JSON中提取有用信息
        const fallbackResult = this.extractFromBrokenJSON(aiResponse);
        if (fallbackResult) {
          return fallbackResult;
        }
        
        return {
          type: 'empty',
          persons: [],
          organizations: [],
          message: '搜索处理出错，请重试'
        };
      }

      // 根据ID获取完整的卡片数据
      const result = {
        type: searchResult.type || 'empty',
        persons: [],
        organizations: [],
        message: searchResult.message || ''
      };

      // 处理人物卡片
      if (searchResult.persons && Array.isArray(searchResult.persons)) {
        result.persons = searchResult.persons
          .slice(0, limit)
          .map(personId => {
            const person = contextData.persons.find(p => (p._id || p.id) === personId);
            return person ? this.formatPersonCard(person) : null;
          })
          .filter(Boolean);
      }

      // 处理组织卡片
      if (searchResult.organizations && Array.isArray(searchResult.organizations)) {
        result.organizations = searchResult.organizations
          .slice(0, limit)
          .map(orgId => {
            const org = contextData.organizations.find(o => (o._id || o.id) === orgId);
            if (!org) return null;
            
            // 查找相关人员
            const relatedPersons = contextData.persons.filter(person => {
              if (!person.organizations) return false;
              return person.organizations.some(personOrg => {
                const orgName = typeof personOrg === 'string' ? personOrg : personOrg.name;
                return orgName === org.name;
              });
            }).slice(0, 3); // 最多显示3个相关人员
            
            return this.formatOrganizationCard(org, relatedPersons);
          })
          .filter(Boolean);
      }

      return result;
    } catch (error) {
      console.error('AI卡片搜索失败:', error);
      return {
        type: 'empty',
        persons: [],
        organizations: [],
        message: '搜索服务暂时不可用，请稍后重试'
      };
    }
  }

  async generateInsights(query, data) {
    const systemPrompt = `你是一个数据洞察分析师。请根据用户的问题和提供的数据，生成有价值的洞察和建议。\n\n请提供：\n1. 数据分析结果\n2. 关键发现\n3. 实用建议\n4. 后续行动建议`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `问题：${query}\n\n数据：${JSON.stringify(data, null, 2)}`
      }
    ];

    return await this.chatCompletion(messages, {
      max_tokens: 1000,
      temperature: 0.5
    });
  }
}

// 创建单例实例
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new DeepSeekService();
  }
  return instance;
}

module.exports = { DeepSeekService, getInstance };