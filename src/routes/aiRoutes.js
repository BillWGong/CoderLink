const express = require('express');
const router = express.Router();
const { getInstance: getDeepSeekService } = require('../services/deepseekService');
const { getInstance: getDataManager } = require('../services/dataManager');
const { getInstance: getAuthMiddleware } = require('../middleware/auth');

const deepSeekService = getDeepSeekService();
const dataManager = getDataManager();
const authMiddleware = getAuthMiddleware();

// AI聊天接口
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        code: 'MISSING_MESSAGE'
      });
    }

    // 获取用户可访问的数据作为上下文
    const contextData = {
      persons: await dataManager.getData('persons'),
      companies: await dataManager.getData('companies'),
      organizations: await dataManager.getData('organizations'),
      tags: await dataManager.getData('tags')
    };

    const response = await deepSeekService.intelligentSearch(message, contextData);
    
    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'AI_CHAT_FAILED'
    });
  }
});

// 智能搜索接口
router.post('/search', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { query, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        code: 'MISSING_QUERY'
      });
    }

    // 获取数据
    let contextData = {
      persons: await dataManager.getData('persons'),
      companies: await dataManager.getData('companies'),
      organizations: await dataManager.getData('organizations'),
      tags: await dataManager.getData('tags')
    };

    // 应用过滤器
    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        contextData.persons = contextData.persons.filter(person => 
          person.tags && person.tags.some(tag => 
            filters.tags.includes(tag.name || tag)
          )
        );
      }
      
      if (filters.companies && filters.companies.length > 0) {
        contextData.persons = contextData.persons.filter(person => 
          person.companies && person.companies.some(company => 
            filters.companies.includes(company.name || company)
          )
        );
      }
    }

    const searchResult = await deepSeekService.intelligentSearch(query, contextData);
    
    res.json({
      success: true,
      data: {
        result: searchResult,
        query: query,
        filters: filters,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'AI_SEARCH_FAILED'
    });
  }
});

// 关系分析接口
router.post('/analyze-relationships', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { contactIds } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Contact IDs array is required',
        code: 'MISSING_CONTACT_IDS'
      });
    }

    // 获取指定联系人的数据
    const allPersons = await dataManager.getData('persons');
    const selectedContacts = allPersons.filter(person => 
      contactIds.includes(person._id || person.id)
    );

    if (selectedContacts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No contacts found with provided IDs',
        code: 'CONTACTS_NOT_FOUND'
      });
    }

    const analysis = await deepSeekService.analyzeRelationships(selectedContacts);
    
    res.json({
      success: true,
      data: {
        analysis: analysis,
        contactCount: selectedContacts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Relationship analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'RELATIONSHIP_ANALYSIS_FAILED'
    });
  }
});

// AI卡片搜索接口
router.post('/card-search', async (req, res) => {
  try {
    const { query, searchType, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        code: 'MISSING_QUERY'
      });
    }

    // 获取用户可访问的数据作为上下文
    const contextData = {
      persons: await dataManager.getData('persons'),
      companies: await dataManager.getData('companies'),
      organizations: await dataManager.getData('organizations'),
      tags: await dataManager.getData('tags')
    };

    const cardSearchResult = await deepSeekService.cardSearch(query, contextData, { searchType, limit });
    
    res.json({
      success: true,
      data: cardSearchResult
    });
  } catch (error) {
    console.error('AI card search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'AI_CARD_SEARCH_FAILED'
    });
  }
});

// 数据洞察接口
router.post('/insights', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { question, dataType } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
        code: 'MISSING_QUESTION'
      });
    }

    // 根据数据类型获取相应数据
    let data = {};
    if (dataType) {
      data[dataType] = await dataManager.getData(dataType);
    } else {
      // 获取所有数据
      data = {
        persons: await dataManager.getData('persons'),
        companies: await dataManager.getData('companies'),
        organizations: await dataManager.getData('organizations'),
        tags: await dataManager.getData('tags')
      };
    }

    const insights = await deepSeekService.generateInsights(question, data);
    
    res.json({
      success: true,
      data: {
        insights: insights,
        question: question,
        dataType: dataType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'INSIGHTS_GENERATION_FAILED'
    });
  }
});

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'DeepSeek AI Service',
      status: 'running',
      apiKeyConfigured: !!process.env.DEEPSEEK_API_KEY,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;