// 认证相关功能
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('auth_token');
    this.init();
  }

  async init() {
    if (this.token) {
      try {
        await this.getCurrentUser();
      } catch (error) {
        console.error('Token validation failed:', error);
        this.logout();
      }
    }
    this.updateUI();
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
      if (this.token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      this.currentUser = null;
      localStorage.removeItem('auth_token');
      this.updateUI();
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
    const adminPanel = document.getElementById('adminPanel');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (this.isLoggedIn()) {
      // 显示用户信息
      if (loginBtn) loginBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'flex';
      if (userAvatar) userAvatar.src = this.currentUser.avatar_url || '/images/default-avatar.png';
      if (userName) userName.textContent = this.currentUser.display_name || this.currentUser.github_username;
      
      // 显示管理员面板
      if (adminPanel && this.isAdmin()) {
        adminPanel.style.display = 'block';
      }
    } else {
      // 显示登录按钮
      if (loginBtn) loginBtn.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'none';
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

// 处理 GitHub 登录回调
if (window.location.pathname === '/auth/callback') {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  if (token) {
    authManager.setToken(token);
    authManager.init().then(() => {
      // 重定向到主页
      window.location.href = '/';
    });
  } else if (error) {
    console.error('GitHub login error:', error);
    alert('登录失败: ' + error);
    window.location.href = '/';
  }
}

// 导出认证管理器
window.authManager = authManager;