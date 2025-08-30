// 管理员面板
class AdminPanel {
  constructor() {
    this.pendingRequests = [];
    this.allRequests = [];
    this.users = [];
    this.systemStats = {};
    this.currentView = 'pending';
    this.init();
  }

  init() {
    this.createAdminPanel();
    this.bindEvents();
  }

  // 创建管理员面板
  createAdminPanel() {
    const existingPanel = document.getElementById('adminPanel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminPanel';
    adminPanel.className = 'admin-panel hidden';
    adminPanel.innerHTML = `
      <div class="admin-panel-overlay" onclick="adminPanel.closeAdminPanel()"></div>
      <div class="admin-panel-content">
        <div class="admin-panel-header">
          <h2>管理员面板</h2>
          <button class="close-btn" onclick="adminPanel.closeAdminPanel()">&times;</button>
        </div>
        
        <div class="admin-panel-nav">
          <button class="nav-btn active" data-view="pending">待审核申请</button>
          <button class="nav-btn" data-view="requests">所有申请</button>
          <button class="nav-btn" data-view="users">用户管理</button>
          <button class="nav-btn" data-view="stats">系统统计</button>
        </div>
        
        <div class="admin-panel-body">
          <div id="pendingView" class="view-content active">
            <div class="pending-header">
              <h3>待审核认领申请</h3>
              <div class="batch-actions">
                <button onclick="adminPanel.batchApprove()">批量批准</button>
                <button onclick="adminPanel.batchReject()">批量拒绝</button>
                <button onclick="adminPanel.loadPendingRequests()">刷新</button>
              </div>
            </div>
            <div id="pendingRequestsList" class="requests-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
          
          <div id="requestsView" class="view-content">
            <div class="requests-header">
              <h3>所有认领申请</h3>
              <div class="filter-controls">
                <select id="statusFilter">
                  <option value="">所有状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已批准</option>
                  <option value="rejected">已拒绝</option>
                </select>
                <button onclick="adminPanel.loadAllRequests()">刷新</button>
              </div>
            </div>
            <div id="allRequestsList" class="requests-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
          
          <div id="usersView" class="view-content">
            <div class="users-header">
              <h3>用户管理</h3>
              <div class="user-controls">
                <input type="text" id="userSearch" placeholder="搜索用户...">
                <select id="roleFilter">
                  <option value="">所有角色</option>
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
                <button onclick="adminPanel.loadUsers()">刷新</button>
              </div>
            </div>
            <div id="usersList" class="users-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
          
          <div id="statsView" class="view-content">
            <div class="stats-header">
              <h3>系统统计</h3>
              <button onclick="adminPanel.loadSystemStats()">刷新</button>
            </div>
            <div id="systemStatsList" class="stats-grid">
              <p class="loading">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(adminPanel);
  }

  // 绑定事件
  bindEvents() {
    // 导航按钮事件
    document.querySelectorAll('.admin-panel-nav .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });

    // 搜索和过滤事件
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
      userSearch.addEventListener('input', () => {
        this.filterUsers();
      });
    }

    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.filterUsers();
      });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.filterRequests();
      });
    }
  }

  // 切换视图
  switchView(view) {
    this.currentView = view;
    
    // 更新导航按钮状态
    document.querySelectorAll('.admin-panel-nav .nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // 更新视图内容
    document.querySelectorAll('.view-content').forEach(content => {
      content.classList.toggle('active', content.id === view + 'View');
    });
    
    // 加载对应数据
    switch (view) {
      case 'pending':
        this.loadPendingRequests();
        break;
      case 'requests':
        this.loadAllRequests();
        break;
      case 'users':
        this.loadUsers();
        break;
      case 'stats':
        this.loadSystemStats();
        break;
    }
  }

  // 显示管理员面板
  showAdminPanel() {
    if (!authManager.isAdmin()) {
      alert('权限不足');
      return;
    }
    
    const panel = document.getElementById('adminPanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.loadPendingRequests();
    }
  }

  // 关闭管理员面板
  closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }

  // 加载待审核申请
  async loadPendingRequests() {
    const listElement = document.getElementById('pendingRequestsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      const response = await authManager.authenticatedFetch('/api/admin/claim-requests/pending');
      if (response.ok) {
        this.pendingRequests = await response.json();
        this.renderPendingRequests();
      } else {
        throw new Error('Failed to load pending requests');
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染待审核申请
  renderPendingRequests() {
    const listElement = document.getElementById('pendingRequestsList');
    
    if (this.pendingRequests.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无待审核申请</p>';
      return;
    }

    const html = this.pendingRequests.map(request => `
      <div class="request-item" data-id="${request.id}">
        <div class="request-checkbox">
          <input type="checkbox" class="request-select" value="${request.id}">
        </div>
        <div class="request-info">
          <h4>${request.contact_name}</h4>
          <p class="applicant">申请人: ${request.user_name} (${request.user_github})</p>
          <p class="reason">理由: ${request.reason}</p>
          <p class="date">申请时间: ${new Date(request.created_at).toLocaleString()}</p>
        </div>
        <div class="request-actions">
          <button class="approve-btn" onclick="adminPanel.approveRequest('${request.id}')">批准</button>
          <button class="reject-btn" onclick="adminPanel.rejectRequest('${request.id}')">拒绝</button>
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 加载所有申请
  async loadAllRequests() {
    const listElement = document.getElementById('allRequestsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      const response = await authManager.authenticatedFetch('/api/admin/claim-requests');
      if (response.ok) {
        this.allRequests = await response.json();
        this.renderAllRequests();
      } else {
        throw new Error('Failed to load all requests');
      }
    } catch (error) {
      console.error('Error loading all requests:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染所有申请
  renderAllRequests() {
    const listElement = document.getElementById('allRequestsList');
    
    if (this.allRequests.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无申请记录</p>';
      return;
    }

    const html = this.allRequests.map(request => `
      <div class="request-item status-${request.status}">
        <div class="request-info">
          <h4>${request.contact_name}</h4>
          <p class="applicant">申请人: ${request.user_name} (${request.user_github})</p>
          <p class="reason">理由: ${request.reason}</p>
          <p class="date">申请时间: ${new Date(request.created_at).toLocaleString()}</p>
          <span class="status ${request.status}">${this.getStatusText(request.status)}</span>
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 加载用户列表
  async loadUsers() {
    const listElement = document.getElementById('usersList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      const response = await authManager.authenticatedFetch('/api/admin/users');
      if (response.ok) {
        this.users = await response.json();
        this.renderUsers();
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染用户列表
  renderUsers() {
    const listElement = document.getElementById('usersList');
    
    if (this.users.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无用户</p>';
      return;
    }

    const html = this.users.map(user => `
      <div class="user-item">
        <div class="user-avatar">
          <img src="${user.avatar_url || '/images/default-avatar.png'}" alt="${user.display_name}">
        </div>
        <div class="user-info">
          <h4>${user.display_name || user.github_username}</h4>
          <p>GitHub: ${user.github_username}</p>
          <p>邮箱: ${user.email || '未设置'}</p>
          <p>注册时间: ${new Date(user.created_at).toLocaleString()}</p>
        </div>
        <div class="user-role">
          <select onchange="adminPanel.updateUserRole('${user.id}', this.value)">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>普通用户</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
          </select>
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 加载系统统计
  async loadSystemStats() {
    const listElement = document.getElementById('systemStatsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      const response = await authManager.authenticatedFetch('/api/admin/stats');
      if (response.ok) {
        this.systemStats = await response.json();
        this.renderSystemStats();
      } else {
        throw new Error('Failed to load system stats');
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染系统统计
  renderSystemStats() {
    const listElement = document.getElementById('systemStatsList');
    
    const html = `
      <div class="stat-card">
        <h4>用户统计</h4>
        <p>总用户数: ${this.systemStats.total_users || 0}</p>
        <p>管理员数: ${this.systemStats.admin_users || 0}</p>
        <p>普通用户数: ${this.systemStats.regular_users || 0}</p>
      </div>
      <div class="stat-card">
        <h4>联系人统计</h4>
        <p>总联系人数: ${this.systemStats.total_contacts || 0}</p>
        <p>已认领联系人: ${this.systemStats.claimed_contacts || 0}</p>
        <p>未认领联系人: ${this.systemStats.unclaimed_contacts || 0}</p>
      </div>
      <div class="stat-card">
        <h4>申请统计</h4>
        <p>待审核申请: ${this.systemStats.pending_requests || 0}</p>
        <p>已批准申请: ${this.systemStats.approved_requests || 0}</p>
        <p>已拒绝申请: ${this.systemStats.rejected_requests || 0}</p>
      </div>
    `;

    listElement.innerHTML = html;
  }

  // 批准申请
  async approveRequest(requestId) {
    try {
      const response = await authManager.authenticatedFetch(`/api/admin/claim-requests/${requestId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('申请已批准');
        this.loadPendingRequests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve request');
      }
    } catch (error) {
      alert('批准失败: ' + error.message);
    }
  }

  // 拒绝申请
  async rejectRequest(requestId) {
    const reason = prompt('请输入拒绝理由（可选）:');
    
    try {
      const response = await authManager.authenticatedFetch(`/api/admin/claim-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || '' })
      });

      if (response.ok) {
        alert('申请已拒绝');
        this.loadPendingRequests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject request');
      }
    } catch (error) {
      alert('拒绝失败: ' + error.message);
    }
  }

  // 批量批准
  async batchApprove() {
    const selectedIds = this.getSelectedRequestIds();
    if (selectedIds.length === 0) {
      alert('请选择要批准的申请');
      return;
    }

    if (!confirm(`确定要批准 ${selectedIds.length} 个申请吗？`)) {
      return;
    }

    try {
      const response = await authManager.authenticatedFetch('/api/admin/claim-requests/batch-approve', {
        method: 'POST',
        body: JSON.stringify({ request_ids: selectedIds })
      });

      if (response.ok) {
        alert('批量批准成功');
        this.loadPendingRequests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to batch approve');
      }
    } catch (error) {
      alert('批量批准失败: ' + error.message);
    }
  }

  // 批量拒绝
  async batchReject() {
    const selectedIds = this.getSelectedRequestIds();
    if (selectedIds.length === 0) {
      alert('请选择要拒绝的申请');
      return;
    }

    const reason = prompt('请输入拒绝理由（可选）:');
    if (!confirm(`确定要拒绝 ${selectedIds.length} 个申请吗？`)) {
      return;
    }

    try {
      const response = await authManager.authenticatedFetch('/api/admin/claim-requests/batch-reject', {
        method: 'POST',
        body: JSON.stringify({ 
          request_ids: selectedIds,
          reason: reason || ''
        })
      });

      if (response.ok) {
        alert('批量拒绝成功');
        this.loadPendingRequests();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to batch reject');
      }
    } catch (error) {
      alert('批量拒绝失败: ' + error.message);
    }
  }

  // 获取选中的申请ID
  getSelectedRequestIds() {
    const checkboxes = document.querySelectorAll('.request-select:checked');
    return Array.from(checkboxes).map(cb => cb.value);
  }

  // 更新用户角色
  async updateUserRole(userId, newRole) {
    try {
      const response = await authManager.authenticatedFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('用户角色已更新');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }
    } catch (error) {
      alert('更新失败: ' + error.message);
      this.loadUsers(); // 重新加载以恢复原状态
    }
  }

  // 过滤用户
  filterUsers() {
    // 实现用户过滤逻辑
    // 这里可以根据搜索框和角色过滤器来过滤显示的用户
  }

  // 过滤申请
  filterRequests() {
    // 实现申请过滤逻辑
    // 这里可以根据状态过滤器来过滤显示的申请
  }

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待审核',
      'approved': '已批准',
      'rejected': '已拒绝'
    };
    return statusMap[status] || status;
  }
}

// 全局管理员面板实例
const adminPanel = new AdminPanel();
window.adminPanel = adminPanel;