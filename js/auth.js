// 认证相关功能
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.init();
  }

  async init() {
    try {
      const isAuthenticated = await this.checkAuthStatus();
      console.log('认证初始化完成，认证状态:', isAuthenticated);
    } catch (error) {
      console.error('Auth status check failed:', error);
      this.logout();
    }
    this.updateUI();
    this.handleLoginCallback();
  }

  // 检查登录状态（从服务器获取）
  async checkAuthStatus() {
    try {
      const response = await fetch('/auth/status', {
        credentials: 'include' // 包含cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.authenticated) {
          this.token = data.token;
          this.currentUser = data.user;
          // 将token存储到localStorage以便其他请求使用
          localStorage.setItem('auth_token', this.token);
          console.log('认证状态检查成功，用户已登录:', this.currentUser.name || this.currentUser.github_username);
          return true;
        } else {
          this.clearAuthData();
          console.log('认证状态检查：用户未登录');
          return false;
        }
      } else {
        this.clearAuthData();
        console.log('认证状态检查失败：服务器响应错误');
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.clearAuthData();
      return false;
    }
  }

  // 清除认证数据
  clearAuthData() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('auth_token');
  }

  // 处理登录回调
  handleLoginCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const error = urlParams.get('error');

    if (loginSuccess === 'success') {
      // 登录成功，刷新认证状态
      console.log('检测到登录成功回调，重新检查认证状态');
      this.checkAuthStatus().then((isAuthenticated) => {
        console.log('登录回调后认证状态:', isAuthenticated);
        this.updateUI();
        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname);
        // 显示成功消息
        this.showMessage('登录成功！', 'success');
      });
    } else if (error) {
      console.error('Login error:', error);
      this.showMessage('登录失败: ' + error, 'error');
      // 清除URL参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // 显示消息
  showMessage(message, type = 'info') {
    // 创建消息提示
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  // 获取当前用户信息
  async getCurrentUser() {
    if (!this.token) return null;

    try {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        this.currentUser = await response.json();
        return this.currentUser;
      } else {
        throw new Error('Failed to get user info');
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      this.logout();
      return null;
    }
  }

  // GitHub 登录
  loginWithGitHub() {
    window.location.href = '/auth/github';
  }

  // 登出
  async logout() {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include' // 包含cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.updateUI();
      this.showMessage('已退出登录', 'info');
    }
  }

  // 设置令牌
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.token && this.currentUser;
  }

  // 检查是否为管理员
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  // 更新UI
  updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    console.log('更新UI，当前登录状态:', this.isLoggedIn());
    console.log('当前用户:', this.currentUser);
    console.log('当前token:', this.token ? '存在' : '不存在');

    if (this.isLoggedIn()) {
      console.log('显示用户信息界面');
      // 显示用户信息
      if (loginBtn) {
        loginBtn.style.display = 'none';
        console.log('隐藏登录按钮');
      }
      if (userInfo) {
        userInfo.style.display = 'flex';
        console.log('显示用户信息区域');
      }
      if (userAvatar) {
        userAvatar.src = this.currentUser.avatar_url || '/icon/common.png';
        userAvatar.alt = this.currentUser.name || this.currentUser.github_username;
        console.log('设置用户头像:', userAvatar.src);
      }
      if (userName) {
        userName.textContent = this.currentUser.name || this.currentUser.github_username;
        console.log('设置用户名:', userName.textContent);
      }
      
      // 显示管理员面板按钮
      if (adminPanelBtn) {
        adminPanelBtn.style.display = this.isAdmin() ? 'inline-block' : 'none';
      }
    } else {
      console.log('显示登录按钮界面');
      // 显示登录按钮
      if (loginBtn) {
        loginBtn.style.display = 'block';
        console.log('显示登录按钮');
      }
      if (userInfo) {
        userInfo.style.display = 'none';
        console.log('隐藏用户信息区域');
      }
      if (adminPanelBtn) adminPanelBtn.style.display = 'none';
    }
  }

  // 获取认证头
  getAuthHeaders() {
    return this.token ? {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  // 发送认证请求
  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication required');
    }

    return response;
  }

  // 获取用户统计信息
  async getUserStats() {
    if (!this.isLoggedIn()) return null;

    try {
      const response = await this.authenticatedFetch('/api/users/stats');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting user stats:', error);
    }
    return null;
  }

  // 获取用户拥有的联系人
  async getUserContacts() {
    if (!this.isLoggedIn()) return [];

    try {
      const response = await this.authenticatedFetch('/api/users/contacts');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting user contacts:', error);
    }
    return [];
  }

  // 提交认领申请
  async submitClaimRequest(contactId, reason) {
    if (!this.isLoggedIn()) {
      throw new Error('Please login first');
    }

    try {
      const response = await this.authenticatedFetch('/api/users/claim-requests', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: contactId,
          reason: reason
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit claim request');
      }
    } catch (error) {
      console.error('Error submitting claim request:', error);
      throw error;
    }
  }

  // 获取可认领的联系人
  async getClaimableContacts() {
    try {
      const response = await this.authenticatedFetch('/api/users/claimable-contacts');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting claimable contacts:', error);
    }
    return [];
  }
}

// 全局认证管理器实例
const authManager = new AuthManager();

// 导出认证管理器
window.authManager = authManager;