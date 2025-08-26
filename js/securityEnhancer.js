/**
 * 安全增强模块
 * 提供文件验证、清理、安全检查等安全功能
 */

class SecurityEnhancer {
  constructor(options = {}) {
    this.config = {
      // 文件验证配置
      validation: {
        maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
        allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: options.allowedExtensions || ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        checkMagicNumbers: options.checkMagicNumbers !== false,
        scanForMalware: options.scanForMalware !== false
      },
      // 内容安全配置
      contentSecurity: {
        sanitizeMetadata: options.sanitizeMetadata !== false,
        removeExif: options.removeExif !== false,
        validateDimensions: options.validateDimensions !== false,
        maxDimensions: options.maxDimensions || { width: 4096, height: 4096 },
        minDimensions: options.minDimensions || { width: 32, height: 32 }
      },
      // 上传安全配置
      uploadSecurity: {
        enableCSRF: options.enableCSRF !== false,
        rateLimit: options.rateLimit || { requests: 10, window: 60000 }, // 10 requests per minute
        enableIntegrityCheck: options.enableIntegrityCheck !== false,
        encryptStorage: options.encryptStorage !== false
      },
      // 隐私保护配置
      privacy: {
        anonymizeData: options.anonymizeData !== false,
        logAccess: options.logAccess !== false,
        dataRetention: options.dataRetention || 30 * 24 * 60 * 60 * 1000 // 30天
      }
    };

    this.state = {
      uploadHistory: new Map(),
      securityLogs: [],
      rateLimitTracker: new Map(),
      csrfToken: null,
      encryptionKey: null
    };

    this.magicNumbers = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      'image/gif': [0x47, 0x49, 0x46, 0x38],
      'image/webp': [0x52, 0x49, 0x46, 0x46]
    };

    this.init();
  }

  /**
   * 初始化安全增强器
   */
  async init() {
    await this.initCSRFProtection();
    await this.initEncryption();
    this.initRateLimiting();
    this.initSecurityLogging();
  }

  /**
   * 初始化CSRF保护
   */
  async initCSRFProtection() {
    if (!this.config.uploadSecurity.enableCSRF) return;

    try {
      // 生成CSRF令牌
      this.state.csrfToken = await this.generateCSRFToken();
      
      // 将令牌添加到页面
      this.addCSRFTokenToPage();
      
    } catch (error) {
      console.warn('CSRF protection initialization failed:', error);
    }
  }

  /**
   * 生成CSRF令牌
   */
  async generateCSRFToken() {
    if ('crypto' in window && 'getRandomValues' in crypto) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // 回退方案
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  /**
   * 添加CSRF令牌到页面
   */
  addCSRFTokenToPage() {
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'csrf-token';
      document.head.appendChild(metaTag);
    }
    metaTag.content = this.state.csrfToken;
  }

  /**
   * 初始化加密
   */
  async initEncryption() {
    if (!this.config.uploadSecurity.encryptStorage) return;

    try {
      if ('crypto' in window && 'subtle' in crypto) {
        this.state.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      }
    } catch (error) {
      console.warn('Encryption initialization failed:', error);
    }
  }

  /**
   * 初始化速率限制
   */
  initRateLimiting() {
    // 定期清理过期的速率限制记录
    setInterval(() => {
      this.cleanupRateLimitTracker();
    }, this.config.uploadSecurity.rateLimit.window);
  }

  /**
   * 初始化安全日志
   */
  initSecurityLogging() {
    if (!this.config.privacy.logAccess) return;

    // 定期清理过期的日志
    setInterval(() => {
      this.cleanupSecurityLogs();
    }, 24 * 60 * 60 * 1000); // 每天清理一次
  }

  /**
   * 验证文件安全性
   */
  async validateFileSecurity(file) {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {}
    };

    try {
      // 基本文件验证
      const basicValidation = await this.validateBasicFile(file);
      if (!basicValidation.isValid) {
        results.isValid = false;
        results.errors.push(...basicValidation.errors);
      }

      // 魔数验证
      if (this.config.validation.checkMagicNumbers) {
        const magicValidation = await this.validateMagicNumbers(file);
        if (!magicValidation.isValid) {
          results.isValid = false;
          results.errors.push(...magicValidation.errors);
        }
      }

      // 内容验证
      const contentValidation = await this.validateFileContent(file);
      if (!contentValidation.isValid) {
        results.isValid = false;
        results.errors.push(...contentValidation.errors);
      }
      results.metadata = { ...results.metadata, ...contentValidation.metadata };

      // 恶意软件扫描
      if (this.config.validation.scanForMalware) {
        const malwareValidation = await this.scanForMalware(file);
        if (!malwareValidation.isValid) {
          results.isValid = false;
          results.errors.push(...malwareValidation.errors);
        }
        results.warnings.push(...malwareValidation.warnings);
      }

      // 记录安全日志
      this.logSecurityEvent('file_validation', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isValid: results.isValid,
        errors: results.errors
      });

    } catch (error) {
      results.isValid = false;
      results.errors.push(`安全验证失败: ${error.message}`);
      this.logSecurityEvent('validation_error', { error: error.message });
    }

    return results;
  }

  /**
   * 基本文件验证
   */
  async validateBasicFile(file) {
    const results = { isValid: true, errors: [] };

    // 文件大小验证
    if (file.size > this.config.validation.maxFileSize) {
      results.isValid = false;
      results.errors.push(`文件大小超过限制 (${this.formatBytes(this.config.validation.maxFileSize)})`);
    }

    if (file.size === 0) {
      results.isValid = false;
      results.errors.push('文件为空');
    }

    // 文件类型验证
    if (!this.config.validation.allowedTypes.includes(file.type)) {
      results.isValid = false;
      results.errors.push(`不支持的文件类型: ${file.type}`);
    }

    // 文件扩展名验证
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (!this.config.validation.allowedExtensions.includes(extension)) {
      results.isValid = false;
      results.errors.push(`不支持的文件扩展名: ${extension}`);
    }

    return results;
  }

  /**
   * 验证魔数
   */
  async validateMagicNumbers(file) {
    const results = { isValid: true, errors: [] };

    try {
      const buffer = await this.readFileHeader(file, 16);
      const magicNumbers = this.magicNumbers[file.type];

      if (magicNumbers) {
        const fileHeader = new Uint8Array(buffer);
        const isValid = magicNumbers.every((byte, index) => fileHeader[index] === byte);

        if (!isValid) {
          results.isValid = false;
          results.errors.push('文件头验证失败，可能是伪造的文件类型');
        }
      }
    } catch (error) {
      results.isValid = false;
      results.errors.push(`魔数验证失败: ${error.message}`);
    }

    return results;
  }

  /**
   * 验证文件内容
   */
  async validateFileContent(file) {
    const results = { isValid: true, errors: [], metadata: {} };

    try {
      // 创建图像对象进行验证
      const img = new Image();
      const url = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        img.onload = () => {
          // 验证图像尺寸
          if (this.config.contentSecurity.validateDimensions) {
            const { width, height } = img;
            const { maxDimensions, minDimensions } = this.config.contentSecurity;

            if (width > maxDimensions.width || height > maxDimensions.height) {
              results.isValid = false;
              results.errors.push(`图像尺寸超过限制 (${maxDimensions.width}x${maxDimensions.height})`);
            }

            if (width < minDimensions.width || height < minDimensions.height) {
              results.isValid = false;
              results.errors.push(`图像尺寸低于最小要求 (${minDimensions.width}x${minDimensions.height})`);
            }

            results.metadata.dimensions = { width, height };
          }

          URL.revokeObjectURL(url);
          resolve();
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('无法加载图像，文件可能已损坏'));
        };

        img.src = url;
      });

    } catch (error) {
      results.isValid = false;
      results.errors.push(`内容验证失败: ${error.message}`);
    }

    return results;
  }

  /**
   * 恶意软件扫描
   */
  async scanForMalware(file) {
    const results = { isValid: true, errors: [], warnings: [] };

    try {
      // 检查可疑的文件名模式
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|scr|pif|com)$/i,
        /\.(js|vbs|ps1|jar)$/i,
        /script/i,
        /<script/i,
        /javascript:/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(file.name)) {
          results.warnings.push('文件名包含可疑模式');
          break;
        }
      }

      // 检查文件内容中的可疑字符串
      const buffer = await this.readFileHeader(file, 1024);
      const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

      const maliciousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.write/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          results.isValid = false;
          results.errors.push('检测到潜在的恶意代码');
          break;
        }
      }

    } catch (error) {
      results.warnings.push(`恶意软件扫描失败: ${error.message}`);
    }

    return results;
  }

  /**
   * 清理文件元数据
   */
  async sanitizeFile(file) {
    try {
      if (!this.config.contentSecurity.sanitizeMetadata) {
        return file;
      }

      // 使用Canvas重新绘制图像以移除元数据
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const url = URL.createObjectURL(file);

      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              // 创建新的File对象，不包含原始元数据
              const sanitizedFile = new File([blob], file.name, {
                type: blob.type,
                lastModified: Date.now()
              });
              resolve(sanitizedFile);
            } else {
              reject(new Error('文件清理失败'));
            }
          }, file.type, 0.95);
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('无法加载图像进行清理'));
        };

        img.src = url;
      });

    } catch (error) {
      console.warn('File sanitization failed:', error);
      return file; // 返回原始文件作为回退
    }
  }

  /**
   * 检查速率限制
   */
  checkRateLimit(identifier = 'default') {
    const now = Date.now();
    const { requests, window } = this.config.uploadSecurity.rateLimit;
    
    if (!this.state.rateLimitTracker.has(identifier)) {
      this.state.rateLimitTracker.set(identifier, []);
    }
    
    const userRequests = this.state.rateLimitTracker.get(identifier);
    
    // 移除过期的请求记录
    const validRequests = userRequests.filter(timestamp => now - timestamp < window);
    
    if (validRequests.length >= requests) {
      this.logSecurityEvent('rate_limit_exceeded', { identifier, requests: validRequests.length });
      return {
        allowed: false,
        retryAfter: Math.ceil((validRequests[0] + window - now) / 1000)
      };
    }
    
    // 添加当前请求
    validRequests.push(now);
    this.state.rateLimitTracker.set(identifier, validRequests);
    
    return { allowed: true };
  }

  /**
   * 验证CSRF令牌
   */
  validateCSRFToken(token) {
    if (!this.config.uploadSecurity.enableCSRF) {
      return true;
    }
    
    const isValid = token === this.state.csrfToken;
    
    if (!isValid) {
      this.logSecurityEvent('csrf_validation_failed', { providedToken: token });
    }
    
    return isValid;
  }

  /**
   * 加密数据
   */
  async encryptData(data) {
    if (!this.config.uploadSecurity.encryptStorage || !this.state.encryptionKey) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.state.encryptionKey,
        dataBuffer
      );

      // 组合IV和加密数据
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.warn('Encryption failed:', error);
      return data;
    }
  }

  /**
   * 解密数据
   */
  async decryptData(encryptedData) {
    if (!this.config.uploadSecurity.encryptStorage || !this.state.encryptionKey) {
      return encryptedData;
    }

    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.state.encryptionKey,
        data
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);
      
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.warn('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * 记录安全事件
   */
  logSecurityEvent(type, data) {
    if (!this.config.privacy.logAccess) return;

    const event = {
      type,
      data: this.config.privacy.anonymizeData ? this.anonymizeData(data) : data,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ip: 'client-side' // 客户端无法获取真实IP
    };

    this.state.securityLogs.push(event);

    // 限制日志数量
    if (this.state.securityLogs.length > 1000) {
      this.state.securityLogs = this.state.securityLogs.slice(-500);
    }
  }

  /**
   * 匿名化数据
   */
  anonymizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const anonymized = { ...data };
    
    // 移除或混淆敏感信息
    const sensitiveFields = ['fileName', 'ip', 'userAgent', 'identifier'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashString(anonymized[field]);
      }
    }

    return anonymized;
  }

  /**
   * 哈希字符串
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 读取文件头
   */
  readFileHeader(file, bytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(0, bytes));
    });
  }

  /**
   * 获取文件扩展名
   */
  getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.'));
  }

  /**
   * 格式化字节
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 清理速率限制跟踪器
   */
  cleanupRateLimitTracker() {
    const now = Date.now();
    const window = this.config.uploadSecurity.rateLimit.window;
    
    for (const [identifier, requests] of this.state.rateLimitTracker) {
      const validRequests = requests.filter(timestamp => now - timestamp < window);
      if (validRequests.length === 0) {
        this.state.rateLimitTracker.delete(identifier);
      } else {
        this.state.rateLimitTracker.set(identifier, validRequests);
      }
    }
  }

  /**
   * 清理安全日志
   */
  cleanupSecurityLogs() {
    const now = Date.now();
    const retention = this.config.privacy.dataRetention;
    
    this.state.securityLogs = this.state.securityLogs.filter(
      log => now - log.timestamp < retention
    );
  }

  /**
   * 获取安全报告
   */
  getSecurityReport() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    const recentLogs = this.state.securityLogs.filter(log => log.timestamp > last24h);
    
    const eventCounts = recentLogs.reduce((counts, log) => {
      counts[log.type] = (counts[log.type] || 0) + 1;
      return counts;
    }, {});

    return {
      totalEvents: recentLogs.length,
      eventTypes: eventCounts,
      rateLimitStatus: {
        activeTrackers: this.state.rateLimitTracker.size,
        totalRequests: Array.from(this.state.rateLimitTracker.values())
          .reduce((total, requests) => total + requests.length, 0)
      },
      securityFeatures: {
        csrfEnabled: this.config.uploadSecurity.enableCSRF,
        encryptionEnabled: this.config.uploadSecurity.encryptStorage,
        rateLimitEnabled: !!this.config.uploadSecurity.rateLimit,
        malwareScanEnabled: this.config.validation.scanForMalware
      }
    };
  }

  /**
   * 销毁安全增强器
   */
  destroy() {
    // 清理状态
    this.state.uploadHistory.clear();
    this.state.rateLimitTracker.clear();
    this.state.securityLogs = [];
    this.state.csrfToken = null;
    this.state.encryptionKey = null;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SecurityEnhancer;
} else {
  window.SecurityEnhancer = SecurityEnhancer;
}