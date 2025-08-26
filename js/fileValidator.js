/**
 * 企业级文件验证模块
 * 提供全面的文件验证功能，包括类型检查、大小限制、安全性验证
 */

class FileValidator {
  constructor(options = {}) {
    this.config = {
      // 允许的文件类型
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      // 最大文件大小 (5MB)
      maxSize: options.maxSize || 5 * 1024 * 1024,
      // 最小文件大小 (1KB)
      minSize: options.minSize || 1024,
      // 最大图片尺寸
      maxDimensions: options.maxDimensions || { width: 4096, height: 4096 },
      // 最小图片尺寸
      minDimensions: options.minDimensions || { width: 32, height: 32 },
      // 是否启用严格的文件头检查
      strictMimeCheck: options.strictMimeCheck !== false
    };

    // 文件签名映射 (Magic Numbers)
    this.fileSignatures = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    };
  }

  /**
   * 验证文件
   * @param {File} file - 要验证的文件
   * @returns {Promise<{isValid: boolean, errors: string[], warnings: string[]}>}
   */
  async validateFile(file) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };

    try {
      // 基础验证
      this._validateBasicProperties(file, result);
      
      // 文件类型验证
      await this._validateFileType(file, result);
      
      // 图片尺寸验证
      if (this._isImageFile(file.type)) {
        await this._validateImageDimensions(file, result);
      }
      
      // 安全性检查
      await this._performSecurityChecks(file, result);
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`验证过程中发生错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 基础属性验证
   */
  _validateBasicProperties(file, result) {
    // 文件名验证
    if (!file.name || file.name.trim() === '') {
      result.errors.push('文件名不能为空');
      result.isValid = false;
    }

    // 文件名长度检查
    if (file.name.length > 255) {
      result.errors.push('文件名过长（超过255个字符）');
      result.isValid = false;
    }

    // 危险字符检查
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (dangerousChars.test(file.name)) {
      result.errors.push('文件名包含非法字符');
      result.isValid = false;
    }

    // 文件大小验证
    if (file.size === 0) {
      result.errors.push('文件为空');
      result.isValid = false;
    } else if (file.size < this.config.minSize) {
      result.errors.push(`文件过小（最小 ${this._formatFileSize(this.config.minSize)}）`);
      result.isValid = false;
    } else if (file.size > this.config.maxSize) {
      result.errors.push(`文件过大（最大 ${this._formatFileSize(this.config.maxSize)}）`);
      result.isValid = false;
    }

    // MIME类型基础检查
    if (!file.type) {
      result.warnings.push('无法检测文件类型');
    } else if (!this.config.allowedTypes.includes(file.type)) {
      result.errors.push(`不支持的文件类型: ${file.type}`);
      result.isValid = false;
    }
  }

  /**
   * 文件类型验证（包括文件头检查）
   */
  async _validateFileType(file, result) {
    if (!this.config.strictMimeCheck) return;

    try {
      const arrayBuffer = await this._readFileHeader(file, 16);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let detectedType = null;
      
      // 检查文件签名
      for (const [mimeType, signature] of Object.entries(this.fileSignatures)) {
        if (this._matchesSignature(uint8Array, signature)) {
          detectedType = mimeType;
          break;
        }
      }

      if (!detectedType) {
        result.errors.push('无法识别的文件格式或文件已损坏');
        result.isValid = false;
      } else if (detectedType !== file.type) {
        result.warnings.push(`文件扩展名与实际类型不匹配（检测到: ${detectedType}）`);
        // 更新文件信息
        result.fileInfo.detectedType = detectedType;
      }
    } catch (error) {
      result.warnings.push('无法验证文件头信息');
    }
  }

  /**
   * 图片尺寸验证
   */
  async _validateImageDimensions(file, result) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const { width, height } = img;
        result.fileInfo.dimensions = { width, height };
        
        // 检查最小尺寸
        if (width < this.config.minDimensions.width || height < this.config.minDimensions.height) {
          result.errors.push(
            `图片尺寸过小（最小 ${this.config.minDimensions.width}x${this.config.minDimensions.height}）`
          );
          result.isValid = false;
        }
        
        // 检查最大尺寸
        if (width > this.config.maxDimensions.width || height > this.config.maxDimensions.height) {
          result.errors.push(
            `图片尺寸过大（最大 ${this.config.maxDimensions.width}x${this.config.maxDimensions.height}）`
          );
          result.isValid = false;
        }
        
        // 检查宽高比
        const aspectRatio = width / height;
        if (aspectRatio > 10 || aspectRatio < 0.1) {
          result.warnings.push('图片宽高比异常，可能影响显示效果');
        }
        
        resolve();
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        result.errors.push('无法读取图片信息，文件可能已损坏');
        result.isValid = false;
        resolve();
      };
      
      img.src = url;
    });
  }

  /**
   * 安全性检查
   */
  async _performSecurityChecks(file, result) {
    // 检查文件名中的可执行扩展名
    const executableExtensions = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|app|deb|pkg|dmg)$/i;
    if (executableExtensions.test(file.name)) {
      result.errors.push('文件名包含可执行文件扩展名');
      result.isValid = false;
    }

    // 检查双扩展名
    const doubleExtension = /\.[a-zA-Z0-9]{1,4}\.[a-zA-Z0-9]{1,4}$/;
    if (doubleExtension.test(file.name)) {
      result.warnings.push('检测到双扩展名，请确认文件安全性');
    }

    // 检查隐藏的可执行代码（简单检查）
    if (this._isImageFile(file.type)) {
      try {
        const sample = await this._readFileHeader(file, 1024);
        const text = new TextDecoder('utf-8', { fatal: false }).decode(sample);
        
        // 检查可疑脚本标签
        const suspiciousPatterns = [
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /onload=/i,
          /onerror=/i
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(text)) {
            result.errors.push('文件包含可疑的脚本代码');
            result.isValid = false;
            break;
          }
        }
      } catch (error) {
        // 忽略解码错误，这在二进制文件中是正常的
      }
    }
  }

  /**
   * 读取文件头部字节
   */
  _readFileHeader(file, bytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('无法读取文件'));
      reader.readAsArrayBuffer(file.slice(0, bytes));
    });
  }

  /**
   * 检查文件签名是否匹配
   */
  _matchesSignature(uint8Array, signature) {
    if (uint8Array.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (uint8Array[i] !== signature[i]) return false;
    }
    
    return true;
  }

  /**
   * 检查是否为图片文件
   */
  _isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }

  /**
   * 格式化文件大小
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取验证配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新验证配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileValidator;
} else {
  window.FileValidator = FileValidator;
}