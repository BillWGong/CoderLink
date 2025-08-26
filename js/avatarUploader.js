/**
 * 现代化头像上传组件
 * 提供拖拽上传、进度指示、预览增强、裁剪等功能
 */

class AvatarUploader {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      throw new Error('容器元素未找到');
    }

    this.config = {
      // 文件验证配置
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'],
      // 图像处理配置
      outputSize: options.outputSize || { width: 300, height: 300 },
      quality: options.quality || 0.85,
      // UI配置
      showProgress: options.showProgress !== false,
      enableCrop: options.enableCrop !== false,
      enablePreview: options.enablePreview !== false,
      // 回调函数
      onUploadStart: options.onUploadStart || null,
      onUploadProgress: options.onUploadProgress || null,
      onUploadComplete: options.onUploadComplete || null,
      onUploadError: options.onUploadError || null,
      onImageSelect: options.onImageSelect || null,
      // 样式配置
      theme: options.theme || 'default',
      className: options.className || ''
    };

    // 错误处理器
    this.errorHandler = options.errorHandler || window.errorHandler;

    this.state = {
      isDragging: false,
      isUploading: false,
      currentFile: null,
      currentImage: null,
      cropData: null,
      progress: 0
    };

    // 初始化组件
    this.fileValidator = new FileValidator();
    this.imageProcessor = new ImageProcessor({
      maxOutputSize: this.config.outputSize,
      defaultQuality: this.config.quality
    });

    // 绑定错误处理方法
    this.handleError = this.handleError.bind(this);

    this.init();
  }

  /**
   * 初始化组件
   */
  init() {
    this.createHTML();
    this.bindEvents();
    this.updateUI();
  }

  /**
   * 创建HTML结构
   */
  createHTML() {
    this.container.innerHTML = `
      <div class="avatar-uploader ${this.config.className}" data-theme="${this.config.theme}">
        <!-- 主上传区域 -->
        <div class="upload-area" id="uploadArea">
          <div class="upload-content">
            <div class="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <div class="upload-text">
              <p class="upload-title">拖拽图片到此处或点击上传</p>
              <p class="upload-subtitle">支持 JPG、PNG、WebP 格式，最大 5MB</p>
            </div>
          </div>
          
          <!-- 隐藏的文件输入 -->
          <input type="file" id="fileInput" accept="image/*" style="display: none;">
        </div>

        <!-- 预览区域 -->
        <div class="preview-area" id="previewArea" style="display: none;">
          <div class="preview-container">
            <div class="preview-image-wrapper">
              <img id="previewImage" class="preview-image" alt="预览图片">
              <div class="preview-overlay">
                <button type="button" class="preview-btn crop-btn" id="cropBtn" title="裁剪">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
                    <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
                  </svg>
                </button>
                <button type="button" class="preview-btn remove-btn" id="removeBtn" title="删除">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 图片信息 -->
            <div class="image-info" id="imageInfo">
              <div class="info-item">
                <span class="info-label">尺寸:</span>
                <span class="info-value" id="imageDimensions">-</span>
              </div>
              <div class="info-item">
                <span class="info-label">大小:</span>
                <span class="info-value" id="imageSize">-</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-container" id="progressContainer" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
          </div>
          <div class="progress-text">
            <span id="progressText">处理中...</span>
            <span id="progressPercent">0%</span>
          </div>
        </div>

        <!-- 错误消息 -->
        <div class="error-message" id="errorMessage" style="display: none;">
          <div class="error-content">
            <svg class="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span id="errorText"></span>
          </div>
          <button type="button" class="error-close" id="errorClose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 裁剪模态框 -->
        <div class="crop-modal" id="cropModal" style="display: none;">
          <div class="crop-modal-content">
            <div class="crop-modal-header">
              <h3>裁剪图片</h3>
              <button type="button" class="crop-modal-close" id="cropModalClose">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="crop-modal-body">
              <div class="crop-container">
                <img id="cropImage" class="crop-image" alt="裁剪图片">
              </div>
            </div>
            <div class="crop-modal-footer">
              <button type="button" class="btn btn-secondary" id="cropCancel">取消</button>
              <button type="button" class="btn btn-primary" id="cropConfirm">确认裁剪</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 获取DOM元素引用
    this.elements = {
      uploadArea: this.container.querySelector('#uploadArea'),
      fileInput: this.container.querySelector('#fileInput'),
      previewArea: this.container.querySelector('#previewArea'),
      previewImage: this.container.querySelector('#previewImage'),
      imageInfo: this.container.querySelector('#imageInfo'),
      imageDimensions: this.container.querySelector('#imageDimensions'),
      imageSize: this.container.querySelector('#imageSize'),
      progressContainer: this.container.querySelector('#progressContainer'),
      progressFill: this.container.querySelector('#progressFill'),
      progressText: this.container.querySelector('#progressText'),
      progressPercent: this.container.querySelector('#progressPercent'),
      errorMessage: this.container.querySelector('#errorMessage'),
      errorText: this.container.querySelector('#errorText'),
      errorClose: this.container.querySelector('#errorClose'),
      cropBtn: this.container.querySelector('#cropBtn'),
      removeBtn: this.container.querySelector('#removeBtn'),
      cropModal: this.container.querySelector('#cropModal'),
      cropImage: this.container.querySelector('#cropImage'),
      cropModalClose: this.container.querySelector('#cropModalClose'),
      cropCancel: this.container.querySelector('#cropCancel'),
      cropConfirm: this.container.querySelector('#cropConfirm')
    };
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 拖拽事件
    this.elements.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.elements.uploadArea.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.elements.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.elements.uploadArea.addEventListener('drop', this.handleDrop.bind(this));

    // 点击上传
    this.elements.uploadArea.addEventListener('click', () => {
      if (!this.state.isUploading) {
        this.elements.fileInput.click();
      }
    });

    // 文件选择
    this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // 预览操作
    this.elements.cropBtn.addEventListener('click', this.openCropModal.bind(this));
    this.elements.removeBtn.addEventListener('click', this.removeImage.bind(this));

    // 错误消息关闭
    this.elements.errorClose.addEventListener('click', this.hideError.bind(this));

    // 裁剪模态框
    this.elements.cropModalClose.addEventListener('click', this.closeCropModal.bind(this));
    this.elements.cropCancel.addEventListener('click', this.closeCropModal.bind(this));
    this.elements.cropConfirm.addEventListener('click', this.confirmCrop.bind(this));

    // 键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * 处理拖拽悬停
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /**
   * 处理拖拽进入
   */
  handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!this.state.isDragging && !this.state.isUploading) {
      this.state.isDragging = true;
      this.elements.uploadArea.classList.add('drag-over');
    }
  }

  /**
   * 处理拖拽离开
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // 检查是否真的离开了上传区域
    if (!this.elements.uploadArea.contains(e.relatedTarget)) {
      this.state.isDragging = false;
      this.elements.uploadArea.classList.remove('drag-over');
    }
  }

  /**
   * 处理文件拖放
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.state.isDragging = false;
    this.elements.uploadArea.classList.remove('drag-over');
    
    if (this.state.isUploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  }

  /**
   * 处理文件选择
   */
  async handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await this.processFileWithErrorHandling(files[0]);
    }
  }

  /**
   * 带错误处理的文件处理
   */
  async processFileWithErrorHandling(file) {
    try {
      // 文件验证
      const validationResult = await this.fileValidator.validateFile(file);
      if (!validationResult.isValid) {
        this.handleError({
          type: 'validation',
          message: 'File validation failed',
          details: validationResult.errors.join(', '),
          context: { file: file.name, size: file.size, type: file.type },
          recoverable: true
        });
        return;
      }

      // 处理文件
      await this.processFile(file);
      
    } catch (error) {
      this.handleError({
        type: 'file',
        message: error.message || 'File processing failed',
        details: '文件处理过程中发生错误',
        context: { file: file.name, error: error.toString() },
        recoverable: true,
        error: error
      });
    }
  }

  /**
   * 处理文件
   */
  async processFile(file) {
    try {
      this.hideError();
      
      // 文件验证
      const validationResult = await this.fileValidator.validateFile(file);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join(', '));
      }

      this.state.currentFile = file;
      
      // 触发上传开始回调
      if (this.config.onUploadStart) {
        this.config.onUploadStart(file);
      }

      // 显示进度
      this.showProgress('读取文件中...');
      
      // 获取图像信息
      const imageInfo = await this.imageProcessor.getImageInfo(file);
      
      // 更新进度
      this.updateProgress(30, '处理图像中...');
      
      // 处理图像
      const processResult = await this.imageProcessor.processImage(file, {
        maxOutputSize: this.config.outputSize,
        defaultQuality: this.config.quality
      });
      
      // 更新进度
      this.updateProgress(80, '生成预览中...');
      
      // 显示预览
      this.showPreview(processResult.dataUrl, imageInfo, processResult.metadata);
      
      // 完成
      this.updateProgress(100, '完成');
      
      setTimeout(() => {
        this.hideProgress();
      }, 500);
      
      // 触发图像选择回调
      if (this.config.onImageSelect) {
        this.config.onImageSelect({
          file,
          processedData: processResult,
          imageInfo
        });
      }
      
    } catch (error) {
      this.hideProgress();
      this.showError(error.message);
      
      if (this.config.onUploadError) {
        this.config.onUploadError(error);
      }
    }
  }

  /**
   * 显示预览
   */
  showPreview(dataUrl, imageInfo, metadata) {
    try {
      this.elements.previewImage.src = dataUrl;
      this.elements.imageDimensions.textContent = `${imageInfo.width} × ${imageInfo.height}`;
      this.elements.imageSize.textContent = this.formatFileSize(imageInfo.fileSize);
      
      this.elements.uploadArea.style.display = 'none';
      this.elements.previewArea.style.display = 'block';
      
      this.state.currentImage = {
        dataUrl,
        imageInfo,
        metadata
      };
    } catch (error) {
      this.handleError({
        type: 'preview',
        message: error.message || 'Preview display failed',
        details: '预览显示过程中发生错误',
        context: { imageInfo },
        recoverable: true,
        error: error
      });
    }
  }

  /**
   * 移除图像
   */
  removeImage() {
    this.elements.previewArea.style.display = 'none';
    this.elements.uploadArea.style.display = 'block';
    this.elements.fileInput.value = '';
    
    this.state.currentFile = null;
    this.state.currentImage = null;
    this.state.cropData = null;
    
    this.hideError();
  }

  /**
   * 显示进度
   */
  showProgress(text = '处理中...') {
    this.state.isUploading = true;
    this.elements.progressContainer.style.display = 'block';
    this.elements.progressText.textContent = text;
    this.elements.progressPercent.textContent = '0%';
    this.elements.progressFill.style.width = '0%';
    
    this.updateUI();
  }

  /**
   * 更新进度
   */
  updateProgress(percent, text) {
    this.state.progress = percent;
    this.elements.progressFill.style.width = `${percent}%`;
    this.elements.progressPercent.textContent = `${percent}%`;
    
    if (text) {
      this.elements.progressText.textContent = text;
    }
    
    if (this.config.onUploadProgress) {
      this.config.onUploadProgress(percent, text);
    }
  }

  /**
   * 隐藏进度
   */
  hideProgress() {
    this.state.isUploading = false;
    this.elements.progressContainer.style.display = 'none';
    this.updateUI();
  }

  /**
   * 处理错误
   */
  handleError(errorInfo) {
    // 使用全局错误处理器
    if (this.errorHandler) {
      this.errorHandler.handleError(errorInfo, {
        component: 'AvatarUploader',
        container: this.container.id || 'unknown'
      });
    } else {
      // 降级到本地错误显示
      this.showLocalError(errorInfo.userMessage || errorInfo.message || '发生未知错误');
    }
    
    // 触发错误回调
    if (this.config.onUploadError) {
      this.config.onUploadError(errorInfo);
    }
  }

  /**
   * 显示本地错误消息（降级方案）
   */
  showLocalError(message) {
    this.elements.errorText.textContent = message;
    this.elements.errorMessage.style.display = 'block';
  }

  /**
   * 显示错误
   */
  showError(message) {
    this.showLocalError(message);
  }

  /**
   * 隐藏错误
   */
  hideError() {
    this.elements.errorMessage.style.display = 'none';
  }

  /**
   * 打开裁剪模态框
   */
  openCropModal() {
    if (!this.state.currentImage) return;
    
    this.elements.cropImage.src = this.state.currentImage.dataUrl;
    this.elements.cropModal.style.display = 'flex';
    
    // 这里可以集成第三方裁剪库，如 Cropper.js
    // 为了简化，这里只是显示模态框
  }

  /**
   * 关闭裁剪模态框
   */
  closeCropModal() {
    this.elements.cropModal.style.display = 'none';
  }

  /**
   * 确认裁剪
   */
  async confirmCrop() {
    // 这里应该实现实际的裁剪逻辑
    // 为了简化，这里只是关闭模态框
    this.closeCropModal();
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(e) {
    // ESC 键关闭模态框
    if (e.key === 'Escape') {
      if (this.elements.cropModal.style.display === 'flex') {
        this.closeCropModal();
      }
    }
  }

  /**
   * 更新UI状态
   */
  updateUI() {
    const uploader = this.container.querySelector('.avatar-uploader');
    
    if (this.state.isUploading) {
      uploader.classList.add('uploading');
    } else {
      uploader.classList.remove('uploading');
    }
    
    if (this.state.isDragging) {
      uploader.classList.add('dragging');
    } else {
      uploader.classList.remove('dragging');
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取当前图像数据
   */
  getCurrentImage() {
    return this.state.currentImage;
  }

  /**
   * 获取当前文件
   */
  getCurrentFile() {
    return this.state.currentFile;
  }

  /**
   * 重置组件
   */
  reset() {
    this.removeImage();
    this.hideProgress();
    this.hideError();
    this.closeCropModal();
    
    // 清除全局错误处理器中的相关错误
    if (this.errorHandler && this.errorHandler.clearComponentErrors) {
      this.errorHandler.clearComponentErrors('AvatarUploader', this.container.id || 'unknown');
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    // 移除事件监听器
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 清空容器
    this.container.innerHTML = '';
    
    // 重置状态
    this.state = {
      isDragging: false,
      isUploading: false,
      currentFile: null,
      currentImage: null,
      cropData: null,
      progress: 0
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AvatarUploader;
} else {
  window.AvatarUploader = AvatarUploader;
}