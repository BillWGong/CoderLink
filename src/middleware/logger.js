// 简单的请求日志中间件
const logger = (req, res, next) => {
  const start = new Date();
  const { method, url } = req;
  
  // 继续处理请求
  next();
  
  // 请求完成后记录日志
  res.on('finish', () => {
    const duration = new Date() - start;
    console.log(`${method} ${url} ${res.statusCode} - ${duration}ms`);
  });
};

module.exports = logger; 