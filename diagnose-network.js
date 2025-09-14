const https = require('https');
const http = require('http');
require('dotenv').config();

console.log('诊断GitHub OAuth网络连接问题...');

// 测试不同的网络配置
const testConfigurations = [
  {
    name: '默认配置',
    options: {}
  },
  {
    name: '增加超时时间',
    options: {
      timeout: 60000
    }
  },
  {
    name: '禁用Keep-Alive',
    options: {
      timeout: 60000,
      agent: new https.Agent({
        keepAlive: false,
        timeout: 60000
      })
    }
  },
  {
    name: '使用自定义DNS',
    options: {
      timeout: 60000,
      family: 4, // 强制使用IPv4
      agent: new https.Agent({
        keepAlive: false,
        timeout: 60000,
        family: 4
      })
    }
  }
];

async function testGitHubConnection(config) {
  return new Promise((resolve) => {
    console.log(`\n测试配置: ${config.name}`);
    
    const postData = `client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=test_code`;
    
    const options = {
      hostname: 'github.com',
      port: 443,
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'CoderLink-Test',
        'Accept': 'application/json'
      },
      ...config.options
    };
    
    const startTime = Date.now();
    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ 连接成功! 状态码: ${res.statusCode}, 耗时: ${duration}ms`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`响应: ${data.substring(0, 200)}...`);
        resolve({ success: true, duration, statusCode: res.statusCode });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`❌ 连接失败! 错误: ${error.message}, 耗时: ${duration}ms`);
      console.log(`错误详情:`, {
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
      resolve({ success: false, error: error.message, duration });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      console.log(`⏰ 请求超时! 耗时: ${duration}ms`);
      req.destroy();
      resolve({ success: false, error: 'timeout', duration });
    });
    
    req.write(postData);
    req.end();
  });
}

async function runDiagnostics() {
  console.log('GitHub OAuth配置:');
  console.log(`Client ID: ${process.env.GITHUB_CLIENT_ID ? '已配置' : '未配置'}`);
  console.log(`Client Secret: ${process.env.GITHUB_CLIENT_SECRET ? '已配置' : '未配置'}`);
  console.log(`Callback URL: ${process.env.GITHUB_CALLBACK_URL}`);
  
  const results = [];
  
  for (const config of testConfigurations) {
    const result = await testGitHubConnection(config);
    results.push({ config: config.name, ...result });
    
    // 等待1秒再测试下一个配置
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== 诊断结果汇总 ===');
  results.forEach(result => {
    const status = result.success ? '✅ 成功' : '❌ 失败';
    console.log(`${result.config}: ${status} (${result.duration}ms)`);
    if (!result.success) {
      console.log(`  错误: ${result.error}`);
    }
  });
  
  console.log('\n=== 建议解决方案 ===');
  const successfulConfigs = results.filter(r => r.success);
  
  if (successfulConfigs.length === 0) {
    console.log('❌ 所有配置都失败了，可能的解决方案:');
    console.log('1. 检查网络连接和防火墙设置');
    console.log('2. 检查是否需要配置代理服务器');
    console.log('3. 尝试使用VPN或更换网络环境');
    console.log('4. 检查DNS设置，尝试使用8.8.8.8或1.1.1.1');
    console.log('5. 联系网络管理员检查企业网络限制');
  } else {
    console.log('✅ 找到可用的配置:');
    successfulConfigs.forEach(config => {
      console.log(`- ${config.config} (${config.duration}ms)`);
    });
    console.log('\n建议在passport.js中使用最快的配置。');
  }
}

runDiagnostics().catch(console.error);