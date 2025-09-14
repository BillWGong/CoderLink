// 用户管理器
class UserManager {
  constructor() {
    this.userPanelVisible = false;
    this.init();
  }

  init() {
    this.createUserPanel();
    this.bindEvents();
  }

  // 创建用户中心面板
  createUserPanel() {
    const userPanelHTML = `
      <div id="userPanel" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">用户中心</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <!-- 用户信息卡片 -->
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body text-center">
                      <img id="userPanelAvatar" class="rounded-circle mb-3" width="80" height="80" src="" alt="用户头像">
                      <h5 id="userPanelName" class="card-title"></h5>
                      <p id="userPanelUsername" class="text-muted"></p>
                      <button class="btn btn-primary btn-sm" onclick="userManager.showEditProfile()">编辑资料</button>
                    </div>
                  </div>
                  
                  <!-- 统计信息 -->
                  <div class="card mt-3">
                    <div class="card-header">
                      <h6 class="mb-0">统计信息</h6>
                    </div>
                    <div class="card-body">
                      <div class="row text-center">
                        <div class="col-6">
                          <div class="h4 mb-0" id="ownedContactsCount">0</div>
                          <small class="text-muted">拥有联系人</small>
                        </div>
                        <div class="col-6">
                          <div class="h4 mb-0" id="pendingClaimsCount">0</div>
                          <small class="text-muted">待审核申请</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 主要内容区 -->
                <div class="col-md-8">
                  <ul class="nav nav-tabs" id="userTabs">
                    <li class="nav-item">
                      <a class="nav-link active" data-bs-toggle="tab" href="#profileTab">个人资料</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" data-bs-toggle="tab" href="#claimsTab">认领记录</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" data-bs-toggle="tab" href="#contactsTab">我的联系人</a>
                    </li>
                  </ul>
                  
                  <div class="tab-content mt-3">
                    <!-- 个人资料标签页 -->
                    <div class="tab-pane fade show active" id="profileTab">
                      <form id="profileForm">
                        <div class="mb-3">
                          <label class="form-label">姓名</label>
                          <input type="text" class="form-control" id="profileName" name="name">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">公司</label>
                          <input type="text" class="form-control" id="profileCompany" name="company">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">位置</label>
                          <input type="text" class="form-control" id="profileLocation" name="location">
                        </div>
                        <div class="mb-3">
                          <label class="form-label">个人简介</label>
                          <textarea class="form-control" id="profileBio" name="bio" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">保存更改</button>
                      </form>
                    </div>
                    
                    <!-- 认领记录标签页 -->
                    <div class="tab-pane fade" id="claimsTab">
                      <div id="claimsList">
                        <div class="text-center py-4">
                          <div class="spinner-border" role="status">
                            <span class="visually-hidden">加载中...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- 我的联系人标签页 -->
                    <div class="tab-pane fade" id="contactsTab">
                      <div id="myContactsList">
                        <div class="text-center py-4">
                          <div class="spinner-border" role="status">
                            <span class="visually-hidden">加载中...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 认领联系人模态框 -->
      <div id="claimModal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">认领联系人</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="claimForm">
                <input type="hidden" id="claimContactId" name="contact_id">
                <div class="mb-3">
                  <label class="form-label">认领理由</label>
                  <textarea class="form-control" id="claimReason" name="reason" rows="3" placeholder="请说明您认领此联系人的理由..."></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
              <button type="button" class="btn btn-primary" onclick="userManager.submitClaim()">提交申请</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 将面板添加到页面
    document.body.insertAdjacentHTML('beforeend', userPanelHTML);
  }

  // 绑定事件
  bindEvents() {
    // 个人资料表单提交
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateProfile();
      });
    }

    // 标签页切换事件
    const userTabs = document.getElementById('userTabs');
    if (userTabs) {
      userTabs.addEventListener('shown.bs.tab', (e) => {
        const targetTab = e.target.getAttribute('href');
        if (targetTab === '#claimsTab') {
          this.loadClaimsHistory();
        } else if (targetTab === '#contactsTab') {
          this.loadMyContacts();
        }
      });
    }
  }

  // 显示用户中心面板
  async showUserPanel() {
    if (!authManager.isLoggedIn()) {
      authManager.showMessage('请先登录', 'warning');
      return;
    }

    try {
      // 加载用户信息
      await this.loadUserProfile();
      
      // 显示模态框
      const userPanel = new bootstrap.Modal(document.getElementById('userPanel'));
      userPanel.show();
      this.userPanelVisible = true;
    } catch (error) {
      console.error('显示用户面板失败:', error);
      authManager.showMessage('加载用户信息失败', 'error');
    }
  }

  // 加载用户资料
  async loadUserProfile() {
    try {
      const response = await authManager.authenticatedFetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        // 更新用户信息显示
        document.getElementById('userPanelAvatar').src = user.avatar_url || '/icon/common.png';
        document.getElementById('userPanelName').textContent = user.name || user.github_username;
        document.getElementById('userPanelUsername').textContent = '@' + user.github_username;
        
        // 更新统计信息
        document.getElementById('ownedContactsCount').textContent = user.stats.owned_contacts;
        document.getElementById('pendingClaimsCount').textContent = user.stats.pending_claims;
        
        // 填充表单
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileCompany').value = user.company || '';
        document.getElementById('profileLocation').value = user.location || '';
        document.getElementById('profileBio').value = user.bio || '';
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
      throw error;
    }
  }

  // 更新个人资料
  async updateProfile() {
    try {
      const formData = new FormData(document.getElementById('profileForm'));
      const profileData = Object.fromEntries(formData);
      
      const response = await authManager.authenticatedFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        const data = await response.json();
        authManager.currentUser = data.user;
        authManager.updateUI();
        authManager.showMessage('个人资料更新成功', 'success');
        
        // 刷新用户面板显示
        await this.loadUserProfile();
      } else {
        const error = await response.json();
        authManager.showMessage('更新失败: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      authManager.showMessage('更新失败', 'error');
    }
  }

  // 加载认领历史
  async loadClaimsHistory() {
    const claimsList = document.getElementById('claimsList');
    claimsList.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
    
    try {
      const response = await authManager.authenticatedFetch('/api/users/claims');
      if (response.ok) {
        const data = await response.json();
        this.renderClaimsHistory(data.claims);
      } else {
        claimsList.innerHTML = '<div class="text-center py-4 text-muted">加载失败</div>';
      }
    } catch (error) {
      console.error('加载认领历史失败:', error);
      claimsList.innerHTML = '<div class="text-center py-4 text-muted">加载失败</div>';
    }
  }

  // 渲染认领历史
  renderClaimsHistory(claims) {
    const claimsList = document.getElementById('claimsList');
    
    if (claims.length === 0) {
      claimsList.innerHTML = '<div class="text-center py-4 text-muted">暂无认领记录</div>';
      return;
    }
    
    const claimsHTML = claims.map(claim => {
      const statusClass = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      }[claim.status] || 'secondary';
      
      const statusText = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
      }[claim.status] || claim.status;
      
      return `
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="card-title">联系人ID: ${claim.contact_id}</h6>
                <p class="card-text text-muted small">${claim.reason || '无理由说明'}</p>
                <small class="text-muted">申请时间: ${new Date(claim.created_at).toLocaleString()}</small>
              </div>
              <span class="badge bg-${statusClass}">${statusText}</span>
            </div>
            ${claim.status === 'pending' ? `
              <button class="btn btn-sm btn-outline-danger mt-2" onclick="userManager.revokeClaim('${claim.id}')">
                撤销申请
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    claimsList.innerHTML = claimsHTML;
  }

  // 加载我的联系人
  async loadMyContacts() {
    const contactsList = document.getElementById('myContactsList');
    contactsList.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div></div>';
    
    try {
      const response = await authManager.authenticatedFetch('/api/users/contacts');
      if (response.ok) {
        const data = await response.json();
        this.renderMyContacts(data.contacts);
      } else {
        contactsList.innerHTML = '<div class="text-center py-4 text-muted">加载失败</div>';
      }
    } catch (error) {
      console.error('加载我的联系人失败:', error);
      contactsList.innerHTML = '<div class="text-center py-4 text-muted">加载失败</div>';
    }
  }

  // 渲染我的联系人
  renderMyContacts(contacts) {
    const contactsList = document.getElementById('myContactsList');
    
    if (contacts.length === 0) {
      contactsList.innerHTML = '<div class="text-center py-4 text-muted">暂无拥有的联系人</div>';
      return;
    }
    
    const contactsHTML = contacts.map(contactId => `
      <div class="card mb-2">
        <div class="card-body">
          <h6 class="card-title">联系人ID: ${contactId}</h6>
          <button class="btn btn-sm btn-primary" onclick="showPersonDetails('${contactId}')">
            查看详情
          </button>
        </div>
      </div>
    `).join('');
    
    contactsList.innerHTML = contactsHTML;
  }

  // 显示认领模态框
  showClaimModal(contactId) {
    if (!authManager.isLoggedIn()) {
      authManager.showMessage('请先登录', 'warning');
      return;
    }
    
    document.getElementById('claimContactId').value = contactId;
    document.getElementById('claimReason').value = '';
    
    const claimModal = new bootstrap.Modal(document.getElementById('claimModal'));
    claimModal.show();
  }

  // 提交认领申请
  async submitClaim() {
    try {
      const contactId = document.getElementById('claimContactId').value;
      const reason = document.getElementById('claimReason').value;
      
      const response = await authManager.authenticatedFetch('/api/users/claims', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: contactId,
          reason: reason
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        authManager.showMessage(data.message, 'success');
        
        // 关闭模态框
        const claimModal = bootstrap.Modal.getInstance(document.getElementById('claimModal'));
        claimModal.hide();
        
        // 如果用户面板打开，刷新认领历史
        if (this.userPanelVisible) {
          this.loadClaimsHistory();
        }
      } else {
        const error = await response.json();
        authManager.showMessage('申请失败: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('提交认领申请失败:', error);
      authManager.showMessage('提交失败', 'error');
    }
  }

  // 撤销认领申请
  async revokeClaim(claimId) {
    if (!confirm('确定要撤销这个认领申请吗？')) {
      return;
    }
    
    try {
      const response = await authManager.authenticatedFetch(`/api/users/claims/${claimId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        authManager.showMessage('申请已撤销', 'success');
        this.loadClaimsHistory();
      } else {
        const error = await response.json();
        authManager.showMessage('撤销失败: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('撤销认领申请失败:', error);
      authManager.showMessage('撤销失败', 'error');
    }
  }

  // 显示编辑资料模式
  showEditProfile() {
    // 切换到个人资料标签页
    const profileTab = document.querySelector('a[href="#profileTab"]');
    if (profileTab) {
      const tab = new bootstrap.Tab(profileTab);
      tab.show();
    }
  }
}

// 全局用户管理器实例
const userManager = new UserManager();

// 导出用户管理器
window.userManager = userManager;