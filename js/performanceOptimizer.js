/**
 * 性能优化模块
 * 提供图像压缩、懒加载、高效存储等性能优化功能
 */

class PerformanceOptimizer {
  constructor(options = {}) {
    this.config = {
      // 压缩配置
      compression: {
        quality: options.compressionQuality || 0.8,
        maxWidth: options.maxWidth || 1024,
        maxHeight: options.maxHeight || 1024,
        format: options.format || 'image/jpeg',
        enableWebP: options.enableWebP !== false,
        enableAVIF: options.enableAVIF !== false
      },
      // 存储配置
      storage: {
        useIndexedDB: options.useIndexedDB !== false,
        maxCacheSize: options.maxCacheSize || 50 * 1024 * 1024, // 50MB
        cacheExpiry: options.cacheExpiry || 7 * 24 * 60 * 60 * 1000, // 7天
        compressionLevel: options.compressionLevel || 6
      },
      // 懒加载配置
      lazyLoading: {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0.1,
        enableBlur: options.enableBlur !== false,
        placeholderColor: options.placeholderColor || '#f0f0f0'
      },
      // 性能监控
      monitoring: {
        enableMetrics: options.enableMetrics !== false,
        sampleRate: options.sampleRate || 0.1
      }
    };

    this.state = {
      cache: new Map(),
      observers: new Map(),
      metrics: {
        compressionTime: [],
        uploadTime: [],
        cacheHits: 0,
        cacheMisses: 0,
        totalSaved: 0
      },
      workers: {
        compression: null,
        processing: null
      }
    };

    this.init();
  }

  /**
   * 初始化性能优化器
   */
  async init() {
    await this.initStorage();
    this.initWorkers();
    this.initLazyLoading();
    this.initPerformanceMonitoring();
  }

  /**
   * 初始化存储
   */
  async initStorage() {
    if (this.config.storage.useIndexedDB && 'indexedDB' in window) {
      try {
        this.db = await this.openIndexedDB();
      } catch (error) {
        console.warn('IndexedDB initialization failed, falling back to memory cache:', error);
        this.db = null;
      }
    }
  }

  /**
   * 打开IndexedDB
   */
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AvatarCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * 初始化Web Workers
   */
  initWorkers() {
    // 图像压缩Worker
    if ('Worker' in window) {
      try {
        this.state.workers.compression = this.createCompressionWorker();
      } catch (error) {
        console.warn('Failed to create compression worker:', error);
      }
    }
  }

  /**
   * 创建压缩Worker
   */
  createCompressionWorker() {
    const workerCode = `
      self.onmessage = function(e) {
        const { imageData, options } = e.data;
        
        // 创建离屏Canvas
        const canvas = new OffscreenCanvas(options.width, options.height);
        const ctx = canvas.getContext('2d');
        
        // 绘制图像数据
        const imgData = new ImageData(imageData.data, imageData.width, imageData.height);
        ctx.putImageData(imgData, 0, 0);
        
        // 压缩并返回
        canvas.convertToBlob({
          type: options.format,
          quality: options.quality
        }).then(blob => {
          self.postMessage({ success: true, blob });
        }).catch(error => {
          self.postMessage({ success: false, error: error.message });
        });
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }

  /**
   * 初始化懒加载
   */
  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver(
        this.handleLazyLoad.bind(this),
        {
          rootMargin: this.config.lazyLoading.rootMargin,
          threshold: this.config.lazyLoading.threshold
        }
      );
    }
  }

  /**
   * 处理懒加载
   */
  handleLazyLoad(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          this.loadImageOptimized(src, img);
          this.lazyLoadObserver.unobserve(img);
        }
      }
    });
  }

  /**
   * 优化加载图像
   */
  async loadImageOptimized(src, imgElement) {
    try {
      // 检查缓存
      const cached = await this.getCachedImage(src);
      if (cached) {
        imgElement.src = cached;
        this.state.metrics.cacheHits++;
        return;
      }

      this.state.metrics.cacheMisses++;
      
      // 加载并优化图像
      const optimizedSrc = await this.optimizeImageForDisplay(src);
      imgElement.src = optimizedSrc;
      
      // 缓存优化后的图像
      await this.cacheImage(src, optimizedSrc);
      
    } catch (error) {
      console.error('Failed to load optimized image:', error);
      imgElement.src = src; // 回退到原始图像
    }
  }

  /**
   * 压缩图像
   */
  async compressImage(file, options = {}) {
    const startTime = performance.now();
    
    try {
      const config = {
        quality: options.quality || this.config.compression.quality,
        maxWidth: options.maxWidth || this.config.compression.maxWidth,
        maxHeight: options.maxHeight || this.config.compression.maxHeight,
        format: options.format || this.config.compression.format
      };

      // 检测最佳格式
      const optimalFormat = await this.detectOptimalFormat(file, config.format);
      config.format = optimalFormat;

      let compressedBlob;
      
      // 尝试使用Worker进行压缩
      if (this.state.workers.compression && 'OffscreenCanvas' in window) {
        compressedBlob = await this.compressWithWorker(file, config);
      } else {
        compressedBlob = await this.compressWithCanvas(file, config);
      }

      const compressionTime = performance.now() - startTime;
      this.recordMetric('compressionTime', compressionTime);
      
      const compressionRatio = (1 - compressedBlob.size / file.size) * 100;
      this.state.metrics.totalSaved += file.size - compressedBlob.size;

      return {
        blob: compressedBlob,
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        compressionRatio,
        compressionTime,
        format: config.format
      };
      
    } catch (error) {
      console.error('Image compression failed:', error);
      throw error;
    }
  }

  /**
   * 检测最佳格式
   */
  async detectOptimalFormat(file, defaultFormat) {
    // 检查浏览器支持
    const supportsWebP = await this.checkFormatSupport('image/webp');
    const supportsAVIF = await this.checkFormatSupport('image/avif');
    
    // 根据文件类型和浏览器支持选择最佳格式
    if (this.config.compression.enableAVIF && supportsAVIF) {
      return 'image/avif';
    }
    
    if (this.config.compression.enableWebP && supportsWebP) {
      return 'image/webp';
    }
    
    return defaultFormat;
  }

  /**
   * 检查格式支持
   */
  checkFormatSupport(format) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      
      canvas.toBlob((blob) => {
        resolve(blob && blob.type === format);
      }, format, 0.5);
    });
  }

  /**
   * 使用Worker压缩
   */
  compressWithWorker(file, config) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          config.maxWidth, 
          config.maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        
        const worker = this.state.workers.compression;
        
        worker.onmessage = (e) => {
          const { success, blob, error } = e.data;
          if (success) {
            resolve(blob);
          } else {
            reject(new Error(error));
          }
        };
        
        worker.postMessage({
          imageData,
          options: {
            width,
            height,
            format: config.format,
            quality: config.quality
          }
        });
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 使用Canvas压缩
   */
  compressWithCanvas(file, config) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          config.maxWidth, 
          config.maxHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // 高质量缩放
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          resolve,
          config.format,
          config.quality
        );
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 计算尺寸
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // 计算缩放比例
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio, 1);
    
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
    
    return { width, height };
  }

  /**
   * 缓存图像
   */
  async cacheImage(key, data) {
    try {
      const cacheData = {
        id: this.generateCacheKey(key),
        data,
        timestamp: Date.now(),
        size: data.length || data.size || 0
      };
      
      if (this.db) {
        await this.storeInIndexedDB(cacheData);
      } else {
        this.state.cache.set(cacheData.id, cacheData);
        this.cleanupMemoryCache();
      }
      
    } catch (error) {
      console.warn('Failed to cache image:', error);
    }
  }

  /**
   * 获取缓存图像
   */
  async getCachedImage(key) {
    try {
      const cacheKey = this.generateCacheKey(key);
      
      if (this.db) {
        return await this.getFromIndexedDB(cacheKey);
      } else {
        const cached = this.state.cache.get(cacheKey);
        if (cached && !this.isCacheExpired(cached)) {
          return cached.data;
        }
      }
      
    } catch (error) {
      console.warn('Failed to get cached image:', error);
    }
    
    return null;
  }

  /**
   * 存储到IndexedDB
   */
  storeInIndexedDB(data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从IndexedDB获取
   */
  getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && !this.isCacheExpired(result)) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(input) {
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 检查缓存是否过期
   */
  isCacheExpired(cacheData) {
    return Date.now() - cacheData.timestamp > this.config.storage.cacheExpiry;
  }

  /**
   * 清理内存缓存
   */
  cleanupMemoryCache() {
    const maxSize = this.config.storage.maxCacheSize;
    let currentSize = 0;
    
    // 计算当前大小
    for (const [, data] of this.state.cache) {
      currentSize += data.size;
    }
    
    // 如果超过限制，删除最旧的条目
    if (currentSize > maxSize) {
      const entries = Array.from(this.state.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      for (const [key, data] of entries) {
        this.state.cache.delete(key);
        currentSize -= data.size;
        
        if (currentSize <= maxSize * 0.8) break; // 清理到80%
      }
    }
  }

  /**
   * 优化显示图像
   */
  async optimizeImageForDisplay(src) {
    // 这里可以添加额外的显示优化逻辑
    // 例如：根据设备像素比调整图像质量
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    if (devicePixelRatio > 1) {
      // 高DPI设备，可能需要更高质量的图像
      return src;
    }
    
    return src;
  }

  /**
   * 初始化性能监控
   */
  initPerformanceMonitoring() {
    if (!this.config.monitoring.enableMetrics) return;
    
    // 监控页面性能
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('avatar') || entry.name.includes('image')) {
              this.recordPerformanceEntry(entry);
            }
          }
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(type, value) {
    if (!this.config.monitoring.enableMetrics) return;
    
    if (Math.random() > this.config.monitoring.sampleRate) return;
    
    if (!this.state.metrics[type]) {
      this.state.metrics[type] = [];
    }
    
    this.state.metrics[type].push({
      value,
      timestamp: Date.now()
    });
    
    // 限制历史数据
    if (this.state.metrics[type].length > 100) {
      this.state.metrics[type] = this.state.metrics[type].slice(-50);
    }
  }

  /**
   * 记录性能条目
   */
  recordPerformanceEntry(entry) {
    this.recordMetric('performanceEntry', {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      type: entry.entryType
    });
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const metrics = this.state.metrics;
    
    return {
      compression: {
        averageTime: this.calculateAverage(metrics.compressionTime),
        totalOperations: metrics.compressionTime.length
      },
      cache: {
        hitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) || 0,
        totalSaved: this.formatBytes(metrics.totalSaved)
      },
      storage: {
        cacheSize: this.state.cache.size,
        indexedDBAvailable: !!this.db
      }
    };
  }

  /**
   * 计算平均值
   */
  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, item) => acc + (item.value || item), 0);
    return sum / values.length;
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
   * 清理缓存
   */
  async clearCache() {
    // 清理内存缓存
    this.state.cache.clear();
    
    // 清理IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    // 重置指标
    this.state.metrics = {
      compressionTime: [],
      uploadTime: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalSaved: 0
    };
  }

  /**
   * 销毁性能优化器
   */
  destroy() {
    // 清理Workers
    if (this.state.workers.compression) {
      this.state.workers.compression.terminate();
    }
    
    // 清理观察者
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
    }
    
    // 关闭数据库
    if (this.db) {
      this.db.close();
    }
    
    // 清理缓存
    this.state.cache.clear();
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
} else {
  window.PerformanceOptimizer = PerformanceOptimizer;
}