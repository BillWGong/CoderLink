/**
 * 无障碍功能增强模块
 * 提供ARIA标签、键盘导航、屏幕阅读器支持等功能
 */

class AccessibilityEnhancer {
  constructor(options = {}) {
    this.config = {
      // 语言设置
      language: options.language || 'zh-CN',
      // 是否启用键盘导航
      enableKeyboardNavigation: options.enableKeyboardNavigation !== false,
      // 是否启用屏幕阅读器支持
      enableScreenReader: options.enableScreenReader !== false,
      // 是否启用高对比度模式
      enableHighContrast: options.enableHighContrast !== false,
      // 是否启用焦点管理
      enableFocusManagement: options.enableFocusManagement !== false,
      // 自定义消息
      messages: {
        ...this.getDefaultMessages(),
        ...options.messages
      }
    };

    this.state = {
      isHighContrast: false,
      currentFocus: null,
      announcements: [],
      keyboardTrapStack: []
    };

    this.init();
  }

  /**
   * 初始化无障碍功能
   */
  init() {
    this.createAriaLiveRegion();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupHighContrastMode();
    this.detectAccessibilityPreferences();
  }

  /**
   * 获取默认消息
   */
  getDefaultMessages() {
    return {
      'zh-CN': {
        fileSelected: '已选择文件',
        fileRemoved: '已移除文件',
        uploadStarted: '开始上传',
        uploadProgress: '上传进度',
        uploadComplete: '上传完成',
        uploadError: '上传失败',
        dragEnter: '拖拽文件到此处',
        dragLeave: '离开拖拽区域',
        cropModalOpen: '裁剪模态框已打开',
        cropModalClose: '裁剪模态框已关闭',
        imagePreview: '图片预览',
        cropImage: '裁剪图片',
        removeImage: '删除图片',
        selectFile: '选择文件',
        closeModal: '关闭模态框',
        confirmCrop: '确认裁剪',
        cancelCrop: '取消裁剪',
        errorClose: '关闭错误消息',
        keyboardInstructions: '使用Tab键导航，Enter键激活，Escape键关闭模态框'
      },
      'en': {
        fileSelected: 'File selected',
        fileRemoved: 'File removed',
        uploadStarted: 'Upload started',
        uploadProgress: 'Upload progress',
        uploadComplete: 'Upload complete',
        uploadError: 'Upload failed',
        dragEnter: 'Drag file here',
        dragLeave: 'Left drag area',
        cropModalOpen: 'Crop modal opened',
        cropModalClose: 'Crop modal closed',
        imagePreview: 'Image preview',
        cropImage: 'Crop image',
        removeImage: 'Remove image',
        selectFile: 'Select file',
        closeModal: 'Close modal',
        confirmCrop: 'Confirm crop',
        cancelCrop: 'Cancel crop',
        errorClose: 'Close error message',
        keyboardInstructions: 'Use Tab to navigate, Enter to activate, Escape to close modal'
      }
    };
  }

  /**
   * 获取本地化消息
   */
  getMessage(key) {
    const messages = this.config.messages[this.config.language] || this.config.messages['zh-CN'];
    return messages[key] || key;
  }

  /**
   * 创建ARIA Live区域
   */
  createAriaLiveRegion() {
    // 创建polite区域（非紧急通知）
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.setAttribute('class', 'sr-only');
    this.politeRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.politeRegion);

    // 创建assertive区域（紧急通知）
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.setAttribute('class', 'sr-only');
    this.assertiveRegion.style.cssText = this.politeRegion.style.cssText;
    document.body.appendChild(this.assertiveRegion);
  }

  /**
   * 向屏幕阅读器宣布消息
   */
  announce(message, priority = 'polite') {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    // 清空区域
    region.textContent = '';
    
    // 延迟添加消息以确保屏幕阅读器能够检测到变化
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // 记录通知历史
    this.state.announcements.push({
      message,
      priority,
      timestamp: Date.now()
    });

    // 限制历史记录数量
    if (this.state.announcements.length > 50) {
      this.state.announcements = this.state.announcements.slice(-25);
    }
  }

  /**
   * 增强元素的无障碍属性
   */
  enhanceElement(element, options = {}) {
    if (!element) return;

    const {
      role,
      label,
      describedBy,
      expanded,
      selected,
      disabled,
      required,
      invalid,
      live,
      atomic,
      relevant,
      busy,
      hidden,
      tabIndex,
      keyboardHandler
    } = options;

    // 设置角色
    if (role) {
      element.setAttribute('role', role);
    }

    // 设置标签
    if (label) {
      element.setAttribute('aria-label', label);
    }

    // 设置描述
    if (describedBy) {
      element.setAttribute('aria-describedby', describedBy);
    }

    // 设置展开状态
    if (expanded !== undefined) {
      element.setAttribute('aria-expanded', expanded.toString());
    }

    // 设置选中状态
    if (selected !== undefined) {
      element.setAttribute('aria-selected', selected.toString());
    }

    // 设置禁用状态
    if (disabled !== undefined) {
      element.setAttribute('aria-disabled', disabled.toString());
      if (disabled) {
        element.setAttribute('tabindex', '-1');
      }
    }

    // 设置必填状态
    if (required !== undefined) {
      element.setAttribute('aria-required', required.toString());
    }

    // 设置无效状态
    if (invalid !== undefined) {
      element.setAttribute('aria-invalid', invalid.toString());
    }

    // 设置live区域
    if (live) {
      element.setAttribute('aria-live', live);
    }

    // 设置atomic
    if (atomic !== undefined) {
      element.setAttribute('aria-atomic', atomic.toString());
    }

    // 设置relevant
    if (relevant) {
      element.setAttribute('aria-relevant', relevant);
    }

    // 设置busy状态
    if (busy !== undefined) {
      element.setAttribute('aria-busy', busy.toString());
    }

    // 设置隐藏状态
    if (hidden !== undefined) {
      element.setAttribute('aria-hidden', hidden.toString());
      if (hidden) {
        element.setAttribute('tabindex', '-1');
      }
    }

    // 设置tab索引
    if (tabIndex !== undefined) {
      element.setAttribute('tabindex', tabIndex.toString());
    }

    // 添加键盘事件处理
    if (keyboardHandler && this.config.enableKeyboardNavigation) {
      element.addEventListener('keydown', keyboardHandler);
    }

    return element;
  }

  /**
   * 设置键盘导航
   */
  setupKeyboardNavigation() {
    if (!this.config.enableKeyboardNavigation) return;

    // 全局键盘事件处理
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeyDown(e);
    });

    // 焦点可见性处理
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  /**
   * 处理全局键盘事件
   */
  handleGlobalKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        this.handleEscapeKey(e);
        break;
      case 'Tab':
        this.handleTabKey(e);
        break;
      case 'Enter':
      case ' ':
        this.handleActivationKey(e);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKey(e);
        break;
    }
  }

  /**
   * 处理Escape键
   */
  handleEscapeKey(e) {
    // 关闭模态框
    const modal = document.querySelector('.crop-modal[style*="flex"]');
    if (modal) {
      const closeBtn = modal.querySelector('.crop-modal-close');
      if (closeBtn) {
        closeBtn.click();
        e.preventDefault();
      }
    }

    // 清除错误消息
    const errorMessage = document.querySelector('.error-message[style*="block"]');
    if (errorMessage) {
      const closeBtn = errorMessage.querySelector('.error-close');
      if (closeBtn) {
        closeBtn.click();
        e.preventDefault();
      }
    }
  }

  /**
   * 处理Tab键
   */
  handleTabKey(e) {
    // 键盘陷阱处理
    if (this.state.keyboardTrapStack.length > 0) {
      const currentTrap = this.state.keyboardTrapStack[this.state.keyboardTrapStack.length - 1];
      this.handleKeyboardTrap(e, currentTrap);
    }
  }

  /**
   * 处理激活键（Enter/Space）
   */
  handleActivationKey(e) {
    const target = e.target;
    
    // 如果目标有role="button"，触发点击
    if (target.getAttribute('role') === 'button' || target.classList.contains('upload-area')) {
      if (!target.hasAttribute('aria-disabled') || target.getAttribute('aria-disabled') === 'false') {
        target.click();
        e.preventDefault();
      }
    }
  }

  /**
   * 处理箭头键
   */
  handleArrowKey(e) {
    // 在特定容器中的箭头键导航
    const container = e.target.closest('[role="group"], [role="toolbar"], .preview-overlay');
    if (container) {
      this.handleContainerNavigation(e, container);
    }
  }

  /**
   * 处理容器内导航
   */
  handleContainerNavigation(e, container) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(e.target);
    let nextIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        break;
      default:
        return;
    }

    if (focusableElements[nextIndex]) {
      focusableElements[nextIndex].focus();
      e.preventDefault();
    }
  }

  /**
   * 设置焦点管理
   */
  setupFocusManagement() {
    if (!this.config.enableFocusManagement) return;

    // 焦点跟踪
    document.addEventListener('focusin', (e) => {
      this.state.currentFocus = e.target;
    });

    document.addEventListener('focusout', (e) => {
      // 延迟检查，确保新焦点已设置
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          this.state.currentFocus = null;
        }
      }, 0);
    });
  }

  /**
   * 设置键盘陷阱
   */
  setKeyboardTrap(container) {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const trapData = {
      container,
      firstElement,
      lastElement,
      previousFocus: this.state.currentFocus
    };

    this.state.keyboardTrapStack.push(trapData);

    // 设置初始焦点
    firstElement.focus();

    return trapData;
  }

  /**
   * 处理键盘陷阱
   */
  handleKeyboardTrap(e, trapData) {
    if (e.key !== 'Tab') return;

    const { firstElement, lastElement } = trapData;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  /**
   * 移除键盘陷阱
   */
  removeKeyboardTrap() {
    const trapData = this.state.keyboardTrapStack.pop();
    
    if (trapData && trapData.previousFocus) {
      // 恢复之前的焦点
      trapData.previousFocus.focus();
    }

    return trapData;
  }

  /**
   * 设置高对比度模式
   */
  setupHighContrastMode() {
    if (!this.config.enableHighContrast) return;

    // 检测系统高对比度偏好
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      this.enableHighContrast();
    }

    // 监听偏好变化
    if (window.matchMedia) {
      window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
        if (e.matches) {
          this.enableHighContrast();
        } else {
          this.disableHighContrast();
        }
      });
    }
  }

  /**
   * 启用高对比度模式
   */
  enableHighContrast() {
    document.body.classList.add('high-contrast');
    this.state.isHighContrast = true;
    this.announce('已启用高对比度模式');
  }

  /**
   * 禁用高对比度模式
   */
  disableHighContrast() {
    document.body.classList.remove('high-contrast');
    this.state.isHighContrast = false;
    this.announce('已禁用高对比度模式');
  }

  /**
   * 检测无障碍偏好
   */
  detectAccessibilityPreferences() {
    // 检测减少动画偏好
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }

    // 检测颜色方案偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    }
  }

  /**
   * 创建描述元素
   */
  createDescription(id, text) {
    let description = document.getElementById(id);
    
    if (!description) {
      description = document.createElement('div');
      description.id = id;
      description.className = 'sr-only';
      description.style.cssText = this.politeRegion.style.cssText;
      document.body.appendChild(description);
    }
    
    description.textContent = text;
    return description;
  }

  /**
   * 获取无障碍状态
   */
  getAccessibilityState() {
    return {
      isHighContrast: this.state.isHighContrast,
      currentFocus: this.state.currentFocus,
      keyboardTrapsActive: this.state.keyboardTrapStack.length,
      recentAnnouncements: this.state.announcements.slice(-5)
    };
  }

  /**
   * 销毁无障碍增强器
   */
  destroy() {
    // 移除ARIA Live区域
    if (this.politeRegion && this.politeRegion.parentNode) {
      this.politeRegion.parentNode.removeChild(this.politeRegion);
    }
    
    if (this.assertiveRegion && this.assertiveRegion.parentNode) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }

    // 清除键盘陷阱
    while (this.state.keyboardTrapStack.length > 0) {
      this.removeKeyboardTrap();
    }

    // 重置状态
    this.state = {
      isHighContrast: false,
      currentFocus: null,
      announcements: [],
      keyboardTrapStack: []
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityEnhancer;
} else {
  window.AccessibilityEnhancer = AccessibilityEnhancer;
}