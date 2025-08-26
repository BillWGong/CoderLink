const validator = require('validator');

// 通用验证函数
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName}是必填字段`);
  }
};

const validateEmail = (email) => {
  if (email && !validator.isEmail(email)) {
    throw new Error('邮箱格式不正确');
  }
};

const validatePhone = (phone) => {
  if (phone && !validator.isMobilePhone(phone, 'any')) {
    throw new Error('手机号格式不正确');
  }
};

const validateUrl = (url) => {
  if (url && !validator.isURL(url)) {
    throw new Error('URL格式不正确');
  }
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(str.trim());
};

// 头像验证函数
const validateAvatar = (avatar) => {
  if (avatar) {
    // 检查是否是Base64格式的图片数据
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!base64Pattern.test(avatar)) {
      throw new Error('头像必须是有效的Base64图片格式');
    }
  }
};

// 联系人验证中间件
const validateContact = (req, res, next) => {
  try {
    console.log('[DEBUG] 验证联系人数据:', JSON.stringify(req.body, null, 2));
    
    const { name, email, phone, wechat, description, company, position, tags, avatar } = req.body;
    
    // 必填字段验证
    validateRequired(name, '姓名');
    
    // 格式验证
    if (email) validateEmail(email);
    if (phone) validatePhone(phone);
    if (avatar) validateAvatar(avatar);
    
    // 数据清理
    req.body.name = sanitizeString(name);
    if (email) req.body.email = sanitizeString(email);
    if (phone) req.body.phone = sanitizeString(phone);
    if (wechat) req.body.wechat = sanitizeString(wechat);
    if (description) req.body.description = sanitizeString(description);
    if (company) req.body.company = sanitizeString(company);
    if (position) req.body.position = sanitizeString(position);
    
    // 标签验证
    if (tags && !Array.isArray(tags)) {
      console.log('[DEBUG] 标签格式错误:', tags);
      return res.status(400).json({ error: '标签必须是数组格式' });
    }
    
    console.log('[DEBUG] 联系人验证通过');
    next();
  } catch (error) {
    console.log('[DEBUG] 联系人验证失败:', error.message);
    res.status(400).json({ error: error.message });
  }
};

// 公司验证中间件
const validateCompany = (req, res, next) => {
  try {
    const { name, industry, website, description } = req.body;
    
    // 必填字段验证
    validateRequired(name, '公司名称');
    
    // 格式验证
    if (website) validateUrl(website);
    
    // 数据清理
    req.body.name = sanitizeString(name);
    if (industry) req.body.industry = sanitizeString(industry);
    if (description) req.body.description = sanitizeString(description);
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 组织验证中间件
const validateOrganization = (req, res, next) => {
  try {
    const { name, type, website, description } = req.body;
    
    // 必填字段验证
    validateRequired(name, '组织名称');
    
    // 格式验证
    if (website) validateUrl(website);
    
    // 数据清理
    req.body.name = sanitizeString(name);
    if (type) req.body.type = sanitizeString(type);
    if (description) req.body.description = sanitizeString(description);
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 标签验证中间件
const validateTag = (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    
    // 必填字段验证
    validateRequired(name, '标签名称');
    
    // 颜色格式验证
    if (color && !validator.isHexColor(color)) {
      throw new Error('颜色必须是有效的十六进制颜色代码');
    }
    
    // 数据清理
    req.body.name = sanitizeString(name);
    if (description) req.body.description = sanitizeString(description);
    
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ID参数验证中间件
const validateId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({ error: 'ID参数无效' });
  }
  
  // 清理ID参数
  req.params.id = sanitizeString(id);
  next();
};

// 请求体大小限制验证
const validateRequestSize = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({ error: '请求体过大' });
  }
  
  next();
};

module.exports = {
  validateContact,
  validateCompany,
  validateOrganization,
  validateTag,
  validateId,
  validateRequestSize
};