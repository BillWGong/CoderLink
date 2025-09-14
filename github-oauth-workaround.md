# GitHub OAuth 网络连接问题解决方案

## 问题诊断

经过详细的网络诊断，发现无法连接到GitHub的OAuth端点 `20.205.243.166:443`，所有连接尝试都超时（ETIMEDOUT）。

## 根本原因

1. **网络限制**: 当前网络环境可能阻止了对GitHub OAuth端点的访问
2. **防火墙设置**: 企业防火墙或本地防火墙可能阻止了HTTPS连接
3. **DNS解析问题**: 可能存在DNS解析或路由问题
4. **地理位置限制**: 某些地区可能对GitHub的访问有限制

## 解决方案

### 方案1: 网络环境调整（推荐）

1. **使用VPN**: 连接到支持GitHub访问的VPN服务器
2. **更换网络**: 尝试使用手机热点或其他网络环境
3. **配置代理**: 如果有可用的HTTP/HTTPS代理，可以配置使用

### 方案2: 修改DNS设置

```bash
# Windows系统修改DNS
nslookup github.com 8.8.8.8
nslookup github.com 1.1.1.1
```

在网络设置中将DNS服务器改为：
- 主DNS: 8.8.8.8
- 备用DNS: 1.1.1.1

### 方案3: 使用代理配置

如果有可用的代理服务器，可以在passport.js中添加代理配置：

```javascript
const HttpsProxyAgent = require('https-proxy-agent');

// 在passport.js中添加
const proxyAgent = new HttpsProxyAgent('http://proxy-server:port');

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL,
  // 添加代理配置
  customHeaders: {
    'User-Agent': 'CoderLink-App'
  },
  // 如果需要，可以添加自定义的请求配置
}, async (accessToken, refreshToken, profile, done) => {
  // ... 现有代码
}));
```

### 方案4: 临时禁用GitHub登录

如果暂时无法解决网络问题，可以临时禁用GitHub登录功能：

1. 在前端隐藏GitHub登录按钮
2. 添加提示信息说明网络问题
3. 提供其他登录方式（如果有）

### 方案5: 使用GitHub App替代OAuth App

GitHub App相比OAuth App有更好的网络兼容性，可以考虑迁移到GitHub App。

## 测试网络连接

可以使用以下命令测试网络连接：

```bash
# 测试GitHub连接
ping github.com
telnet github.com 443
curl -I https://github.com

# 测试OAuth端点
curl -v https://github.com/login/oauth/access_token
```

## 当前状态

- ✅ GitHub OAuth配置正确
- ✅ 服务器运行正常
- ❌ 网络连接到GitHub OAuth端点失败
- ❌ 所有网络配置测试都超时

## 建议行动

1. **立即**: 尝试使用VPN或更换网络环境
2. **短期**: 配置代理服务器（如果可用）
3. **长期**: 联系网络管理员解决网络限制问题

## 验证修复

修复网络问题后，可以运行以下命令验证：

```bash
node test-github-oauth.js
node diagnose-network.js
```

如果看到连接成功的消息，说明问题已解决。