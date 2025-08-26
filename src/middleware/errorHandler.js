// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error(`错误: ${err.message}`);
  
  // 打印堆栈跟踪（仅在开发环境）
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // 发送错误响应
  res.status(err.statusCode || 500).json({
    error: err.message || '服务器内部错误'
  });
};

module.exports = errorHandler; 