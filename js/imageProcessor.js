/**
 * 企业级图像处理模块
 * 提供图像压缩、调整大小、裁剪、格式转换等功能
 */

class ImageProcessor {
  constructor(options = {}) {
    this.config = {
      // 默认压缩质量 (0.1 - 1.0)
      defaultQuality: options.defaultQuality || 0.85,
      // 最大输出尺寸
      maxOutputSize: options.maxOutputSize || { width: 1024, height: 1024 },
      // 默认输出格式
      defaultFormat: options.defaultFormat || 'image/jpeg',
      // 是否保持宽高比
      maintainAspectRatio: options.maintainAspectRatio !== false,
      // 背景色（用于透明图片转换）
      backgroundColor: options.backgroundColor || '#FFFFFF'
    };
  }

  /**
   * 处理图像文件
   * @param {File} file - 原始图像文件
   * @param {Object} options - 处理选项
   * @returns {Promise<{blob: Blob, dataUrl: string, metadata: Object}>}
   */
  async processImage(file, options = {}) {
    const config = { ...this.config, ...options };
    
    try {
      // 加载图像
      const img = await this._loadImage(file);
      
      // 计算目标尺寸
      const targetDimensions = this._calculateTargetDimensions(
        img.width, 
        img.height, 
        config.maxOutputSize,
        config.maintainAspectRatio
      );
      
      // 创建画布并绘制图像
      const canvas = this._createCanvas(targetDimensions.width, targetDimensions.height);
      const ctx = canvas.getContext('2d');
      
      // 设置图像渲染质量
      this._setCanvasQuality(ctx);
      
      // 如果需要背景色（处理透明图片）
      if (config.defaultFormat === 'image/jpeg' || config.backgroundColor) {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // 绘制图像
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 转换为Blob
      const blob = await this._canvasToBlob(canvas, config.defaultFormat, config.defaultQuality);
      
      // 生成数据URL
      const dataUrl = canvas.toDataURL(config.defaultFormat, config.defaultQuality);
      
      // 生成元数据
      const metadata = {
        originalSize: { width: img.width, height: img.height },
        processedSize: { width: canvas.width, height: canvas.height },
        originalFileSize: file.size,
        processedFileSize: blob.size,
        compressionRatio: (1 - blob.size / file.size).toFixed(2),
        format: config.defaultFormat,
        quality: config.defaultQuality,
        timestamp: Date.now()
      };
      
      return { blob, dataUrl, metadata };
      
    } catch (error) {
      throw new Error(`图像处理失败: ${error.message}`);
    }
  }

  /**
   * 裁剪图像
   * @param {File} file - 原始图像文件
   * @param {Object} cropArea - 裁剪区域 {x, y, width, height}
   * @param {Object} options - 处理选项
   * @returns {Promise<{blob: Blob, dataUrl: string, metadata: Object}>}
   */
  async cropImage(file, cropArea, options = {}) {
    const config = { ...this.config, ...options };
    
    try {
      const img = await this._loadImage(file);
      
      // 验证裁剪区域
      const validatedCropArea = this._validateCropArea(cropArea, img.width, img.height);
      
      // 创建画布
      const canvas = this._createCanvas(validatedCropArea.width, validatedCropArea.height);
      const ctx = canvas.getContext('2d');
      
      this._setCanvasQuality(ctx);
      
      // 裁剪并绘制
      ctx.drawImage(
        img,
        validatedCropArea.x, validatedCropArea.y, validatedCropArea.width, validatedCropArea.height,
        0, 0, validatedCropArea.width, validatedCropArea.height
      );
      
      const blob = await this._canvasToBlob(canvas, config.defaultFormat, config.defaultQuality);
      const dataUrl = canvas.toDataURL(config.defaultFormat, config.defaultQuality);
      
      const metadata = {
        originalSize: { width: img.width, height: img.height },
        cropArea: validatedCropArea,
        processedSize: { width: canvas.width, height: canvas.height },
        originalFileSize: file.size,
        processedFileSize: blob.size,
        format: config.defaultFormat,
        quality: config.defaultQuality,
        timestamp: Date.now()
      };
      
      return { blob, dataUrl, metadata };
      
    } catch (error) {
      throw new Error(`图像裁剪失败: ${error.message}`);
    }
  }

  /**
   * 生成缩略图
   * @param {File} file - 原始图像文件
   * @param {Object} size - 缩略图尺寸 {width, height}
   * @param {Object} options - 处理选项
   * @returns {Promise<{blob: Blob, dataUrl: string, metadata: Object}>}
   */
  async generateThumbnail(file, size = { width: 150, height: 150 }, options = {}) {
    const config = {
      ...this.config,
      ...options,
      maxOutputSize: size,
      defaultQuality: options.quality || 0.8
    };
    
    return this.processImage(file, config);
  }

  /**
   * 批量处理图像
   * @param {File[]} files - 图像文件数组
   * @param {Object} options - 处理选项
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise<Array>}
   */
  async batchProcess(files, options = {}, progressCallback = null) {
    const results = [];
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.processImage(files[i], options);
        results.push({ success: true, result, file: files[i] });
      } catch (error) {
        results.push({ success: false, error: error.message, file: files[i] });
      }
      
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100)
        });
      }
    }
    
    return results;
  }

  /**
   * 获取图像信息
   * @param {File} file - 图像文件
   * @returns {Promise<Object>}
   */
  async getImageInfo(file) {
    try {
      const img = await this._loadImage(file);
      
      return {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        lastModified: file.lastModified
      };
    } catch (error) {
      throw new Error(`无法获取图像信息: ${error.message}`);
    }
  }

  /**
   * 加载图像
   * @private
   */
  _loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法加载图像'));
      };
      
      img.src = url;
    });
  }

  /**
   * 计算目标尺寸
   * @private
   */
  _calculateTargetDimensions(originalWidth, originalHeight, maxSize, maintainAspectRatio) {
    let { width: maxWidth, height: maxHeight } = maxSize;
    
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    // 如果原始尺寸小于最大尺寸，保持原始尺寸
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }
    
    // 计算缩放比例
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio)
    };
  }

  /**
   * 创建画布
   * @private
   */
  _createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * 设置画布质量
   * @private
   */
  _setCanvasQuality(ctx) {
    // 设置图像渲染质量
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 设置文本渲染质量
    ctx.textRenderingOptimization = 'optimizeQuality';
  }

  /**
   * 画布转Blob
   * @private
   */
  _canvasToBlob(canvas, format, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('无法生成图像数据'));
          }
        },
        format,
        quality
      );
    });
  }

  /**
   * 验证裁剪区域
   * @private
   */
  _validateCropArea(cropArea, imageWidth, imageHeight) {
    const { x = 0, y = 0, width, height } = cropArea;
    
    // 确保裁剪区域在图像范围内
    const validX = Math.max(0, Math.min(x, imageWidth - 1));
    const validY = Math.max(0, Math.min(y, imageHeight - 1));
    const validWidth = Math.min(width, imageWidth - validX);
    const validHeight = Math.min(height, imageHeight - validY);
    
    return {
      x: validX,
      y: validY,
      width: validWidth,
      height: validHeight
    };
  }

  /**
   * 获取处理配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新处理配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageProcessor;
} else {
  window.ImageProcessor = ImageProcessor;
}