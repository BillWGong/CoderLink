// 用户管理界面
class UserManager {
  constructor() {
    this.currentView = 'profile';
    this.claimRequests = [];
    this.userContacts = [];
    this.claimableContacts = [];
    this.init();
  }

  init() {
    this.createUserPanel();
    this.bindEvents();
  }

  // 创建用户面板
  createUserPanel() {
    const existingPanel = document.getElementById('userPanel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const userPanel = document.createElement('div');
    userPanel.id = 'userPanel';
    userPanel.className = 'user-panel hidden';
    userPanel.innerHTML = `
      <div class="user-panel-overlay" onclick="userManager.closeUserPanel()"></div>
      <div class="user-panel-content">
        <div class="user-panel-header">
          <h2>用户中心</h2>
          <button class="close-btn" onclick="userManager.closeUserPanel()">&times;</button>
        </div>
        
        <div class="user-panel-nav">
          <button class="nav-btn active" data-view="profile">个人资料</button>
          <button class="nav-btn" data-view="contacts">我的联系人</button>
          <button class="nav-btn" data-view="claims">认领申请</button>
          <button class="nav-btn" data-view="claimable">可认领联系人</button>
        </div>
        
        <div class="user-panel-body">
          <div id="profileView" class="view-content active">
            <div class="profile-section">
              <div class="profile-avatar">
                <img id="profileAvatar" src="" alt="Avatar">
              </div>
              <div class="profile-info">
                <h3 id="profileName"></h3>
                <p id="profileEmail"></p>
                <p id="profileGithub"></p>
                <p id="profileRole"></p>
              </div>
            </div>
            <div class="stats-section">
              <div class="stat-item">
                <span class="stat-label">拥有联系人:</span>
                <span id="ownedContactsCount">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">认领申请:</span>
                <span id="claimRequestsCount">0</span>
              </div>
            </div>
          </div>
          
          <div id="contactsView" class="view-content">
            <div class="contacts-header">
              <h3>我的联系人</h3>
              <button class="refresh-btn" onclick="userManager.loadUserContacts()">刷新</button>
            </div>
            <div id="userContactsList" class="contacts-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
          
          <div id="claimsView" class="view-content">
            <div class="claims-header">
              <h3>我的认领申请</h3>
              <button class="refresh-btn" onclick="userManager.loadClaimRequests()">刷新</button>
            </div>
            <div id="claimRequestsList" class="claims-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
          
          <div id="claimableView" class="view-content">
            <div class="claimable-header">
              <h3>可认领联系人</h3>
              <button class="refresh-btn" onclick="userManager.loadClaimableContacts()">刷新</button>
            </div>
            <div id="claimableContactsList" class="claimable-list">
              <p class="loading">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(userPanel);
  }

  // 绑定事件
  bindEvents() {
    // 导航按钮事件
    document.querySelectorAll('.user-panel-nav .nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.switchView(view);
      });
    });
  }

  // 切换视图
  switchView(view) {
    this.currentView = view;
    
    // 更新导航按钮状态
    document.querySelectorAll('.user-panel-nav .nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // 更新视图内容
    document.querySelectorAll('.view-content').forEach(content => {
      content.classList.toggle('active', content.id === view + 'View');
    });
    
    // 加载对应数据
    switch (view) {
      case 'profile':
        this.loadProfile();
        break;
      case 'contacts':
        this.loadUserContacts();
        break;
      case 'claims':
        this.loadClaimRequests();
        break;
      case 'claimable':
        this.loadClaimableContacts();
        break;
    }
  }

  // 显示用户面板
  showUserPanel() {
    if (!authManager.isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    const panel = document.getElementById('userPanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.loadProfile();
    }
  }

  // 关闭用户面板
  closeUserPanel() {
    const panel = document.getElementById('userPanel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }

  // 加载用户资料
  async loadProfile() {
    const user = authManager.currentUser;
    if (!user) return;

    document.getElementById('profileAvatar').src = user.avatar_url || '/images/default-avatar.png';
    document.getElementById('profileName').textContent = user.display_name || user.github_username;
    document.getElementById('profileEmail').textContent = user.email || '未设置邮箱';
    document.getElementById('profileGithub').textContent = `GitHub: ${user.github_username}`;
    document.getElementById('profileRole').textContent = `角色: ${user.role === 'admin' ? '管理员' : '普通用户'}`;

    // 加载统计信息
    try {
      const stats = await authManager.getUserStats();
      if (stats) {
        document.getElementById('ownedContactsCount').textContent = stats.owned_contacts || 0;
        document.getElementById('claimRequestsCount').textContent = stats.claim_requests || 0;
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  // 加载用户联系人
  async loadUserContacts() {
    const listElement = document.getElementById('userContactsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      this.userContacts = await authManager.getUserContacts();
      this.renderUserContacts();
    } catch (error) {
      console.error('Error loading user contacts:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染用户联系人
  renderUserContacts() {
    const listElement = document.getElementById('userContactsList');
    
    if (this.userContacts.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无拥有的联系人</p>';
      return;
    }

    const html = this.userContacts.map(contact => `
      <div class="contact-item">
        <div class="contact-avatar">
          <img src="${contact.avatar || '/images/default-avatar.png'}" alt="${contact.name}">
        </div>
        <div class="contact-info">
          <h4>${contact.name}</h4>
          <p>${contact.title || '未设置职位'}</p>
          <p>${contact.company || '未设置公司'}</p>
        </div>
        <div class="contact-actions">
          <button onclick="showContactDetails('${contact.id}')">查看详情</button>
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 加载认领申请
  async loadClaimRequests() {
    const listElement = document.getElementById('claimRequestsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      const response = await authManager.authenticatedFetch('/api/users/claim-requests');
      if (response.ok) {
        this.claimRequests = await response.json();
        this.renderClaimRequests();
      } else {
        throw new Error('Failed to load claim requests');
      }
    } catch (error) {
      console.error('Error loading claim requests:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染认领申请
  renderClaimRequests() {
    const listElement = document.getElementById('claimRequestsList');
    
    if (this.claimRequests.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无认领申请</p>';
      return;
    }

    const html = this.claimRequests.map(request => `
      <div class="claim-item status-${request.status}">
        <div class="claim-info">
          <h4>${request.contact_name}</h4>
          <p class="reason">${request.reason}</p>
          <p class="date">申请时间: ${new Date(request.created_at).toLocaleString()}</p>
          <span class="status ${request.status}">${this.getStatusText(request.status)}</span>
        </div>
        <div class="claim-actions">
          ${request.status === 'pending' ? 
            `<button onclick="userManager.cancelClaimRequest('${request.id}')">撤销申请</button>` : 
            ''
          }
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 加载可认领联系人
  async loadClaimableContacts() {
    const listElement = document.getElementById('claimableContactsList');
    listElement.innerHTML = '<p class="loading">加载中...</p>';

    try {
      this.claimableContacts = await authManager.getClaimableContacts();
      this.renderClaimableContacts();
    } catch (error) {
      console.error('Error loading claimable contacts:', error);
      listElement.innerHTML = '<p class="error">加载失败</p>';
    }
  }

  // 渲染可认领联系人
  renderClaimableContacts() {
    const listElement = document.getElementById('claimableContactsList');
    
    if (this.claimableContacts.length === 0) {
      listElement.innerHTML = '<p class="empty">暂无可认领的联系人</p>';
      return;
    }

    const html = this.claimableContacts.map(contact => `
      <div class="claimable-item">
        <div class="contact-avatar">
          <img src="${contact.avatar || '/images/default-avatar.png'}" alt="${contact.name}">
        </div>
        <div class="contact-info">
          <h4>${contact.name}</h4>
          <p>${contact.title || '未设置职位'}</p>
          <p>${contact.company || '未设置公司'}</p>
        </div>
        <div class="contact-actions">
          <button onclick="userManager.showClaimDialog('${contact.id}', '${contact.name}')">申请认领</button>
        </div>
      </div>
    `).join('');

    listElement.innerHTML = html;
  }

  // 显示认领对话框
  showClaimDialog(contactId, contactName) {
    const reason = prompt(`请输入认领 "${contactName}" 的理由:`);
    if (reason && reason.trim()) {
      this.submitClaimRequest(contactId, reason.trim());
    }
  }

  // 提交认领申请
  async submitClaimRequest(contactId, reason) {
    try {
      await authManager.submitClaimRequest(contactId, reason);
      alert('认领申请已提交，请等待管理员审核');
      this.loadClaimRequests();
      this.loadClaimableContacts();
    } catch (error) {
      alert('提交失败: ' + error.message);
    }
  }

  // 撤销认领申请
  async cancelClaimRequest(requestId) {
    if (!confirm('确定要撤销这个认领申请吗？')) {
      return;
    }

    try {
      const response = await authManager.authenticatedFetch(`/api/users/claim-requests/${requestId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('认领申请已撤销');
        this.loadClaimRequests();
        this.loadClaimableContacts();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel claim request');
      }
    } catch (error) {
      alert('撤销失败: ' + error.message);
    }
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

// 全局用户管理器实例
const userManager = new UserManager();
window.userManager = userManager;