document.addEventListener('DOMContentLoaded', function() {
    let contacts = [];
    let persons = []; // 新的人员数据结构
    let tags = []; // 添加标签数据
    let graph = null;
    let currentTab = 'contacts';
    let graphData = { nodes: [], links: [] };
    let selectedNode = null;
    let hoverNode = null; // 添加悬停节点跟踪
    
    // 初始化新的头像上传组件
    let avatarUploader = null;
    let fileValidator = null;
    let imageProcessor = null;
    let securityEnhancer = null;
    let performanceOptimizer = null;
    let accessibilityEnhancer = null;
    
    // localStorage数据保存和加载函数
    function saveDataToStorage() {
        try {
            const data = {
                persons: persons,
                contacts: contacts, // 保持向后兼容
                tags: tags
            };
            localStorage.setItem('connectMeData', JSON.stringify(data));
            console.log('数据已保存到localStorage');
        } catch (error) {
            console.error('保存数据到localStorage失败:', error);
        }
    }
    
    function loadDataFromStorage() {
        try {
            const data = localStorage.getItem('connectMeData');
            if (data) {
                const parsedData = JSON.parse(data);
                // 优先使用新的persons数据，如果没有则使用旧的contacts数据
                persons = parsedData.persons || parsedData.contacts || [];
                contacts = persons; // 保持向后兼容
                tags = parsedData.tags || [];
                console.log('从localStorage加载数据成功');
                return true;
            }
        } catch (error) {
            console.error('从localStorage加载数据失败:', error);
        }
        return false;
    }
    
    // 清除旧的localStorage数据
    function clearOldLocalStorageData() {
        const oldKeys = ['contacts_data', 'tags_data'];
        let clearedAny = false;
        
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                clearedAny = true;
                console.log(`已清除旧的localStorage数据: ${key}`);
            }
        });
        
        if (clearedAny) {
            console.log('已清除所有旧的localStorage数据，将重新加载新数据结构');
        }
    }
    
    // 添加延迟刷新标志，确保状态变化后及时重绘
    let needsRefresh = false;
    
    // 移动端导航功能
    function setupMobileNav() {
      const mobileNavToggle = document.getElementById('mobileNavToggle');
      const sidebar = document.querySelector('.sidebar');
      
      if (mobileNavToggle && sidebar) {
        mobileNavToggle.addEventListener('click', function() {
          sidebar.classList.toggle('active');
          // 如果侧边栏变为可见，添加背景点击事件来关闭它
          if (sidebar.classList.contains('active')) {
            setTimeout(() => {
              document.addEventListener('click', closeSidebarOnClickOutside);
            }, 10);
          }
        });
      }
      
      // 点击侧边栏外部区域关闭侧边栏
      function closeSidebarOnClickOutside(event) {
        if (!sidebar.contains(event.target) && event.target !== mobileNavToggle) {
          sidebar.classList.remove('active');
          document.removeEventListener('click', closeSidebarOnClickOutside);
        }
      }
      
      // 监听窗口大小变化，在大屏幕上重置侧边栏状态
      window.addEventListener('resize', function() {
        if (window.innerWidth > 767) {
          sidebar.classList.remove('active');
          sidebar.style.display = '';
        }
      });
    }
    
    // 添加移动端检测
    function isMobileDevice() {
      return window.innerWidth <= 767;
    }
    
    // 修改刷新方法，确保用正确的方式刷新
    function setupRefreshLoop() {
      let lastRefreshTime = 0;
      const refreshThrottle = 200; // 限制刷新频率为200ms
      
      setInterval(() => {
        const now = Date.now();
        if (needsRefresh && graph && (now - lastRefreshTime) > refreshThrottle) {
          // 使用requestAnimationFrame优化渲染性能
          requestAnimationFrame(() => {
            const currentData = graph.graphData();
            graph.graphData(currentData);
            needsRefresh = false;
            lastRefreshTime = now;
          });
        }
      }, 100);
    }
    
    // 显示详情面板
    function showDetailPanel(node) {
      console.log("显示详情面板调用成功", node.name);
      
      // 调试日志：输出完整的 node 对象信息
      console.log('=== 调试信息 ===');
      console.log('完整 node 对象:', node);
      console.log('node.description:', node.description);
      console.log('node.profile:', node.profile);
      console.log('node.type:', node.type);
      console.log('===============');
      
      const panel = document.getElementById('detailPanel');
      const title = document.getElementById('detailTitle');
      const subtitle = document.getElementById('detailSubtitle');
      const content = document.getElementById('detailContent');
      
      // 检查必要的DOM元素是否存在
      if (!panel) {
        console.error('detailPanel 元素不存在');
        return;
      }
      if (!title) {
        console.error('detailTitle 元素不存在');
        return;
      }
      if (!subtitle) {
        console.error('detailSubtitle 元素不存在');
        return;
      }
      if (!content) {
        console.error('detailContent 元素不存在');
        return;
      }
      
      console.log('所有DOM元素检查通过，开始显示面板');
      
      // 设置面板标题和内容
      title.textContent = node.name;
      
      if (node.type === 'tag') { // 处理标签节点
        subtitle.textContent = '标签';
        
        // 查找使用该标签的联系人
        const taggedContacts = persons.filter(contact => {
          return contact.tags && contact.tags.some(t => t._id === node._id);
        });
        
        // 获取关联标签信息
        const parentTags = node.parent_tags || [];
        const childTags = node.child_tags || [];
        const relatedTags = [...parentTags, ...childTags];
        
        content.innerHTML = `
          <div class="detail-section">
            <div class="detail-section-title">标签描述</div>
            ${node.description ? `<p>${node.description}</p>` : `<div class="empty-info"><span class="text-muted">暂无描述</span></div>`}
          </div>
          
          ${taggedContacts.length > 0 ? `
            <div class="detail-section">
              <div class="detail-section-title">关联联系人 (${taggedContacts.length})</div>
              <div class="detail-connections">
                ${taggedContacts.map(contact => `
                  <div class="connection-tag" data-id="${contact._id}" data-type="contact">
                    ${contact.name}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${relatedTags.length > 0 ? `
            <div class="detail-section">
              <div class="detail-section-title">关联标签 (${relatedTags.length})</div>
              <div class="detail-connections">
                ${parentTags.map(tag => `
                  <div class="connection-tag" data-id="${tag._id}" data-type="tag" title="父标签">
                    ↑ ${tag.name}
                  </div>
                `).join('')}
                ${childTags.map(tag => `
                  <div class="connection-tag" data-id="${tag._id}" data-type="tag" title="子标签">
                    ↓ ${tag.name}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
      } else if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') { // 处理联系人、自由职业者和人员
        subtitle.textContent = '联系人'
        
        // 检查用户是否已登录以及是否可以认领此联系人
        const isLoggedIn = window.authManager && window.authManager.isLoggedIn();
        const canClaim = isLoggedIn; // 简化逻辑，登录用户都可以尝试认领
        
        content.innerHTML = `
          <img src="${node.avatar || 'https://via.placeholder.com/80'}" alt="${node.name}" class="detail-avatar">
          
          ${canClaim ? `
          <div class="detail-section">
            <div class="detail-section-title">操作</div>
            <div class="detail-actions">
              <button class="btn btn-sm btn-success" onclick="userManager.showClaimModal('${node._id}')">
                <i class="bi bi-person-check"></i> 认领此联系人
              </button>
            </div>
          </div>
          ` : ''}
          
          <div class="detail-section">
            <div class="detail-section-title">联系方式</div>
            <div class="contact-info">
              ${node.phone ? `
              <div class="contact-info-item">
                <i class="bi bi-telephone"></i>
                <span>${node.phone}</span>
              </div>
              ` : ''}
              ${node.email ? `
              <div class="contact-info-item">
                <i class="bi bi-envelope"></i>
                <span>${node.email}</span>
              </div>
              ` : ''}
              ${node.wechat ? `
              <div class="contact-info-item">
                <i class="bi bi-wechat"></i>
                <span>${node.wechat}</span>
              </div>
              ` : ''}
              ${!node.phone && !node.email && !node.wechat ? `
              <div class="contact-info-item empty-info">
                <span class="text-muted">暂无联系方式</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          ${node.description ? `
          <div class="detail-section">
            <div class="detail-section-title">个人简介</div>
            <p>${node.description.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}
          
          ${node.tags && node.tags.length > 0 ? `
            <div class="detail-section">
              <div class="detail-section-title">标签</div>
              <div class="detail-connections">
                ${node.tags.map(tag => `
                  <div class="connection-tag" data-id="${tag._id}" data-type="tag">
                    ${tag.name}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;
      }
      
      // 添加连接标签的点击事件
      setTimeout(() => {
        panel.querySelectorAll('.connection-tag').forEach(tag => {
          tag.addEventListener('click', () => {
            const id = tag.getAttribute('data-id');
            const type = tag.getAttribute('data-type');
            
            // 查找对应的节点
            let clickedNode = graphData.nodes.find(n => n._id === id && n.type === type);
            
            // 如果找不到节点，尝试其他类型查找
            if (!clickedNode && type === 'contact') {
              clickedNode = graphData.nodes.find(n => n._id === id && n.type === 'freelancer');
              if (!clickedNode) {
                clickedNode = graphData.nodes.find(n => n._id === id && n.type === 'person');
              }
            }
            
            if (clickedNode && graph) {
              // 聚焦到该节点
              graph.centerAt(clickedNode.x, clickedNode.y, 1000);
              graph.zoom(2, 1000);
              
              // 显示该节点的详情
              showDetailPanel(clickedNode);
              selectedNode = clickedNode;
            }
          });
        });
        
        // 添加编辑按钮点击事件
        const editButton = document.getElementById('editButton');
        if (editButton) {
          // 移除之前的事件监听器，避免重复绑定
          editButton.onclick = null;
          
          // 使用立即执行函数创建独立的作用域，避免闭包变量污染
          editButton.onclick = ((currentNode) => {
            return () => {
              console.log('=== 编辑按钮点击调试 ===');
              console.log('当前节点:', currentNode);
              console.log('节点类型:', currentNode.type);
              console.log('节点ID:', currentNode._id);
              console.log('========================');
              
              // 从graphData.nodes中重新获取最新的节点数据，确保数据一致性
              const latestNode = graphData.nodes.find(n => n._id === currentNode._id && n.type === currentNode.type);
              if (latestNode) {
                console.log('使用最新节点数据:', latestNode);
                showEditModal(latestNode);
              } else {
                console.warn('未找到对应的节点数据，使用当前节点:', currentNode);
                showEditModal(currentNode);
              }
            };
          })(node);
        }
        
        // 添加删除按钮点击事件
        const deleteButton = document.getElementById('deleteButton');
        if (deleteButton) {
          deleteButton.onclick = () => {
            if (confirm(`确定要删除 ${node.name} 吗？`)) {
              deleteNode(node);
            }
          };
        }
      }, 10);
      
      // 显示面板
      panel.style.display = 'block';  
      panel.style.opacity = '1';
      panel.classList.add('visible');
      
      console.log('详情面板已显示');
      
      // 调试：检查 graphData.nodes 中的数据结构
      console.log('=== graphData.nodes 调试 ===');
      const personNodes = graphData.nodes.filter(n => n.type === 'person');
      console.log('所有人员节点:', personNodes);
      if (personNodes.length > 0) {
        console.log('第一个人员节点示例:', personNodes[0]);
        console.log('第一个人员节点的 description:', personNodes[0].description);
      }
      console.log('========================');
    }
    
    // 专门为编辑模式设置的标签页事件监听器
    function setupModalTabsForEdit() {
      console.log('设置编辑模式下的标签页事件监听器');
      const modalTabs = document.querySelectorAll('.modal-nav-tab');
      
      modalTabs.forEach(tab => {
        // 移除旧的事件监听器
        tab.removeEventListener('click', tab._modalTabClickHandler);
        
        // 创建编辑模式专用的事件处理函数
        tab._modalTabClickHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // 编辑模式下完全禁用标签页切换
          if (window.isEditMode) {
            console.log('编辑模式下禁用标签页切换，当前节点类型:', window.currentEditingNode?.type);
            return false;
          }
        };
        
        // 添加新的事件监听器
        tab.addEventListener('click', tab._modalTabClickHandler);
      });
    }
    
    // 显示编辑模态框
    function showEditModal(node) {
      console.log('=== showEditModal 调试开始 ===');
      console.log('编辑节点:', node);
      
      try {
        // 获取模态框元素
        const modal = document.getElementById('addModal');
        console.log('模态框元素:', modal);
        
        // 首先重置模态框状态，确保干净的初始状态
        console.log('重置模态框状态...');
        
        // 清除编辑模式标记
        window.isEditMode = false;
        window.currentEditingNode = null;
        
        // 重置所有标签页状态
        document.querySelectorAll('.modal-nav-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        // 隐藏所有表单
        document.getElementById('contactForm').style.display = 'none';
        document.getElementById('tagForm').style.display = 'none';
        
        // 移除模态框的编辑模式CSS类
        modal.classList.remove('edit-mode');
        
        // 判断节点类型（只声明一次）
        const isContactType = node.type === 'contact' || node.type === 'person' || node.type === 'freelancer';
        
        // 设置模态框标题为编辑模式
        document.getElementById('modalTitle').textContent = `编辑${isContactType ? '联系人' : '标签'}`;
      
        // 移动端处理：禁止背景滚动
        if (isMobileDevice()) {
          document.body.style.overflow = 'hidden';
        }
        
        // 根据节点类型选择相应的标签页
        const tabSelector = isContactType ? '[data-form="contactForm"]' : '[data-form="tagForm"]';
        
        console.log('节点类型判断:', {
          nodeType: node.type,
          isContactType: isContactType,
          tabSelector: tabSelector
        });
        
        // 激活对应的标签页
        const targetTab = document.querySelector(tabSelector);
        if (targetTab) {
          targetTab.classList.add('active');
        }
        
        // 显示对应的表单
        const formId = isContactType ? 'contactForm' : 'tagForm';
        document.getElementById(formId).style.display = 'block';
        
        console.log('表单显示:', {
          formId: formId,
          contactFormDisplay: document.getElementById('contactForm').style.display,
          tagFormDisplay: document.getElementById('tagForm').style.display
        });
        
        // 填充表单数据
        if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') {
          document.getElementById('contactName').value = node.name || '';
          document.getElementById('contactPhone').value = node.phone || '';
          document.getElementById('contactEmail').value = node.email || '';
          document.getElementById('contactWechat').value = node.wechat || '';
          document.getElementById('contactProfile').value = node.description || '';
          
          // 显示当前头像预览
          const avatarPreview = document.getElementById('avatarPreview');
          const previewImage = document.getElementById('previewImage');
          if (avatarPreview && previewImage) {
            if (node.avatar) {
              previewImage.src = node.avatar;
              avatarPreview.style.display = 'block';
            } else {
              previewImage.src = '';
              avatarPreview.style.display = 'none';
            }
          }
          
          // 加载标签选项
          loadTagOptions('contactTags');
          
          // 使用setTimeout确保loadTagOptions完成后再设置选中状态和UI
          setTimeout(() => {
            // 设置选中的标签
            const tagsSelect = document.getElementById('contactTags');
            // 清除所有已选择的选项
            Array.from(tagsSelect.options).forEach(option => {
              option.selected = false;
            });
            
            if (node.tags && node.tags.length > 0) {
              // 选中相应的标签
              node.tags.forEach(tag => {
                const option = Array.from(tagsSelect.options).find(opt => opt.value === tag._id);
                if (option) {
                  option.selected = true;
                }
              });
            }
            
            // 立即更新关系选择的UI显示
            setupRelationSelection('contactTags', 'selectedContactTags');
          }, 10);
        } else if (node.type === 'tag') {
          document.getElementById('tagName').value = node.name || '';
          document.getElementById('tagDescription').value = node.description || '';
          
          // 加载标签关联选项
          loadTagOptions('tagRelatedTags', node._id);
          
          // 使用setTimeout确保loadTagOptions完成后再设置选中状态和UI
          setTimeout(() => {
            // 设置选中的关联标签
            const relatedTagsSelect = document.getElementById('tagRelatedTags');
            // 清除所有已选择的选项
            Array.from(relatedTagsSelect.options).forEach(option => {
              option.selected = false;
            });
            
            if (node.relatedTags && node.relatedTags.length > 0) {
              // 选中相应的关联标签
              node.relatedTags.forEach(tag => {
                const option = Array.from(relatedTagsSelect.options).find(opt => opt.value === tag._id);
                if (option) {
                  option.selected = true;
                }
              });
            }
            
            // 立即更新关系选择的UI显示
            setupRelationSelection('tagRelatedTags', 'selectedTagRelatedTags');
          }, 10);
        }
        
        // 设置编辑模式标记
        window.currentEditingNode = node;
        window.isEditMode = true;
        
        // 重置头像相关的全局变量
        window.currentAvatarFile = null;
        window.currentAvatarPreview = null;
        
        console.log('编辑模式已开启，节点数据:', node);
        console.log('最终状态检查:', {
          isEditMode: window.isEditMode,
          currentEditingNode: window.currentEditingNode,
          contactFormDisplay: document.getElementById('contactForm').style.display,
          tagFormDisplay: document.getElementById('tagForm').style.display,
          activeTab: document.querySelector('.modal-nav-tab.active')?.getAttribute('data-form'),
          modalHasEditClass: modal.classList.contains('edit-mode')
        });
        
        // 添加编辑模式CSS类
        modal.classList.add('edit-mode');
        
        // 重新初始化模态框标签页事件监听器，确保编辑模式下的限制生效
        setupModalTabsForEdit();
        
        // 添加额外的状态验证日志
        setTimeout(() => {
          console.log('=== 模态框初始化完成后状态验证 ===');
          console.log('编辑模式状态:', {
            isEditMode: window.isEditMode,
            currentEditingNode: window.currentEditingNode?.type,
            modalVisible: modal.style.display === 'flex',
            contactFormVisible: document.getElementById('contactForm').style.display === 'block',
            tagFormVisible: document.getElementById('tagForm').style.display === 'block',
            activeTabDataForm: document.querySelector('.modal-nav-tab.active')?.getAttribute('data-form'),
            modalHasEditClass: modal.classList.contains('edit-mode')
          });
        }, 50);
          
        // 显示模态框
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.opacity = '1';
          modal.classList.add('visible');
        }, 10);
      } catch (error) {
        console.error('showEditModal 出错:', error);
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'error',
            message: '打开编辑窗口时出错: ' + error.message
          });
        }
      }
    }
    
    // 更新节点数据
    function updateNode(node) {
      if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') {
        updateContact(node);
      } else if (node.type === 'tag') {
        updateTag(node);
      }
    }
    
    // 更新联系人
    function updateContact(contact) {
      const name = document.getElementById('contactName').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const wechat = document.getElementById('contactWechat').value.trim();
      const description = document.getElementById('contactProfile').value.trim();
      // 使用全局变量获取头像文件，而不是直接从DOM元素
      const avatarFile = window.currentAvatarFile || null;
      
      console.log('更新联系人 - 头像文件:', avatarFile);
      console.log('更新联系人 - 当前头像预览:', window.currentAvatarPreview);
      
      if (!name) {
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'validation',
            message: '请输入联系人姓名'
          });
        }
        return;
      }
      
      // 获取选中的标签
      const tagsSelect = document.getElementById('contactTags');
      const selectedTagIds = Array.from(tagsSelect.selectedOptions).map(option => option.value).filter(id => id !== '');
      
      // 更新联系人数据
      const updatedContact = {
        name,
        phone,
        email,
        wechat,
        description,
        avatar: contact.avatar // 保留原来的头像
      };
      
      // 添加标签信息
      const contactTags = [];
      if (selectedTagIds.length > 0) {
        selectedTagIds.forEach(tagId => {
          const tag = tags.find(t => t._id === tagId);
          if (tag) {
            contactTags.push({
              _id: tag._id,
              name: tag.name
            });
          }
        });
      }
      updatedContact.tags = contactTags;
      
      // 如果上传了新头像，使用处理后的Base64数据
      if (avatarFile && window.currentAvatarPreview) {
        console.log('使用新头像数据:', window.currentAvatarPreview.substring(0, 50) + '...');
        updatedContact.avatar = window.currentAvatarPreview;
        sendUpdateRequest(updatedContact);
      } else {
        console.log('没有新头像，保持原头像:', contact.avatar ? '有原头像' : '无原头像');
        // 如果没有上传新头像，直接发送更新请求
        sendUpdateRequest(updatedContact);
      }
      
      // 发送更新请求的函数
      async function sendUpdateRequest(data) {
        try {
          // 首先调用后端API保存数据
          const response = await fetch(`/api/contacts/${contact._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('联系人API更新成功:', result);
          
          // API成功后，更新本地数据
          const index = persons.findIndex(c => c._id === contact._id);
          if (index !== -1) {
            persons[index] = { ...persons[index], ...data };
            // 保持向后兼容
            contacts = persons;
            
            console.log('联系人数据已更新:', persons[index]);
            console.log('更新的字段:', data);
            
            // 同步更新graphData.nodes中的对应节点
            const nodeIndex = graphData.nodes.findIndex(node => 
              node.type === 'person' && node._id === contact._id
            );
            if (nodeIndex !== -1) {
              // 更新节点数据，保持原有的图表属性
              graphData.nodes[nodeIndex] = {
                ...graphData.nodes[nodeIndex],
                ...persons[index],
                // 保持图表相关属性
                type: graphData.nodes[nodeIndex].type,
                id: graphData.nodes[nodeIndex].id,
                size: graphData.nodes[nodeIndex].size,
                color: graphData.nodes[nodeIndex].color
              };
              console.log('图表节点数据已同步更新:', graphData.nodes[nodeIndex]);
            }
          }
          
          // 保存数据到localStorage作为备份
          saveDataToStorage();
          
          // 关闭模态框
          closeModal();
          
          // 重新创建图表数据（确保完整同步）
          createGraphData();
          
          // 更新图表
          updateGraph();
          
          // 更新列表
          updateList();
          
          // 刷新详情面板 - 使用更新后的图表节点数据
          if (index !== -1 && nodeIndex !== -1) {
            showDetailPanel(graphData.nodes[nodeIndex]);
            console.log('详情面板已刷新，显示最新数据:', graphData.nodes[nodeIndex]);
          }
          
          // 显示成功消息
          if (window.errorHandler) {
            window.errorHandler.showError({
              type: 'success',
              message: '联系人更新成功'
            });
          }
          
        } catch (error) {
          console.error('更新联系人出错:', error);
          
          // API调用失败时，仍然更新本地数据作为备份
          const index = persons.findIndex(c => c._id === contact._id);
          if (index !== -1) {
            persons[index] = { ...persons[index], ...data };
            contacts = persons;
            saveDataToStorage();
            
            // 更新UI
            createGraphData();
            updateGraph();
            updateList();
            closeModal();
            
            // 刷新详情面板 - 使用更新后的图表节点数据
            const updatedNodeIndex = graphData.nodes.findIndex(node => 
              node.type === 'person' && node._id === contact._id
            );
            if (updatedNodeIndex !== -1) {
              showDetailPanel(graphData.nodes[updatedNodeIndex]);
            }
          }
          
          // 显示错误信息
          if (window.errorHandler) {
            window.errorHandler.showError({
              type: 'error',
              message: `更新联系人失败: ${error.message}。数据已保存到本地缓存。`
            });
          }
        }
      }
    }
    
    // 更新标签
    function updateTag(tag) {
      const name = document.getElementById('tagName').value.trim();
      const description = document.getElementById('tagDescription').value.trim();
      
      if (!name) {
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'validation',
            message: '请输入标签名称'
          });
        }
        return;
      }
      
      // 获取关联的标签
      const relatedTagsSelect = document.getElementById('tagRelatedTags');
      const selectedRelatedTagIds = Array.from(relatedTagsSelect.selectedOptions)
        .map(option => option.value)
        .filter(id => id !== '');
      
      // 构建关联标签数据
      const relatedTags = [];
      if (selectedRelatedTagIds.length > 0) {
        selectedRelatedTagIds.forEach(tagId => {
          const tagObj = tags.find(t => t._id === tagId);
          if (tagObj) {
            relatedTags.push({
              _id: tagObj._id,
              name: tagObj.name
            });
          }
        });
      }
      
      // 更新标签数据 - 保持现有字段并更新修改的字段
      const updatedTag = {
        name,
        description,
        relatedTags: relatedTags,
        // 保持现有的标签关联结构字段
        parent_tags: tag.parent_tags || [],
        child_tags: tag.child_tags || [],
        connections: tag.connections || [],
        connection_count: tag.connection_count || 0,
        color: tag.color || '#6B7280'
      };
      
      // 调用API更新标签数据
      updateTagWithAPI(updatedTag, tag);
      
      // 异步更新标签的函数
      async function updateTagWithAPI(data, originalTag) {
        try {
          // 首先调用后端API保存数据
          const response = await fetch(`/api/tags/${originalTag._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('标签API更新成功:', result);
          
          // API成功后，更新本地数据
          const index = tags.findIndex(t => t._id === originalTag._id);
          if (index !== -1) {
            tags[index] = { ...tags[index], ...data };
            
            // 同时更新关联联系人中的标签信息
            persons.forEach(contact => {
              if (contact.tags) {
                contact.tags.forEach(contactTag => {
                  if (contactTag._id === originalTag._id) {
                    contactTag.name = data.name;
                  }
                });
              }
            });
            contacts = persons; // 保持向后兼容
          }
          
          // 保存数据到localStorage作为备份
          saveDataToStorage();
          
          // 关闭模态框
          closeModal();
          
          // 重新创建图表数据
          createGraphData();
          
          // 更新图表
          updateGraph();
          
          // 更新列表
          updateList();
          
          // 刷新详情面板 - 使用更新后的图表节点数据
          if (index !== -1) {
            const updatedTagNode = graphData.nodes.find(node => 
              node.type === 'tag' && node._id === originalTag._id
            );
            if (updatedTagNode) {
              showDetailPanel(updatedTagNode);
            }
          }
          
          // 显示成功消息
          if (window.errorHandler) {
            window.errorHandler.showError({
              type: 'success',
              message: '标签更新成功'
            });
          }
          
        } catch (error) {
          console.error('更新标签出错:', error);
          
          // API调用失败时，仍然更新本地数据作为备份
          const index = tags.findIndex(t => t._id === originalTag._id);
          if (index !== -1) {
            tags[index] = { ...tags[index], ...data };
            
            // 同时更新关联联系人中的标签信息
            persons.forEach(contact => {
              if (contact.tags) {
                contact.tags.forEach(contactTag => {
                  if (contactTag._id === originalTag._id) {
                    contactTag.name = data.name;
                  }
                });
              }
            });
            contacts = persons;
            
            saveDataToStorage();
            closeModal();
            createGraphData();
            updateGraph();
            updateList();
            
            // 刷新详情面板 - 使用更新后的图表节点数据
            const updatedTagNode = graphData.nodes.find(node => 
              node.type === 'tag' && node._id === originalTag._id
            );
            if (updatedTagNode) {
              showDetailPanel(updatedTagNode);
            }
          }
          
          // 显示错误信息
          if (window.errorHandler) {
            window.errorHandler.showError({
              type: 'error',
              message: `更新标签失败: ${error.message}。数据已保存到本地缓存。`
            });
          }
        }
      }
    }
    
    // 更新组织

    
    // 关闭模态框
    let isModalClosing = false; // 添加状态标记，防止多次快速点击
    
    function closeModal() {
      if (isModalClosing) return; // 如果已经在关闭过程中，则忽略
      
      isModalClosing = true;
      const addModal = document.getElementById('addModal');
      
      // 移动端处理：恢复背景滚动
      if (isMobileDevice()) {
        document.body.style.overflow = '';
      }
      
      // 添加一个遮罩层防止用户交互
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'transparent';
      overlay.style.zIndex = '2000';
      document.body.appendChild(overlay);
      
      // 先设置opacity为0（添加过渡效果）
      addModal.style.opacity = '0';
      
      // 移除visible类
      addModal.classList.remove('visible');
      
      // 等待过渡效果完成后，再设置display为none
      setTimeout(() => {
        addModal.style.display = 'none';
        document.body.removeChild(overlay); // 移除遮罩层
        isModalClosing = false; // 重置状态
        
        // 清除编辑模式标记
        window.isEditMode = false;
        window.currentEditingNode = null;
        
        // 清除头像相关的全局变量
        window.currentAvatarFile = null;
        window.currentAvatarPreview = null;
        
        // 移除编辑模式CSS类
        addModal.classList.remove('edit-mode');
      }, 300); // 与CSS中transition的时间一致
    }
    
    // 删除节点
    async function deleteNode(node) {
      try {
        console.log('开始删除节点:', node);
        
        // 调用后端API删除数据
        let apiUrl = '';
        if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') {
          apiUrl = `/api/contacts/${node._id}`;
        } else if (node.type === 'tag') {
          apiUrl = `/api/tags/${node._id}`;
        }
        
        if (apiUrl) {
          const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
          }
          
          console.log('后端删除成功');
        }
        
        // 更新本地数据
        if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') {
          persons = persons.filter(c => c._id !== node._id);
          contacts = persons; // 保持向后兼容
        } else if (node.type === 'tag') {
          // 删除标签时，还需要更新关联的联系人
          tags = tags.filter(t => t._id !== node._id);
          
          // 将关联到此标签的联系人更新
          persons.forEach(contact => {
            if (contact.tags) {
              contact.tags = contact.tags.filter(t => t._id !== node._id);
            }
          });
          contacts = persons; // 保持向后兼容
        }
        
        // 保存数据到localStorage
        saveDataToStorage();
        
        // 关闭详情面板
        closeDetailPanel();
        
        // 重新创建图表数据
        createGraphData();
        
        // 更新图表
        updateGraph();
        
        // 更新列表
        updateList();
        
        // 显示成功消息
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'success',
            message: '删除成功'
          });
        }
        
      } catch (error) {
        console.error('删除出错:', error);
        
        // API调用失败时，仍然删除本地数据作为备份
        if (node.type === 'contact' || node.type === 'freelancer' || node.type === 'person') {
          persons = persons.filter(c => c._id !== node._id);
          contacts = persons;
        } else if (node.type === 'tag') {
          tags = tags.filter(t => t._id !== node._id);
          persons.forEach(contact => {
            if (contact.tags) {
              contact.tags = contact.tags.filter(t => t._id !== node._id);
            }
          });
          contacts = persons;
        }
        
        saveDataToStorage();
        closeDetailPanel();
        createGraphData();
        updateGraph();
        updateList();
        
        // 显示错误信息
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'error',
            message: `删除失败: ${error.message}。数据已从本地缓存中删除。`
          });
        }
      }
    }
    
    // 关闭详情面板
    function closeDetailPanel() {
      const panel = document.getElementById('detailPanel');
      panel.classList.remove('visible');
      panel.style.opacity = '0';
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
      selectedNode = null;
      hoverNode = null;
      needsRefresh = true; // 标记需要刷新
      
      console.log('详情面板已关闭');
    }
    
    // 初始化图谱
    function initGraph() {
      console.log("开始初始化图谱");
      const container = document.getElementById('graphContainer');
      
      // 清除容器内容
      container.innerHTML = '';
      
      try {
        // 判断是否为移动设备
        const isMobile = window.innerWidth <= 767;
        
        // 在初始化前预处理数据，帮助避免重叠
        // 给每个节点一个初始位置，而不是全部从中心开始
        graphData.nodes.forEach((node, i) => {
          // 根据节点类型和索引设定初始位置
          if (node.type === 'freelancer') {
            // 自由职业者围绕中心分布，范围更小
            const angle = Math.random() * 2 * Math.PI;
            const radius = 200 + Math.random() * 100; // 缩小初始分布半径
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
            // 添加初始速度向量，使其向中心靠近
            node.vx = -node.x * 0.01;
            node.vy = -node.y * 0.01;
          } else if (node.type === 'contact') {
            // 联系人随机位置分布
            const angle = Math.random() * 2 * Math.PI;
            const radius = 300 + Math.random() * 50;
            node.x = radius * Math.cos(angle);
            node.y = radius * Math.sin(angle);
          }
        });
        
        // 创建图谱实例
        graph = ForceGraph()(container)
          .graphData(graphData)
          .backgroundColor('rgb(30, 30, 30)')
          .nodeRelSize(isMobile ? 4 : 6) // 移动端节点稍小
          .nodeVal(node => {
            // 移动端缩小节点尺寸
            const mobileFactor = isMobile ? 0.7 : 1;
            if (node.type === 'tag') return 35 * mobileFactor; // 标签节点最大
            if (node.type === 'freelancer') return 7 * mobileFactor;
            return 7 * mobileFactor;
          })
          // 添加坐标边界约束，防止节点飞得太远
          .d3AlphaDecay(0.02) // 降低衰减速度
          .d3VelocityDecay(isMobile ? 0.4 : 0.3) // 移动端增加阻尼
          .onEngineTick(() => {
            // 添加边界约束，限制最大距离
            const maxDistance = 800; // 最大距离
            graphData.nodes.forEach(node => {
              // 计算到原点的距离
              const distanceFromCenter = Math.sqrt(node.x * node.x + node.y * node.y);
              
              // 如果距离超出边界，将位置按比例缩放到边界内
              if (distanceFromCenter > maxDistance) {
                const scale = maxDistance / distanceFromCenter;
                node.x *= scale;
                node.y *= scale;
                
                // 对自由职业者节点添加更强的向心力
                if (node.type === 'freelancer') {
                  // 添加10%的向中心的力
                  node.x *= 0.9;
                  node.y *= 0.9;
                }
              }
            });
          })
          .nodeCanvasObject((node, ctx, globalScale) => {
            // 自定义节点渲染
            // 使用节点自身的size和color属性，如果没有则使用默认值
            let size = node.size || 7;
            let color = node.color;
            
            // 所有节点统一使用灰色
            if (!color) {
              color = 'rgb(179, 179, 179)'; // 所有类型统一使用灰色
            }
            
            // 为不同类型的节点设置默认大小（如果节点没有size属性）
            if (!node.size) {
              if (node.type === 'tag') {
                size = 20; // 标签节点默认大小
              } else if (node.type === 'person' || node.type === 'freelancer') {
                size = 10; // 人员节点默认大小
              }
            }
            
            // 检查是否需要显示头像（仅对person和freelancer类型）
            const shouldShowAvatar = (node.type === 'person' || node.type === 'freelancer') && 
                                   node.avatar && 
                                   node.avatar !== './icon/common.png' && 
                                   node.avatar.trim() !== '';
            
            if (shouldShowAvatar) {
              // 创建图片缓存键
              const cacheKey = `avatar_${node.id}`;
              
              // 检查图片缓存
              if (!window.avatarImageCache) {
                window.avatarImageCache = new Map();
              }
              
              let img = window.avatarImageCache.get(cacheKey);
              
              if (!img) {
                // 创建新的图片对象
                img = new Image();
                img.onload = () => {
                  // 图片加载完成后，标记为已加载并重新渲染
                  window.avatarImageCache.set(cacheKey, img);
                  // 触发重新渲染
                  if (window.Graph) {
                    window.Graph.refresh();
                  }
                };
                img.onerror = () => {
                  // 图片加载失败，从缓存中移除
                  window.avatarImageCache.delete(cacheKey);
                };
                img.src = node.avatar;
                // 临时存储未加载的图片对象
                window.avatarImageCache.set(cacheKey, img);
              }
              
              // 如果图片已加载完成，绘制头像
              if (img.complete && img.naturalWidth > 0) {
                // 保存当前画布状态
                ctx.save();
                
                // 创建圆形裁剪路径
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                ctx.clip();
                
                // 绘制头像
                const avatarSize = size * 2;
                ctx.drawImage(
                  img,
                  node.x - size,
                  node.y - size,
                  avatarSize,
                  avatarSize
                );
                
                // 恢复画布状态
                ctx.restore();
                
                // 绘制圆形边框
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
              } else {
                // 图片未加载完成，绘制默认圆形
                ctx.beginPath();
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
              }
            } else {
              // 没有头像或是默认头像，绘制普通圆形节点
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
            }
            
            // 如果节点被选中或悬停，添加高亮边框
            if ((selectedNode && node.id === selectedNode.id) || 
                (hoverNode && node.id === hoverNode.id)) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
              
              // 为选中节点和悬停节点使用不同颜色
              if (selectedNode && node.id === selectedNode.id) {
                ctx.strokeStyle = 'rgb(8, 132, 255)'; // 选中节点边框颜色为蓝色
              } else {
                ctx.strokeStyle = 'rgb(200, 200, 200)'; // 悬停节点边框颜色为灰色
              }
              
              ctx.lineWidth = 2;
              ctx.stroke();
              
              // 显示节点的标签
              const label = node.name;
              const fontSize = 12/globalScale;
              // 根据节点类型调整字体大小
              const fontSizeMultiplier = node.type === 'tag' ? 1.2 : 1.0;
              ctx.font = `${fontSize * fontSizeMultiplier}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // 添加文字背景
              const textWidth = ctx.measureText(label).width;
              const textYPos = node.y + size + 4 + fontSize/2;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(
                node.x - textWidth/2 - 2,
                textYPos - fontSize/2 - 1,
                textWidth + 4,
                fontSize + 2
              );
              
              // 绘制文字
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillText(label, node.x, textYPos);
            }
          })
          // 完全禁用默认标签
          .nodeLabel(null)
          // 关闭默认连接线渲染
          .linkVisibility(() => false)
          // 使用自定义对象绘制连接线
          .linkCanvasObject(null)
          .d3Force('link', d3.forceLink().distance(link => {
            // 获取源节点和目标节点
            const sourceNode = graphData.nodes.find(n => n.id === link.source.id || n.id === link.source);
            const targetNode = graphData.nodes.find(n => n.id === link.target.id || n.id === link.target);
            
            // 标签之间的层级关系链接
            if (link.type === 'hierarchy') {
              return 80; // 层级关系链接距离适中
            }
            
            // 人员到标签的链接
            if (sourceNode && targetNode && 
                ((sourceNode.type === 'person' || sourceNode.type === 'freelancer') && targetNode.type === 'tag') ||
                (sourceNode.type === 'tag' && (targetNode.type === 'person' || targetNode.type === 'freelancer'))) {
              // 根据标签的连接数量动态调整距离
              const tagNode = sourceNode.type === 'tag' ? sourceNode : targetNode;
              const baseDistance = 50;
              const connectionFactor = Math.min(tagNode.connection_count || 1, 10);
              return baseDistance + connectionFactor * 5; // 连接越多，距离越远
            }
            
            // 标签到标签的链接（非层级关系）
            if (sourceNode && targetNode && 
                sourceNode.type === 'tag' && targetNode.type === 'tag') {
              return 100; // 标签间距离较大
            }
            
            return 40; // 默认链接距离
          }).strength(link => {
            // 获取源节点和目标节点
            const sourceNode = graphData.nodes.find(n => n.id === link.source.id || n.id === link.source);
            const targetNode = graphData.nodes.find(n => n.id === link.target.id || n.id === link.target);
            
            // 层级关系链接强度较小
            if (link.type === 'hierarchy') {
              return 0.3;
            }
            
            // 人员到标签的链接强度适中
            if (sourceNode && targetNode && 
                ((sourceNode.type === 'person' || sourceNode.type === 'freelancer') && targetNode.type === 'tag') ||
                (sourceNode.type === 'tag' && (targetNode.type === 'person' || targetNode.type === 'freelancer'))) {
              return 0.8;
            }
            
            return 1.0; // 默认链接强度
          }))
          // 微调碰撞距离
          .d3Force('collision', d3.forceCollide(node => {
            // 使用节点的动态size属性加上一定的缓冲区
            const nodeSize = node.size || 7;
            const buffer = 3; // 碰撞缓冲区
            return nodeSize + buffer;
          }).strength(1.2).iterations(4)) // 增加碰撞强度和迭代次数，更严格地避免重叠
          // 调整互斥力，允许更紧凑的布局同时避免重叠
          .d3Force('charge', d3.forceManyBody()
            .strength(node => {
              // 根据节点类型和大小设置不同的排斥力
              const nodeSize = node.size || 7;
              const basePower = nodeSize * 15; // 基础排斥力与节点大小成正比
              
              if (node.type === 'tag') {
                // 标签节点排斥力与连接数量相关
                const connectionFactor = Math.sqrt(node.connection_count || 1);
                return -(basePower * connectionFactor);
              } else if (node.type === 'freelancer') {
                return -basePower * 0.8; // 自由职业者排斥力稍小
              } else if (node.type === 'person') {
                return -basePower; // 普通人员排斥力
              }
              return -basePower; // 默认排斥力
            })
            .distanceMax(300) // 增加互斥力的影响范围
            .theta(0.7) // 提高电荷力计算精度
          )
          // 添加径向力，让自由职业者聚集在外围
          .d3Force('radial', d3.forceRadial(node => {
            if (node.type === 'freelancer') {
              return 250; // 自由职业者有向外的径向力
            }
            return null; // 其他节点没有径向力
          }).strength(node => {
            return node.type === 'freelancer' ? 0.1 : 0; // 自由职业者有较弱的向外力
          }))
          .d3Force('center', d3.forceCenter())
          .cooldownTicks(100) // 降低冷却时间
          .cooldownTime(5000) // 降低冷却总时间
          .onRenderFramePre((ctx, globalScale) => {
            // 在每帧开始时绘制连接线，确保它们在节点下面
            if (selectedNode || hoverNode) {
              // 选择需要显示连接的节点（优先使用选中节点，如果没有则使用悬停节点）
              const activeNode = selectedNode || hoverNode;
              
              const relevantLinks = graphData.links.filter(link => {
                const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                return sourceId === activeNode.id || targetId === activeNode.id;
              });
              
              // 绘制所有相关连接线
              relevantLinks.forEach(link => {
                const start = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
                const end = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
                
                if (!start || !end) return;
                
                // 计算节点的大小
                let sourceSize = 7;
                let targetSize = 7;
                
                if (start.type === 'tag') sourceSize = 35;
                if (end.type === 'tag') targetSize = 35;
                if (start.type === 'organization') sourceSize = 28;
                if (end.type === 'organization') targetSize = 28;
                if (start.type === 'company') sourceSize = 14;
                if (end.type === 'company') targetSize = 14;
                
                // 计算从节点边缘开始的连接线，而不是从中心点
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 计算单位向量
                const unitX = dx / distance;
                const unitY = dy / distance;
                
                // 计算新的起点和终点，从节点边缘开始
                const startX = start.x + unitX * sourceSize;
                const startY = start.y + unitY * sourceSize;
                const endX = end.x - unitX * targetSize;
                const endY = end.y - unitY * targetSize;
                
                // 绘制连接线
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                // 设置连接线样式，选中节点和悬停节点的连接线颜色不同
                ctx.strokeStyle = activeNode === selectedNode ? 'rgba(8, 132, 255, 0.8)' : 'rgba(200, 200, 200, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              });
            }
          })
          .onRenderFramePost(null);
        
        // 添加节点悬停事件
        graph.onNodeHover(node => {
          if (node !== hoverNode) {
            // 如果悬停节点发生变化
            hoverNode = node;
            // 更新鼠标样式
            graph.nodeRelSize(6); // 刷新节点大小以触发重绘
            
            // 设置需要刷新
            needsRefresh = true;
          }
          
          // 更新鼠标指针
          graph.cooldownTicks(node ? 0 : 100); // 如果悬停在节点上，立即停止冷却
          container.style.cursor = node ? 'pointer' : '';
        });
        
        // 修改点击事件，确保节点选择状态被正确更新并触发重绘
        graph.onNodeClick(node => {
          console.log('节点被点击:', node.name, node);
          
          // 设置选中节点
          selectedNode = node;
          needsRefresh = true;
          
          // 高亮显示与所选节点相关的连接
          const nodeLinks = graphData.links.filter(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return sourceId === node.id || targetId === node.id;
          });
          
          console.log(`选中节点：${node.name}，ID：${node.id}`);
          console.log(`找到相关连接：${nodeLinks.length}条`);
          
          // 测试在控制台打印前5个连接的详情
          nodeLinks.slice(0, 5).forEach((link, i) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            console.log(`连接${i+1}: 从 ${sourceId} 到 ${targetId}`);
          });
          
          // 立即强制重绘
          const currentData = graph.graphData();
          graph.graphData(currentData);
          
          showDetailPanel(node);
        });
        
        // 添加背景点击事件
        graph.onBackgroundClick(() => {
          console.log('背景被点击');
          closeDetailPanel();
          
          // 清除选中状态并重绘
          selectedNode = null;
          hoverNode = null;
          needsRefresh = true;
          if (graph) {
            const currentData = graph.graphData();
            graph.graphData(currentData);
          }
        });
        
        console.log("图谱初始化完成");
        
        // 不使用热启动模拟，改为优化初始布局参数
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => {
          if (graph) {
            graph.width(container.clientWidth);
            graph.height(container.clientHeight);
          }
        });
        
        // 针对移动设备调整初始视图缩放
        setTimeout(() => {
          if (graph) {
            if (isMobile) {
              // 移动设备上更适合的初始视图
              graph.zoomToFit(300, 20);
            } else {
              graph.zoomToFit(400, 50);
            }
          }
        }, 2000);
        
        // 启动刷新循环
        setupRefreshLoop();
        
        // 针对移动设备优化触摸交互
        if (isMobile) {
          // 提高碰撞检测精度，使触摸更容易选中节点
          graph.d3Force('collision', d3.forceCollide(node => {
            // 增加碰撞半径，便于触摸选择
            const touchFactor = 1.5;
            if (node.type === 'tag') return 45 * touchFactor;
            if (node.type === 'freelancer') return 8 * touchFactor;
            return 9 * touchFactor;
          }).strength(1.3).iterations(4));
          
          // 增加冷却时间和降低冷却速度，使图谱在移动设备上更稳定
          graph.cooldownTicks(200)
              .cooldownTime(6000);
        }
        
        return true;
      } catch (error) {
        console.error('初始化图谱失败:', error);
        container.innerHTML = `<div class="error-message">初始化图谱失败: ${error.message}</div>`;
        return false;
      }
    }
    
    // 高亮显示指定名称的节点
    function highlightNodeByName(nodeName) {
      if (!graph || !graphData || !graphData.nodes) {
        console.warn('图谱未初始化或数据不可用');
        return;
      }
      
      // 查找匹配的节点
      const targetNode = graphData.nodes.find(node => 
        node.name && node.name.toLowerCase().includes(nodeName.toLowerCase())
      );
      
      if (targetNode) {
        // 设置选中节点
        selectedNode = targetNode;
        needsRefresh = true;
        
        // 缩放到节点位置
        if (targetNode.x !== undefined && targetNode.y !== undefined) {
          graph.centerAt(targetNode.x, targetNode.y, 1000);
          graph.zoom(2, 1000);
        }
        
        // 显示详情面板
        setTimeout(() => {
          showDetailPanel(targetNode);
        }, 500);
        
        console.log(`已高亮显示节点: ${targetNode.name}`);
      } else {
        console.warn(`未找到名称包含 "${nodeName}" 的节点`);
      }
    }
    
    // 将函数暴露到全局作用域
    window.highlightNodeByName = highlightNodeByName;

    // 设置工具栏事件
    function setupToolbar() {
      document.getElementById('zoomInButton').addEventListener('click', () => {
        if (graph) {
          const currentZoom = graph.zoom();
          graph.zoom(currentZoom * 1.5, 400);
          console.log('放大');
        }
      });
      
      document.getElementById('zoomOutButton').addEventListener('click', () => {
        if (graph) {
          const currentZoom = graph.zoom();
          graph.zoom(currentZoom / 1.5, 400);
          console.log('缩小');
        }
      });
      
      document.getElementById('resetButton').addEventListener('click', () => {
        if (graph) {
          graph.zoomToFit(400, 50);
          console.log('重置视图');
        }
      });
      
      // 关闭详情面板的事件
      document.getElementById('detailClose').addEventListener('click', () => {
        closeDetailPanel();
      });
    }
    
    // 旧的saveDataToStorage函数已删除，使用文件开头的新版本
    
    // 旧的loadDataFromStorage函数已删除，使用文件开头的新版本
    
    // 加载数据并创建图谱
    // 计算每个标签的实际连接数量
    function calculateTagConnections() {
      console.log('开始计算标签连接数量');
      
      // 为每个标签初始化连接数为0
      tags.forEach(tag => {
        tag.connection_count = 0;
      });
      
      // 遍历所有人员，统计每个标签的连接数
      persons.forEach(person => {
        if (person.tags && person.tags.length > 0) {
          person.tags.forEach(tag => {
            // 处理标签数据结构：可能是对象{_id, name}或简单的ID字符串
            const tagId = typeof tag === 'object' ? tag._id : tag;
            
            // 找到对应的标签并增加连接数
            const targetTag = tags.find(t => t._id === tagId);
            if (targetTag) {
              targetTag.connection_count = (targetTag.connection_count || 0) + 1;
            }
          });
        }
      });
      
      // 输出统计结果
      const totalConnections = tags.reduce((sum, tag) => sum + (tag.connection_count || 0), 0);
      console.log(`标签连接数计算完成，总连接数: ${totalConnections}`);
      console.log('标签连接数详情:', tags.map(tag => `${tag.name}: ${tag.connection_count || 0}`).join(', '));
    }
    
    function loadData() {
      console.log("开始加载数据");
      
      // 首先清除旧的localStorage数据
      clearOldLocalStorageData();
      
      // 优先从服务器API获取最新数据
      loadDataFromServer()
        .then(() => {
          console.log('成功从服务器加载数据');
          initializeDataAndInterface();
        })
        .catch(error => {
          console.warn('从服务器加载数据失败，尝试使用localStorage:', error);
          // 服务器加载失败时，尝试从localStorage加载
          if (loadDataFromStorage() && persons.length > 0) {
            console.log('使用localStorage中的数据');
            initializeDataAndInterface();
          } else {
            console.log('localStorage中无数据，从JSON文件加载');
            loadDataFromFiles();
          }
        });
    }
    
    // 从服务器API加载数据
    function loadDataFromServer() {
      return new Promise((resolve, reject) => {
        // 首先检查本地数据版本
        const localVersion = localStorage.getItem('dataVersion');
        const localTimestamp = localStorage.getItem('lastModified');
        
        // 获取服务器数据版本信息
        fetch('/api/data/version')
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(versionInfo => {
            // 比较版本，如果本地数据是最新的且存在，则使用本地数据
            if (localVersion === versionInfo.version && 
                localTimestamp === versionInfo.lastModified &&
                loadDataFromStorage() && persons.length > 0) {
              console.log('本地数据已是最新版本，使用localStorage数据');
              resolve();
              return;
            }
            
            // 本地数据过期或不存在，从服务器获取最新数据
            console.log('本地数据过期，从服务器获取最新数据');
            return fetch('/api/data/all');
          })
          .then(response => {
            if (!response) return; // 已使用本地数据
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (!data) return; // 已使用本地数据
            
            // 更新本地数据
            persons = Array.isArray(data.data.persons) ? data.data.persons : [];
            tags = Array.isArray(data.data.tags) ? data.data.tags : [];
            companies = Array.isArray(data.data.companies) ? data.data.companies : [];
            organizations = Array.isArray(data.data.organizations) ? data.data.organizations : [];
            contacts = persons; // 向后兼容
            
            console.log(`从服务器加载了 ${persons.length} 个人员和 ${tags.length} 个标签`);
            
            // 保存到localStorage并更新版本信息
            saveDataToStorage();
            localStorage.setItem('dataVersion', data.version);
            localStorage.setItem('lastModified', data.lastModified);
            
            resolve();
          })
          .catch(error => {
            console.error('从服务器加载数据失败:', error);
            reject(error);
          });
      });
    }
    
    // 从JSON文件加载数据（备用方案）
    function loadDataFromFiles() {
      
      // 使用XMLHttpRequest加载JSON文件，避免CORS问题
      function loadJSONFile(url) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve(data);
                } catch (e) {
                  reject(new Error(`解析JSON失败: ${e.message}`));
                }
              } else {
                reject(new Error(`加载文件失败: ${xhr.status}`));
              }
            }
          };
          xhr.onerror = function() {
            reject(new Error('网络错误'));
          };
          xhr.send();
        });
      }
      
      // 并行加载所有数据文件
      Promise.all([
        loadJSONFile('./data/persons.json'),
        loadJSONFile('./data/tags.json')
      ])
      .then(([personsData, tagsData]) => {
        // 设置人员数据
        persons = Array.isArray(personsData) ? personsData : [];
        console.log(`加载了 ${persons.length} 个人员`);
        
        // 设置标签数据
        if (tagsData && tagsData.success && Array.isArray(tagsData.data)) {
          tags = tagsData.data;
        } else if (Array.isArray(tagsData)) {
          tags = tagsData;
        } else {
          tags = [];
        }
        console.log(`加载了 ${tags.length} 个标签`);
        
        // 为了向后兼容，保持contacts变量指向persons
        contacts = persons;
        // 清空旧的数据变量
        companies = [];
        organizations = [];
        
        // 保存数据到localStorage
        saveDataToStorage();
        
        // 初始化数据和界面，并启动自动同步
        initializeDataAndInterface();
      })
      .catch(error => {
        console.error('加载数据失败:', error);
        document.getElementById('listContainer').innerHTML = `
          <div class="error-message">加载数据失败: ${error.message}<br>请确保数据文件存在于data目录中</div>
        `;
      });
    }
    
    // 统一初始化数据和界面的函数
    function initializeDataAndInterface() {
      // 计算标签连接数量
      calculateTagConnections();
      
      // 创建图谱数据
      createGraphData();
      
      // 更新列表
      console.log('开始更新列表，当前标签页:', currentTab);
      console.log('联系人数据示例:', persons.slice(0, 2));
      updateList();
      console.log('列表更新完成');
      
      // 初始化图谱
      if (initGraph()) {
        // 设置工具栏
        setupToolbar();
      }
      
      // 移除了自动同步启动逻辑
    }
    
    // 移除了自动数据同步相关变量和功能
    
    // 移除了startAutoSync函数
    
    // 移除了stopAutoSync函数
    
    // 移除了checkForDataUpdates函数
    
    // 移除了syncDataFromServer函数
    
    // 移除了showSyncNotification函数
    
    // 移除了页面可见性变化时的自动同步逻辑
     
     // 创建图谱数据
    function createGraphData() {
      graphData.nodes = [];
      graphData.links = [];
      
      // 添加标签节点（包含原来的公司、组织和技能标签）
      tags.forEach(tag => {
        // 根据连接数量动态设置节点大小
        const baseSize = 8;
        const sizeMultiplier = Math.max(1, Math.sqrt(tag.connection_count || 1));
        const nodeSize = Math.min(baseSize * sizeMultiplier, 30); // 限制最大大小
        
        graphData.nodes.push({
          ...tag,
          type: 'tag',
          id: `tag-${tag._id}`,
          size: nodeSize,
          // 统一使用灰色
          color: 'rgb(179, 179, 179)'
        });
      });
      
      // 添加人员节点
      let freelancerCount = 0;
      
      // 调试：检查 persons 数据
      console.log('=== createGraphData 调试 ===');
      console.log('persons 数组长度:', persons.length);
      if (persons.length > 0) {
        console.log('第一个 person 对象:', persons[0]);
        console.log('第一个 person 的 description:', persons[0].description);
      }
      console.log('========================');
      
      persons.forEach(person => {
        // 判断是否为自由职业者（没有关联任何标签）
        let nodeType = 'person';
        const hasAnyTags = person.tags && person.tags.length > 0;
        
        if (!hasAnyTags) {
          nodeType = 'freelancer';
          freelancerCount++;
        }
        
        // 创建人员节点
        const personNode = {
          ...person,
          type: nodeType,
          id: `person-${person._id}`,
          size: 10, // 人员节点固定大小
          color: 'rgb(179, 179, 179)' // 统一使用灰色
        };
        
        // 调试：检查创建的节点
        if (person._id === 'JackieXiao') {
          console.log('=== JackieXiao 节点调试 ===');
          console.log('原始 person 对象:', person);
          console.log('创建的 personNode:', personNode);
          console.log('personNode.description:', personNode.description);
          console.log('========================');
        }
        
        graphData.nodes.push(personNode);
        
        // 添加人员到标签的链接
        if (person.tags && person.tags.length > 0) {
          person.tags.forEach(tag => {
            // 处理标签数据结构：可能是对象{_id, name}或简单的ID字符串
            const tagId = typeof tag === 'object' ? tag._id : tag;
            graphData.links.push({
              source: `person-${person._id}`,
              target: `tag-${tagId}`,
              id: `link-person-${person._id}-tag-${tagId}`
            });
          });
        }
      });
      
      // 添加标签之间的层级关系链接
      tags.forEach(tag => {
        if (tag.parent_tags && tag.parent_tags.length > 0) {
          tag.parent_tags.forEach(parentTag => {
            graphData.links.push({
              source: `tag-${tag._id}`,
              target: `tag-${parentTag._id}`,
              id: `link-tag-${tag._id}-parent-${parentTag._id}`,
              type: 'hierarchy' // 标记为层级关系
            });
          });
        }
      });
      
      console.log(`发现 ${freelancerCount} 位自由职业者`);
      console.log(`图谱数据包含 ${graphData.nodes.length} 个节点和 ${graphData.links.length} 个链接`);
      console.log(`其中人员节点: ${persons.length} 个，标签节点: ${tags.length} 个`);
      
      // 验证所有链接的目标节点是否存在
      const nodeIds = new Set(graphData.nodes.map(n => n.id));
      const invalidLinks = graphData.links.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
      });
      
      if (invalidLinks.length > 0) {
        console.warn('发现无效链接:', invalidLinks);
        // 移除无效链接
        graphData.links = graphData.links.filter(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });
        console.log(`移除 ${invalidLinks.length} 个无效链接后，剩余 ${graphData.links.length} 个链接`);
      }
    }
    
    // 获取标签颜色的辅助函数（统一标签类型后简化）
    function getTagColorByType(type) {
      // 所有标签统一类型，返回统一的灰色
      return 'rgb(179, 179, 179)'; // 统一灰色
    }

    // 获取标签类型的中文显示名称（统一为标签）
    function getTagTypeDisplayName(type) {
      // 所有标签统一显示为'标签'
      return '标签';
    }
    
    // 更新列表
    function updateList() {
      const container = document.getElementById('listContainer');
      if (!container) return;
      
      // 创建文档片段以提高性能
      const fragment = document.createDocumentFragment();
      
      if (currentTab === 'contacts') {
         // 创建标签映射以提高查找性能
         const tagMap = new Map(tags.map(tag => [tag._id, tag]));
         
         persons.forEach(person => {
           // 判断是否为自由职业者（没有关联任何标签）
           const isFreelancer = !person.tags || person.tags.length === 0;
           
           // 获取人员的标签信息用于显示
           const personTags = person.tags ? person.tags.map(tag => {
             // 处理标签数据结构：可能是对象{_id, name}或简单的ID字符串
             if (typeof tag === 'object') {
               return tag.name; // 直接使用对象中的name
             } else {
               const tagObj = tagMap.get(tag);
               return tagObj ? tagObj.name : '';
             }
           }).filter(name => name).slice(0, 3) : [];
           
           const subtitle = isFreelancer ? '自由职业者' : 
             (personTags.length > 0 ? personTags.join(', ') + (person.tags.length > 3 ? '...' : '') : '无标签');
           
           // 创建DOM元素而不是HTML字符串
           const listItem = document.createElement('div');
           listItem.className = 'list-item';
           listItem.setAttribute('data-id', person._id);
           listItem.setAttribute('data-type', isFreelancer ? 'freelancer' : 'person');
           
           const avatar = document.createElement('img');
           avatar.src = person.avatar || 'https://via.placeholder.com/32';
           avatar.alt = person.name;
           avatar.className = 'avatar';
           
           const itemInfo = document.createElement('div');
           itemInfo.className = 'item-info';
           
           const itemTitle = document.createElement('div');
           itemTitle.className = 'item-title';
           itemTitle.textContent = person.name;
           
           const itemSubtitle = document.createElement('div');
           itemSubtitle.className = 'item-subtitle';
           itemSubtitle.textContent = subtitle;
           
           itemInfo.appendChild(itemTitle);
           itemInfo.appendChild(itemSubtitle);
           listItem.appendChild(avatar);
           listItem.appendChild(itemInfo);
           
           fragment.appendChild(listItem);
         });
      } else if (currentTab === 'tags') {
        tags.forEach(tag => {
          // 显示标签的连接数量信息
          const connectionInfo = `${tag.connection_count || 0} 个连接`;
          const typeInfo = '标签';
          
          const listItem = document.createElement('div');
          listItem.className = 'list-item';
          listItem.setAttribute('data-id', tag._id);
          listItem.setAttribute('data-type', 'tag');
          
          const itemInfo = document.createElement('div');
          itemInfo.className = 'item-info';
          
          const itemTitle = document.createElement('div');
          itemTitle.className = 'item-title';
          itemTitle.textContent = tag.name;
          
          const itemSubtitle = document.createElement('div');
          itemSubtitle.className = 'item-subtitle';
          itemSubtitle.textContent = `${typeInfo} · ${connectionInfo}`;
          
          itemInfo.appendChild(itemTitle);
          itemInfo.appendChild(itemSubtitle);
          listItem.appendChild(itemInfo);
          
          fragment.appendChild(listItem);
        });
      }
      
      // 一次性更新DOM
      container.innerHTML = '';
      container.appendChild(fragment);
      
      // 添加列表项点击事件
      container.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const type = item.getAttribute('data-type');
          
          // 查找对应的节点
          let node = graphData.nodes.find(n => n._id === id && n.type === type);
          
          // 如果节点未找到且type是person，尝试以freelancer类型查找
          if (!node && type === 'person') {
            node = graphData.nodes.find(n => n._id === id && n.type === 'freelancer');
          }
          // 如果节点未找到且type是freelancer，尝试以person类型查找
          else if (!node && type === 'freelancer') {
            node = graphData.nodes.find(n => n._id === id && n.type === 'person');
          }
          
          if (node && graph) {
            // 聚焦到该节点
            graph.centerAt(node.x, node.y, 1000);
            graph.zoom(2, 1000);
            
            // 显示该节点的详情
            selectedNode = node;
            showDetailPanel(node);
            
            // 确保需要刷新，以显示选中状态
            needsRefresh = true;
          } else {
            console.warn(`未找到节点: id=${id}, type=${type}`);
          }
        });
      });
    }
    
    // 移除搜索功能（已优化为导航按钮布局）
    
    // 设置导航按钮切换
    function setupTabs() {
      document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => {
          // 更新激活的导航按钮
          document.querySelector('.nav-button.active').classList.remove('active');
          button.classList.add('active');
          
          // 更新当前标签页
          currentTab = button.getAttribute('data-tab');
          
          // 更新列表
          updateList();
        });
      });
    }
    
    // 设置添加按钮
    function setupAddButton() {
      const addButton = document.getElementById('addButton');
      const addModal = document.getElementById('addModal');
      const modalClose = document.getElementById('modalClose');
      const modalCancel = document.getElementById('modalCancel');
      const modalSave = document.getElementById('modalSave');
      const contactForm = document.getElementById('contactForm');
      
      // 设置模态框内的标签页切换（简化为只有联系人表单）
      function setupModalTabs() {
        // 处理模态框标签页切换
        const modalTabs = document.querySelectorAll('.modal-nav-tab');
        const contactForm = document.getElementById('contactForm');
        const tagForm = document.getElementById('tagForm');
        
        modalTabs.forEach(tab => {
          // 移除旧的事件监听器
          tab.removeEventListener('click', tab._modalTabClickHandler);
          
          // 创建新的事件处理函数
          tab._modalTabClickHandler = () => {
            // 如果是编辑模式，禁用标签页切换
            if (window.isEditMode) {
              console.log('编辑模式下禁用标签页切换');
              return;
            }
            
            // 移除所有标签页的active状态
            modalTabs.forEach(t => t.classList.remove('active'));
            // 激活当前点击的标签页
            tab.classList.add('active');
            
            // 获取要显示的表单类型
            const formType = tab.getAttribute('data-form');
            
            // 隐藏所有表单
            contactForm.style.display = 'none';
            tagForm.style.display = 'none';
            
            // 显示对应的表单
            if (formType === 'contactForm') {
              contactForm.style.display = 'block';
              // 加载标签选项
              loadTagOptions('contactTags');
              setupRelationSelection('contactTags', 'selectedContactTags');
            } else if (formType === 'tagForm') {
              tagForm.style.display = 'block';
              // 加载标签关联选项
              loadTagOptions('tagRelatedTags');
            }
          };
          
          // 添加新的事件监听器
          tab.addEventListener('click', tab._modalTabClickHandler);
        });
        
        // 初始化时加载联系人表单的标签选择交互
        loadTagOptions('contactTags');
        setupRelationSelection('contactTags', 'selectedContactTags');
      }
      
      // setupModalTabsForEdit 函数已移动到全局作用域
      
      // 添加头像预览功能
      const avatarInput = document.getElementById('contactAvatar');
      const avatarPreview = document.getElementById('avatarPreview');
      const previewImage = document.getElementById('previewImage');
      
      if (avatarInput && avatarPreview && previewImage) {
        avatarInput.addEventListener('change', function(event) {
          if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
              previewImage.src = e.target.result;
              avatarPreview.style.display = 'block';
            };
            
            reader.readAsDataURL(event.target.files[0]);
          } else {
            previewImage.src = '';
            avatarPreview.style.display = 'none';
          }
        });
      }
      
      // 添加按钮点击事件
      if (addButton) {
        addButton.addEventListener('click', () => {
          // 重置表单和警告
          resetForms();
          
          // 显示联系人表单（唯一表单）
          contactForm.style.display = 'block';
          
          // 加载标签下拉选项
          loadTagOptions('contactTags');
          
          // 显示模态框
          addModal.style.display = 'flex';
          addModal.style.opacity = '0';
          setTimeout(() => {
            addModal.style.opacity = '1';
            addModal.classList.add('visible');
          }, 10);
        });
      }
      
      // 关闭模态框的事件
      if (modalClose) {
        modalClose.addEventListener('click', () => {
          closeModal();
        });
      }
      
      if (modalCancel) {
        modalCancel.addEventListener('click', () => {
          closeModal();
        });
      }
      
      // 表单验证函数
      function validateForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
          const formGroup = input.closest('.form-group');
          if (!formGroup) return;
          
          const errorMessage = formGroup.querySelector('.error-message');
          const successMessage = formGroup.querySelector('.success-message');
          
          // 清除之前的状态
          formGroup.classList.remove('error', 'success');
          if (errorMessage) errorMessage.classList.remove('show');
          if (successMessage) successMessage.classList.remove('show');
          
          // 验证必填字段
          if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            formGroup.classList.add('error');
            
            if (!errorMessage) {
              const error = document.createElement('div');
              error.className = 'error-message';
              error.innerHTML = '<i class="fas fa-exclamation-circle"></i>此字段为必填项';
              formGroup.appendChild(error);
            }
            formGroup.querySelector('.error-message').classList.add('show');
          } else if (input.value.trim()) {
            // 验证邮箱格式
            if (input.type === 'email' && input.value) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(input.value)) {
                isValid = false;
                formGroup.classList.add('error');
                
                if (!errorMessage) {
                  const error = document.createElement('div');
                  error.className = 'error-message';
                  error.innerHTML = '<i class="fas fa-exclamation-circle"></i>请输入有效的邮箱地址';
                  formGroup.appendChild(error);
                }
                formGroup.querySelector('.error-message').classList.add('show');
              } else {
                formGroup.classList.add('success');
              }
            } else {
              formGroup.classList.add('success');
            }
          }
        });
        
        return isValid;
      }
      
      // 设置按钮加载状态
      function setButtonLoading(button, loading) {
        if (loading) {
          button.classList.add('loading');
          button.disabled = true;
        } else {
          button.classList.remove('loading');
          button.disabled = false;
        }
      }
      
      // 保存按钮点击事件
      if (modalSave) {
        modalSave.onclick = () => {
          // 检查是否为编辑模式
          if (window.isEditMode && window.currentEditingNode) {
            // 编辑模式：更新现有节点
            updateNode(window.currentEditingNode);
          } else {
            // 添加模式：创建新节点
            // 获取当前激活的标签页
            const activeTab = document.querySelector('.modal-nav-tab.active');
            const formType = activeTab ? activeTab.getAttribute('data-form') : 'contactForm';
            
            let form, saveFunction;
            
            if (formType === 'contactForm') {
              form = document.getElementById('contactForm');
              saveFunction = saveContact;
            } else if (formType === 'tagForm') {
              form = document.getElementById('tagForm');
              saveFunction = saveTag;
            }
            
            if (form && validateForm(form)) {
              // 设置加载状态
              setButtonLoading(modalSave, true);
              
              // 延迟执行保存操作，显示加载效果
              setTimeout(() => {
                saveFunction();
                
                // 重置按钮状态
                setButtonLoading(modalSave, false);
              }, 800);
            }
          }
        };
      }
      
      // 设置模态框内的标签页
      setupModalTabs();
    }
    
    // 通知函数
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 400);
      }, 3000);
    }
    
    // 重置表单
    function resetForms() {
      // 清空联系人表单
      document.getElementById('contactName').value = '';
      document.getElementById('contactPhone').value = '';
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactWechat').value = '';
      document.getElementById('contactProfile').value = '';
      
      // 重置头像上传组件
      if (avatarUploader) {
        avatarUploader.reset();
      }
      
      // 清除全局头像变量
      window.currentAvatarFile = null;
      window.currentAvatarPreview = null;
      
      // 重置标签选择
      const contactTags = document.getElementById('contactTags');
      if (contactTags) {
        contactTags.value = '';
      }
      
      // 清空标签表单
      document.getElementById('tagName').value = '';
      document.getElementById('tagDescription').value = '';
      
      // 清除所有错误状态
      if (window.errorHandler) {
        window.errorHandler.clearAllErrors();
      }
      
      // 重置标签页为联系人表单
      const modalTabs = document.querySelectorAll('.modal-nav-tab');
      modalTabs.forEach(tab => tab.classList.remove('active'));
      const contactTab = document.querySelector('[data-form="contactForm"]');
      if (contactTab) {
        contactTab.classList.add('active');
      }
      
      // 显示联系人表单，隐藏标签表单
      document.getElementById('contactForm').style.display = 'block';
      document.getElementById('tagForm').style.display = 'none';
      
      // 清除编辑模式标记
      window.isEditMode = false;
      window.currentEditingNode = null;
      
      // 重置模态框标题为添加模式
      document.getElementById('modalTitle').textContent = '添加节点';
    }
    

    
    // 设置关系选择的UI交互
    function setupRelationSelection(selectId, displayId) {
      const select = document.getElementById(selectId);
      const display = document.getElementById(displayId);
      
      if (!select || !display) return;
      
      // 更新显示选中的标签
      function updateDisplay() {
        const selectedOptions = Array.from(select.selectedOptions).filter(option => option.value !== '');
        
        if (selectedOptions.length === 0) {
          display.innerHTML = '<span class="text-gray-500">未选择任何标签</span>';
        } else {
          display.innerHTML = selectedOptions.map(option => 
            `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">${option.textContent}</span>`
          ).join('');
        }
      }
      
      // 监听选择变化
      select.addEventListener('change', updateDisplay);
      
      // 初始化显示
      updateDisplay();
    }
    
    // 加载标签下拉选项
    function loadTagOptions(selectId, excludeId = null) {
      const tagSelect = document.getElementById(selectId);
      tagSelect.innerHTML = '<option value="">无</option>';
      
      tags.forEach(tag => {
        // 排除当前编辑的标签，避免自己关联自己
        if (excludeId && tag._id === excludeId) {
          return;
        }
        
        const option = document.createElement('option');
        option.value = tag._id;
        option.textContent = tag.name;
        tagSelect.appendChild(option);
      });
      
      // 延迟一下触发change事件，确保选项加载完成并且选中状态设置好后才触发
      setTimeout(() => {
        const event = new Event('change');
        tagSelect.dispatchEvent(event);
      }, 0);
    }
    
    // 保存联系人
    function saveContact() {
      const name = document.getElementById('contactName').value;
      const phone = document.getElementById('contactPhone').value;
      const email = document.getElementById('contactEmail').value;
      const wechat = document.getElementById('contactWechat').value;
      const description = document.getElementById('contactProfile').value;
      
      // 获取所选标签
      const tagsSelect = document.getElementById('contactTags');
      const selectedTagIds = Array.from(tagsSelect.selectedOptions).map(option => option.value).filter(id => id !== '');
      
      if (!name) {
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'validation',
            message: '请输入姓名'
          });
        }
        return;
      }
      
      // 准备联系人数据
      const newPerson = {
        _id: generateUUID(),
        name,
        phone,
        email,
        wechat,
        description: description || '暂无简介'
      };
      
      // 处理头像上传 - 使用新的头像上传组件
      if (window.currentAvatarFile && window.currentAvatarPreview) {
        // 使用处理后的头像数据
        newPerson.avatar = window.currentAvatarPreview;
        
        // 继续添加其他信息并保存
        completePersonSave(newPerson, selectedTagIds);
      } else {
        // 如果没有上传头像，使用默认头像
        newPerson.avatar = './icon/common.png';
        
        // 继续添加其他信息并保存
        completePersonSave(newPerson, selectedTagIds);
      }
    }
    
    // 完成人员保存
    async function completePersonSave(newPerson, tagIds) {
      // 添加标签信息
      const personTags = [];
      if (tagIds && tagIds.length > 0) {
        tagIds.forEach(tagId => {
          if (tagId) { // 确保不是空选项
            const tag = tags.find(t => t._id === tagId);
            if (tag) {
              personTags.push({
                _id: tag._id,
                name: tag.name
              });
            }
          }
        });
      }
      newPerson.tags = personTags;
      
      try {
        // 首先调用后端API保存数据
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newPerson)
        });
        
        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('联系人API创建成功:', result);
        
        // API成功后，更新本地数据
        persons.push(newPerson);
        
        // 保存数据到localStorage作为备份
        saveDataToStorage();
        
        // 更新图谱数据
        updateGraphWithNewPerson(newPerson);
        
        // 更新列表
        updateList();
        
        // 关闭模态框
        closeModal();
        
        // 显示成功通知
        showNotification('人员保存成功！', 'success');
        
        // 清空表单
        resetForms();
        
      } catch (error) {
        console.error('保存人员失败:', error);
        
        // API调用失败时，仍然保存到本地作为备份
        persons.push(newPerson);
        saveDataToStorage();
        updateGraphWithNewPerson(newPerson);
        updateList();
        closeModal();
        resetForms();
        
        // 显示错误信息
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'error',
            message: `保存人员失败: ${error.message}。数据已保存到本地缓存。`
          });
        }
      }
    }
    

    
    // 保存标签
    function saveTag() {
      const name = document.getElementById('tagName').value.trim();
      const description = document.getElementById('tagDescription').value.trim();
      
      if (!name) {
        if (window.errorHandler) {
          window.errorHandler.showError({
            type: 'validation',
            message: '请输入标签名称'
          });
        }
        return;
      }
      
      // 获取关联的标签
      const relatedTagsSelect = document.getElementById('tagRelatedTags');
      const selectedRelatedTagIds = Array.from(relatedTagsSelect.selectedOptions)
        .map(option => option.value)
        .filter(id => id !== '');
      
      // 构建关联标签数据
      const relatedTags = [];
      if (selectedRelatedTagIds.length > 0) {
        selectedRelatedTagIds.forEach(tagId => {
          const tag = tags.find(t => t._id === tagId);
          if (tag) {
            relatedTags.push({
              _id: tag._id,
              name: tag.name
            });
          }
        });
      }
      
      // 构建标签数据
      const newTag = {
        _id: generateUUID(),
        name,
        description: description || '',
        relatedTags: relatedTags,
        // 添加新的标签关联结构字段
        parent_tags: [],
        child_tags: [],
        connections: [],
        connection_count: 0,
        color: '#6B7280'
      };
      
      // 调用API保存标签数据
      saveTagWithAPI(newTag);
      
      // 异步保存标签的函数
      async function saveTagWithAPI(tagData) {
        try {
          // 首先调用后端API保存数据
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(tagData)
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('标签API保存成功:', result);
          
          // API成功后，更新本地数据
          tags.push(tagData);
          
          // 保存数据到localStorage作为备份
          saveDataToStorage();
          
          // 更新图谱数据
          updateGraphWithNewTag(tagData);
          
          // 更新列表
          updateList();
          
          // 关闭模态框
          closeModal();
          
          // 显示成功通知
          showNotification('标签保存成功！', 'success');
          
          // 清空表单
          document.getElementById('tagName').value = '';
          document.getElementById('tagDescription').value = '';
          
        } catch (error) {
          console.error('保存标签失败:', error);
          
          // API调用失败时，仍然保存到本地数据作为备份
          tags.push(tagData);
          saveDataToStorage();
          updateGraphWithNewTag(tagData);
          updateList();
          closeModal();
          
          // 清空表单
          document.getElementById('tagName').value = '';
          document.getElementById('tagDescription').value = '';
          
          // 显示错误信息
          if (window.errorHandler) {
            window.errorHandler.showError({
              type: 'error',
              message: `保存标签失败: ${error.message}。数据已保存到本地缓存。`
            });
          } else {
            showNotification('标签保存失败，但已保存到本地缓存', 'warning');
          }
        }
      }
    }
    
    // 更新图谱数据 - 添加新标签
    function updateGraphWithNewTag(tag) {
      // 创建新节点
      const newNode = {
        ...tag,
        type: 'tag',
        id: `tag-${tag._id}`
      };
      
      // 设置初始位置 - 在画布中心附近随机位置
      const angle = Math.random() * 2 * Math.PI;
      const radius = 100;
      newNode.x = radius * Math.cos(angle);
      newNode.y = radius * Math.sin(angle);
      
      // 添加节点
      graphData.nodes.push(newNode);
      
      // 更新图谱
      updateGraph();
    }
    
    // 更新图谱数据 - 添加新人员
    function updateGraphWithNewPerson(person) {
      // 判断人员类型（基于标签）
      let nodeType = 'person';
      const hasAnyTags = person.tags && person.tags.length > 0;
      
      if (!hasAnyTags) {
        nodeType = 'freelancer';
      }
      
      // 创建新节点
      const newNode = {
        ...person,
        type: nodeType,
        id: `person-${person._id}`
      };
      
      // 设置初始位置 - 在画布中心附近随机位置
      const angle = Math.random() * 2 * Math.PI;
      const radius = 200 + Math.random() * 100;
      newNode.x = radius * Math.cos(angle);
      newNode.y = radius * Math.sin(angle);
      
      // 添加人员到标签的连接
      if (person.tags && person.tags.length > 0) {
        person.tags.forEach(tag => {
          graphData.links.push({
            source: `person-${person._id}`,
            target: `tag-${tag._id}`,
            id: `link-person-${person._id}-tag-${tag._id}`
          });
        });
      }
      
      // 添加节点
      graphData.nodes.push(newNode);
      
      // 更新图谱
      updateGraph();
    }
    
    // 更新图谱数据 - 添加新公司

    
    // 更新图谱
    function updateGraph() {
      if (graph) {
        // 重新创建完整的图谱数据
        createGraphData();
        
        // 更新图谱数据
        graph.graphData(graphData);
        
        // 重新适应视图
        setTimeout(() => {
          graph.zoomToFit(400, 50);
        }, 500);
      }
    }
    
    // 生成UUID
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // 初始化新组件
    function initializeComponents() {
        try {
            // 初始化错误处理器
            window.errorHandler = new ErrorHandler({
                enableGlobalErrorCapture: true,
                enableConsoleLogging: true,
                enableUserNotifications: true,
                maxErrorHistory: 50,
                retryAttempts: 3,
                retryDelay: 1000
            });
            
            // 初始化文件验证器
            fileValidator = new FileValidator({
                maxFileSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            });
            
            // 初始化图像处理器
            imageProcessor = new ImageProcessor({
                quality: 0.8,
                maxOutputSize: { width: 800, height: 800 }
            });
            
            // 初始化安全增强器
            securityEnhancer = new SecurityEnhancer({
                maxFileSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            });
            
            // 初始化性能优化器
            performanceOptimizer = new PerformanceOptimizer();
            
            // 初始化无障碍增强器
            accessibilityEnhancer = new AccessibilityEnhancer();
            
            // 初始化头像上传组件
            const container = document.getElementById('avatarUploaderContainer');
            if (container) {
                avatarUploader = new AvatarUploader(container, {
                    fileValidator,
                    imageProcessor,
                    securityEnhancer,
                    performanceOptimizer,
                    accessibilityEnhancer,
                    errorHandler: window.errorHandler,
                    onImageSelect: handleAvatarSelect,
                    onUploadError: handleAvatarError
                });
            }
            
            console.log('新组件初始化完成');
        } catch (error) {
            console.error('组件初始化失败:', error);
        }
    }
    
    // 头像选择处理
    function handleAvatarSelect(data) {
        console.log('头像文件已选择:', data.file.name);
        console.log('头像处理完成:', data.processedData);
        
        // 将处理后的数据存储到全局变量，供保存时使用
        window.currentAvatarFile = data.file;
        window.currentAvatarPreview = data.processedData.dataUrl;
        
        // 清除之前的错误状态
        if (window.errorHandler) {
            window.errorHandler.clearComponentErrors('AvatarUploader');
            window.errorHandler.showSuccess('头像处理完成，可以保存联系人了');
        }
    }
    

    
    // 头像错误处理
    function handleAvatarError(errorInfo) {
        console.error('头像处理错误:', errorInfo);
        // 错误已经由ErrorHandler处理，这里只需要记录日志
        // 如果需要额外的UI反馈，可以在这里添加
    }
    
    // 初始化
    console.log('开始初始化页面...');
    loadData();
    setupTabs();
    setupAddButton();
    setupMobileNav(); // 添加移动端导航初始化
    setupToolbar(); // 确保工具栏按钮事件绑定在页面加载时就完成
    initializeComponents(); // 初始化新组件
    console.log('页面初始化完成');
    
    // 全局事件监听器，处理ESC按键关闭模态框
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    });
    
    // 点击模态框外部区域关闭模态框
    document.getElementById('addModal').addEventListener('click', (event) => {
      // 如果点击的是模态框本身，而不是其内容，则关闭模态框
      if (event.target.id === 'addModal') {
        closeModal();
      }
    });
    
    // 初始化详情面板样式
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel) {
      detailPanel.style.zIndex = "1000";
      detailPanel.style.transition = "opacity 0.3s ease";
      detailPanel.style.opacity = "0";
      detailPanel.style.display = "none";
    }
    
    // 控制台调试信息输出函数
    function logLinkInfo(nodeId) {
      const links = graphData.links.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return sourceId === nodeId || targetId === nodeId;
      });
      
      console.log(`节点 ${nodeId} 的连接线数量: ${links.length}`);
      
      if (links.length > 0) {
        console.log('连接线详情:');
        links.slice(0, 5).forEach((link, idx) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          console.log(`连接 ${idx+1}: 从 ${sourceId} 到 ${targetId}`);
        });
      }
    }
    
    // 更新公司

    
    // 设置关联选择的交互
    function setupRelationSelection(selectId, tagsContainerId) {
      const select = document.getElementById(selectId);
      const tagsContainer = document.getElementById(tagsContainerId);
      
      if (!select || !tagsContainer) return;
      
      // 清空标签容器
      tagsContainer.innerHTML = '';
      
      // 添加select change事件
      select.addEventListener('change', function() {
        // 清空标签容器
        tagsContainer.innerHTML = '';
        
        // 获取所有已选择的选项
        const selectedOptions = Array.from(this.selectedOptions);
        
        // 为每个选项创建标签
        selectedOptions.forEach(option => {
          if (option.value) {
            const tag = document.createElement('div');
            tag.className = 'selected-tag';
            tag.innerHTML = `
              ${option.textContent}
              <span class="remove-tag" data-value="${option.value}">×</span>
            `;
            tagsContainer.appendChild(tag);
            
            // 添加删除标签的事件
            tag.querySelector('.remove-tag').addEventListener('click', function() {
              const value = this.getAttribute('data-value');
              // 找到对应的option并取消选中
              Array.from(select.options).forEach(opt => {
                if (opt.value === value) {
                  opt.selected = false;
                }
              });
              // 移除标签
              tag.remove();
              
              // 触发change事件以更新内部状态
              const event = new Event('change');
              select.dispatchEvent(event);
            });
          }
        });
      });
      
      // 初始化已有选择
      if (select.selectedOptions.length > 0) {
        const event = new Event('change');
        select.dispatchEvent(event);
      }
    }
  
    // 智能搜索功能
    function setupSmartSearch() {
      const searchInput = document.getElementById('searchInput');
      const searchButton = document.getElementById('searchButton');
      const searchResults = document.getElementById('searchResults');
      const searchResultsContent = document.getElementById('searchResultsContent');
      const searchResultsClose = document.getElementById('searchResultsClose');
      const searchLoading = document.getElementById('searchLoading');
      
      // 搜索函数
      // 缓存搜索上下文数据
      let cachedContextData = null;
      let lastDataUpdate = 0;
      
      function getContextData() {
        const currentTime = Date.now();
        // 如果缓存存在且数据在5分钟内没有更新，使用缓存
        if (cachedContextData && (currentTime - lastDataUpdate) < 300000) {
          return cachedContextData;
        }
        
        // 创建标签映射以提高性能
        const tagMap = new Map(tags.map(tag => [tag._id, tag]));
        
        cachedContextData = {
          persons: persons.map(person => ({
            name: person.name,
            phone: person.phone,
            email: person.email,
            wechat: person.wechat,
            profile: person.profile,
            tags: person.tags ? person.tags.map(tagId => {
              const tag = tagMap.get(tagId);
              return tag ? tag.name : '';
            }).filter(name => name) : []
          })),
          tags: tags.map(tag => ({
            name: tag.name,
            description: tag.description
          }))
        };
        
        lastDataUpdate = currentTime;
        return cachedContextData;
      }
      
      async function performSearch(query) {
        if (!query.trim()) return;
        
        // 显示加载状态
        showLoadingState('AI正在分析中...');
        searchResults.style.display = 'none';
        
        try {
          // 调用AI卡片搜索API
          const response = await handleAICardSearch(query);
          
          // 隐藏加载状态
          hideLoadingState();
          
          // 显示卡片式搜索结果
          displayCardSearchResults(response);
          searchResults.style.display = 'block';
          
        } catch (error) {
          console.error('搜索失败:', error);
          hideLoadingState();
          
          // 显示错误信息
          searchResultsContent.innerHTML = `
            <div style="color: #ff6b6b; text-align: center; padding: 20px;">
              <i class="bi bi-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
              <p>搜索失败，请稍后重试</p>
              <p style="font-size: 14px; color: var(--text-muted);">${error.message}</p>
            </div>
          `;
          searchResults.style.display = 'block';
        }
      }
      
      // AI卡片搜索函数
      async function handleAICardSearch(query) {
        if (!query.trim()) {
          return {
            type: 'empty',
            persons: [],
            organizations: [],
            message: '请输入您的问题。'
          };
        }

        try {
          const response = await fetch('/api/ai/card-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: query,
              searchType: 'auto',
              limit: 10
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'AI卡片搜索请求失败');
          }

          return data.data;
          
        } catch (error) {
          console.error('AI卡片搜索失败:', error);
          
          return {
            type: 'empty',
            persons: [],
            organizations: [],
            message: error.message.includes('API key') ? 
              '抱歉，AI服务暂时不可用。请检查API密钥配置。' : 
              `搜索过程中出现错误：${error.message}`
          };
        }
      }

      // 显示卡片式搜索结果
      function displayCardSearchResults(searchResult) {
        // 清空之前的内容
        searchResultsContent.innerHTML = '';
        
        // 使用卡片组件创建搜索结果
        if (window.cardComponents) {
          const resultsContainer = window.cardComponents.createSearchResultsContainer(searchResult);
          searchResultsContent.appendChild(resultsContainer);
        } else {
          // 降级处理：如果卡片组件未加载，显示简单的文字结果
          searchResultsContent.innerHTML = formatFallbackSearchResult(searchResult);
        }
      }

      // 降级搜索结果格式化（备用方案）
      function formatFallbackSearchResult(searchResult) {
        if (searchResult.type === 'empty') {
          return `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
              <i class="bi bi-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.6;"></i>
              <h3>未找到相关结果</h3>
              <p>${searchResult.message}</p>
            </div>
          `;
        }

        let html = '';
        
        if (searchResult.persons && searchResult.persons.length > 0) {
          html += `
            <div style="margin-bottom: 20px;">
              <h3 style="color: var(--text-normal); margin-bottom: 10px;">
                <i class="bi bi-people-fill"></i> 相关人员 (${searchResult.persons.length})
              </h3>
              <div style="display: grid; gap: 10px;">
                ${searchResult.persons.map(person => `
                  <div style="padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${person.avatar || '/icon/common.png'}" alt="${person.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='/icon/common.png'">
                      <div>
                        <strong>${person.name}</strong><br>
                        <small style="color: var(--text-muted);">${person.title} - ${person.company}</small>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        if (searchResult.organizations && searchResult.organizations.length > 0) {
          html += `
            <div>
              <h3 style="color: var(--text-normal); margin-bottom: 10px;">
                <i class="bi bi-building-fill"></i> 相关组织 (${searchResult.organizations.length})
              </h3>
              <div style="display: grid; gap: 10px;">
                ${searchResult.organizations.map(org => `
                  <div style="padding: 12px; border: 1px solid var(--background-modifier-border); border-radius: 8px; background: var(--background-primary);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <img src="${org.icon || '/icon/common.png'}" alt="${org.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='/icon/common.png'">
                      <div>
                        <strong>${org.name}</strong><br>
                        <small style="color: var(--text-muted);">${org.category}</small>
                        ${org.description ? `<br><small style="color: var(--text-muted);">${org.description}</small>` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        return html || `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <p>没有找到相关结果</p>
          </div>
        `;
      }

      // 保留原有的AI查询函数作为备用
      async function handleAIQuery(query) {
        if (!query.trim()) {
          return '请输入您的问题。';
        }

        try {
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({
              message: query,
              context: {
                currentView: getCurrentViewContext(),
                selectedFilters: getActiveFilters()
              }
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'AI服务请求失败');
          }

          return data.data.response;
          
        } catch (error) {
          console.error('AI查询失败:', error);
          
          if (error.message.includes('API key')) {
            return '抱歉，AI服务暂时不可用。请检查API密钥配置。';
          }
          
          return `抱歉，查询过程中出现错误：${error.message}`;
        }
      }
      
      // 辅助函数
      function getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      }

      function getCurrentViewContext() {
        // 返回当前页面的上下文信息
        return {
          page: window.location.pathname,
          activeTab: document.querySelector('.tab-button.active')?.textContent,
          searchQuery: document.querySelector('#searchInput')?.value
        };
      }

      function getActiveFilters() {
        // 返回当前激活的过滤器
        const filters = {};
        const activeTagFilters = Array.from(document.querySelectorAll('.tag-filter.active'))
          .map(el => el.textContent);
        if (activeTagFilters.length > 0) {
          filters.tags = activeTagFilters;
        }
        return filters;
      }

      function showLoadingState(message) {
        if (searchLoading) {
          searchLoading.style.display = 'flex';
        }
        const aiResponse = document.getElementById('aiResponse');
        if (aiResponse) {
          aiResponse.innerHTML = `<div class="loading-indicator">${message}</div>`;
        }
      }

      function hideLoadingState() {
        if (searchLoading) {
          searchLoading.style.display = 'none';
        }
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
      }
      
      // 简单的查询分析函数（演示用，作为AI API的备用方案）
      function analyzeQuery(query, contextData) {
        const lowerQuery = query.toLowerCase();
        
        // 检查是否询问特定标签的人员
        if (lowerQuery.includes('黑客松') || lowerQuery.includes('独立开发者')) {
          const developers = contextData.persons.filter(contact => 
            contact.tags.some(tag => 
              tag.toLowerCase().includes('开发') || 
              tag.toLowerCase().includes('黑客') ||
              tag.toLowerCase().includes('独立')
            ) ||
            contact.profile?.toLowerCase().includes('开发') ||
            contact.profile?.toLowerCase().includes('黑客')
          );
          
          if (developers.length > 0) {
            return `根据您的查询，我找到了以下可能参与黑客松或独立开发的人员：\n\n${developers.map(dev => 
              `• **${dev.name}**\n  ${dev.profile ? `简介：${dev.profile}` : ''}\n  ${dev.tags.length > 0 ? `标签：${dev.tags.join(', ')}` : ''}`
            ).join('\n\n')}`;
          } else {
            return '抱歉，在当前联系人中没有找到明确标注为黑客松参与者或独立开发者的人员。';
          }
        }
        
        // 检查是否询问联系方式
        if (lowerQuery.includes('联系方式') || lowerQuery.includes('电话') || lowerQuery.includes('邮箱')) {
          const nameMatch = lowerQuery.match(/(.+?)的联系方式|(.+?)的电话|(.+?)的邮箱/);
          if (nameMatch) {
            const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
            const person = contextData.persons.find(contact => 
              contact.name.toLowerCase().includes(name.toLowerCase())
            );
            
            if (person) {
              return `${person.name}的联系方式：\n\n${person.phone ? `📞 电话：${person.phone}` : ''}\n${person.email ? `📧 邮箱：${person.email}` : ''}\n${person.wechat ? `💬 微信：${person.wechat}` : ''}`;
            } else {
              return `抱歉，没有找到名为"${name}"的联系人。`;
            }
          }
        }
        
        // 默认回复
        return `我理解您想查询"${query}"，但我需要更具体的信息才能帮助您。\n\n您可以尝试这样问：\n• "周周黑客松的独立开发者都有谁？"\n• "张三的联系方式是什么？"\n• "有哪些人标记了'技术'标签？"`;
      }
      
      // 格式化搜索结果
      function formatSearchResult(result) {
        // 将Markdown格式转换为HTML
        return result
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/• /g, '• ')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>')
          .replace(/^/, '<p>')
          .replace(/$/, '</p>');
      }
      
      // 绑定事件监听器
      searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
          performSearch(query);
        }
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = searchInput.value.trim();
          if (query) {
            performSearch(query);
          }
        }
      });
      
      searchResultsClose.addEventListener('click', () => {
        searchResults.style.display = 'none';
      });
      
      // 点击搜索结果外部关闭
      document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && 
            !searchInput.contains(e.target) && 
            !searchButton.contains(e.target)) {
          searchResults.style.display = 'none';
        }
      });
    }
    
    // 初始化搜索功能
    setupSmartSearch();
    
    // 初始化标签关联选择器
    setupRelationSelection('tagRelatedTags', 'selectedTagRelatedTags');
    
    // 初始化认证系统
    initializeAuth();
  });
  
  // 初始化认证系统
  function initializeAuth() {
    // 更新UI以显示管理员按钮
    updateAuthUI();
    
    // 监听认证状态变化
    if (window.authManager) {
      // 定期检查认证状态
      setInterval(() => {
        updateAuthUI();
      }, 5000);
    }
  }
  
  // 更新认证相关UI
  function updateAuthUI() {
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    
    if (window.authManager && window.authManager.isAdmin()) {
      if (adminPanelBtn) {
        adminPanelBtn.style.display = 'inline-block';
      }
    } else {
      if (adminPanelBtn) {
        adminPanelBtn.style.display = 'none';
      }
    }
  }
  
  // 检查联系人所有权
  function checkContactOwnership(contactId) {
    // 这里应该调用后端API检查所有权
    // 暂时返回false，实际实现需要与后端交互
    return false;
  }
  
  // 认领联系人
  function claimContact(contactId, contactName) {
    if (!window.authManager || !window.authManager.isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    if (window.userManager) {
      window.userManager.showClaimDialog(contactId, contactName);
    }
  }
  
  // 编辑联系人
  function editContact(contactId) {
    if (!window.authManager || !window.authManager.isLoggedIn()) {
      alert('请先登录');
      return;
    }
    
    // 这里可以实现编辑联系人的逻辑
    alert('编辑功能正在开发中...');
  }
  
  // 移动端导航切换函数（全局函数）
  function toggleMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
  }
  
  // 将函数暴露到全局作用域
  window.checkContactOwnership = checkContactOwnership;
  window.claimContact = claimContact;
  window.editContact = editContact;
  window.toggleMobileNav = toggleMobileNav;