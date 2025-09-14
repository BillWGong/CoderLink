const https = require('https');
const querystring = require('querystring');
require('dotenv').config();

// 测试GitHub OAuth配置
async function testGitHubOAuth() {
  console.log('测试GitHub OAuth配置...');
  
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  
  console.log('配置信息:');
  console.log('Client ID:', clientId ? `${clientId.substring(0, 8)}...` : '未配置');
  console.log('Client Secret:', clientSecret ? `${clientSecret.substring(0, 8)}...` : '未配置');
  console.log('Callback URL:', callbackUrl);
  
  if (!clientId || !clientSecret) {
    console.error('GitHub OAuth配置不完整');
    return;
  }
  
  // 测试GitHub API连接
  try {
    console.log('\n测试GitHub API连接...');
    const response = await fetch('https://api.github.com/rate_limit');
    const data = await response.json();
    console.log('GitHub API连接正常，剩余请求次数:', data.rate.remaining);
  } catch (error) {
    console.error('GitHub API连接失败:', error.message);
  }
  
  // 模拟OAuth token交换请求
  console.log('\n模拟OAuth token交换请求...');
  const testCode = 'test_code_123';
  
  const postData = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code: testCode
  });
  
  const options = {
    hostname: 'github.com',
    port: 443,
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      'User-Agent': 'CoderLink-Test'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log('响应状态码:', res.statusCode);
      console.log('响应头:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('响应内容:', data);
        try {
          const jsonData = JSON.parse(data);
          console.log('解析后的响应:', jsonData);
        } catch (e) {
          console.log('响应不是JSON格式');
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('请求错误:', error);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

testGitHubOAuth().catch(console.error);