/**
 * AI卡片式搜索组件
 * 包含PersonCard和OrganizationCard组件
 */

class CardComponents {
  constructor() {
    this.mapJumpCallback = null;
  }

  // 设置地图跳转回调函数
  setMapJumpCallback(callback) {
    this.mapJumpCallback = callback;
  }

  // 创建人物卡片
  createPersonCard(person, onClick = null) {
    const cardElement = document.createElement('div');
    cardElement.className = 'person-card card-item';
    cardElement.setAttribute('data-person-id', person.id);
    
    cardElement.innerHTML = `
      <div class="card-header">
        <img src="${person.avatar || '/icon/common.png'}" alt="${person.name}" class="card-avatar" onerror="this.src='/icon/common.png'">
        <div class="card-info">
          <h3 class="card-name">${this.escapeHtml(person.name)}</h3>
          <p class="card-title">${this.escapeHtml(person.title)}</p>
          <p class="card-company">${this.escapeHtml(person.company)}</p>
        </div>
      </div>
      <div class="card-body">
        ${person.tags && person.tags.length > 0 ? `
          <div class="card-tags">
            ${person.tags.slice(0, 3).map(tag => 
              `<span class="card-tag">${this.escapeHtml(tag)}</span>`
            ).join('')}
            ${person.tags.length > 3 ? `<span class="card-tag-more">+${person.tags.length - 3}</span>` : ''}
          </div>
        ` : ''}
        ${person.contact && (person.contact.email || person.contact.phone) ? `
          <div class="card-contact">
            ${person.contact.email ? `
              <div class="contact-item">
                <i class="bi bi-envelope"></i>
                <span>${this.escapeHtml(person.contact.email)}</span>
              </div>
            ` : ''}
            ${person.contact.phone ? `
              <div class="contact-item">
                <i class="bi bi-telephone"></i>
                <span>${this.escapeHtml(person.contact.phone)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;

    // 添加点击事件
    if (onClick) {
      cardElement.addEventListener('click', () => onClick(person));
      cardElement.style.cursor = 'pointer';
    }

    return cardElement;
  }

  // 创建组织卡片
  createOrganizationCard(organization, onMapJump = null) {
    const cardElement = document.createElement('div');
    cardElement.className = 'organization-card card-item';
    cardElement.setAttribute('data-organization-id', organization.id);
    
    cardElement.innerHTML = `
      <div class="card-header">
        <img src="${organization.icon || '/icon/common.png'}" alt="${organization.name}" class="card-icon" onerror="this.src='/icon/common.png'">
        <div class="card-info">
          <h3 class="card-name">${this.escapeHtml(organization.name)}</h3>
          <span class="card-category">${this.escapeHtml(organization.category)}</span>
          ${organization.description ? `<p class="card-description">${this.escapeHtml(organization.description)}</p>` : ''}
        </div>
      </div>
      <div class="card-body">
        <button class="map-jump-btn">
          <i class="bi bi-diagram-3-fill"></i>
          在关系图中查看
        </button>
        ${organization.relatedPersons && organization.relatedPersons.length > 0 ? `
          <div class="related-persons">
            <h4 class="related-title">
              <i class="bi bi-people-fill"></i>
              相关人员 (${organization.relatedPersons.length})
            </h4>
            <div class="persons-grid">
              ${organization.relatedPersons.slice(0, 3).map(person => `
                <div class="mini-person-card" data-person-id="${person.id}">
                  <img src="${person.avatar || '/icon/common.png'}" alt="${person.name}" class="mini-avatar" onerror="this.src='/icon/common.png'">
                  <div class="mini-info">
                    <span class="mini-name">${this.escapeHtml(person.name)}</span>
                    <span class="mini-title">${this.escapeHtml(person.title)}</span>
                  </div>
                </div>
              `).join('')}
              ${organization.relatedPersons.length > 3 ? `
                <div class="mini-person-more">
                  <span>+${organization.relatedPersons.length - 3} 更多</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // 添加关系图跳转事件
    const mapJumpBtn = cardElement.querySelector('.map-jump-btn');
    if (mapJumpBtn) {
      mapJumpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const callback = onMapJump || this.mapJumpCallback;
        if (callback) {
          callback(organization.location, organization.name);
        } else {
          // 默认跳转到关系图谱
          this.jumpToMap(organization.location, organization.name);
        }
      });
    }

    // 添加相关人员点击事件
    const miniPersonCards = cardElement.querySelectorAll('.mini-person-card');
    miniPersonCards.forEach(miniCard => {
      miniCard.addEventListener('click', (e) => {
        e.stopPropagation();
        const personId = miniCard.getAttribute('data-person-id');
        const person = organization.relatedPersons.find(p => p.id === personId);
        if (person) {
          this.showPersonDetails(person);
        }
      });
    });

    return cardElement;
  }

  // 创建空结果提示
  createEmptyResult(message) {
    const emptyElement = document.createElement('div');
    emptyElement.className = 'empty-result';
    
    emptyElement.innerHTML = `
      <div class="empty-content">
        <i class="bi bi-search empty-icon"></i>
        <h3 class="empty-title">未找到相关结果</h3>
        <p class="empty-message">${this.escapeHtml(message)}</p>
        <div class="empty-suggestions">
          <p>您可以尝试：</p>
          <ul>
            <li>使用不同的关键词</li>
            <li>检查拼写是否正确</li>
            <li>使用更通用的搜索词</li>
          </ul>
        </div>
      </div>
    `;

    return emptyElement;
  }

  // 创建搜索结果容器
  createSearchResultsContainer(searchResult) {
    const container = document.createElement('div');
    container.className = 'search-results-cards';

    // 根据搜索结果类型创建相应的卡片
    if (searchResult.type === 'empty') {
      container.appendChild(this.createEmptyResult(searchResult.message));
      return container;
    }

    // 创建人物卡片区域
    if (searchResult.persons && searchResult.persons.length > 0) {
      const personsSection = document.createElement('div');
      personsSection.className = 'cards-section';
      personsSection.innerHTML = `
        <h3 class="section-title">
          <i class="bi bi-people-fill"></i>
          相关人员 (${searchResult.persons.length})
        </h3>
        <div class="cards-grid" id="personsGrid"></div>
      `;
      
      const personsGrid = personsSection.querySelector('#personsGrid');
      searchResult.persons.forEach(person => {
        const personCard = this.createPersonCard(person, (p) => this.showPersonDetails(p));
        personsGrid.appendChild(personCard);
      });
      
      container.appendChild(personsSection);
    }

    // 创建组织卡片区域
    if (searchResult.organizations && searchResult.organizations.length > 0) {
      const orgsSection = document.createElement('div');
      orgsSection.className = 'cards-section';
      orgsSection.innerHTML = `
        <h3 class="section-title">
          <i class="bi bi-building-fill"></i>
          相关组织 (${searchResult.organizations.length})
        </h3>
        <div class="cards-grid" id="organizationsGrid"></div>
      `;
      
      const orgsGrid = orgsSection.querySelector('#organizationsGrid');
      searchResult.organizations.forEach(org => {
        const orgCard = this.createOrganizationCard(org);
        orgsGrid.appendChild(orgCard);
      });
      
      container.appendChild(orgsSection);
    }

    return container;
  }

  // 显示人物详情（可以与现有的详情面板集成）
  showPersonDetails(person) {
    // 这里可以调用现有的showDetailPanel函数
    if (typeof showDetailPanel === 'function') {
      // 转换为现有系统的数据格式
      const nodeData = {
        type: 'person',
        _id: person.id,
        name: person.name,
        avatar: person.avatar,
        title: person.title,
        company: person.company,
        email: person.contact?.email,
        phone: person.contact?.phone,
        tags: person.tags?.map(tag => ({ name: tag })) || []
      };
      showDetailPanel(nodeData);
    } else {
      console.log('显示人物详情:', person);
    }
  }

  // 地图跳转功能 - 跳转到关系图谱
  jumpToMap(location, organizationName) {
    // 关闭搜索结果面板
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.style.display = 'none';
    }
    
    // 显示成功提示
    this.showToast(`已跳转到关系图谱${organizationName ? ' - ' + organizationName : ''}`, 'success');
    
    // 可以在这里添加高亮显示相关组织节点的逻辑
    // 例如：highlightOrganizationInGraph(organizationName);
    if (organizationName && typeof window.highlightNodeByName === 'function') {
      setTimeout(() => {
        window.highlightNodeByName(organizationName);
      }, 500);
    }
  }



  // 显示提示消息
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="bi bi-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-triangle'}"></i>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // 自动移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // HTML转义函数
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 创建全局实例
window.cardComponents = new CardComponents();