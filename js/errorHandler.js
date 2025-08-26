/**
 * 企业级错误处理模块
 * 提供全面的错误处理、用户友好的错误消息和错误恢复机制
 */
class ErrorHandler {
    constructor(options = {}) {
        this.config = {
            // 错误显示配置
            showStackTrace: options.showStackTrace || false,
            autoHide: options.autoHide !== false,
            autoHideDelay: options.autoHideDelay || 5000,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            
            // 错误报告配置
            enableReporting: options.enableReporting || false,
            reportEndpoint: options.reportEndpoint || null,
            
            // 用户体验配置
            enableRecovery: options.enableRecovery !== false,
            showRecoveryOptions: options.showRecoveryOptions !== false,
            
            ...options
        };
        
        this.errorHistory = [];
        this.retryAttempts = new Map();
        this.errorContainer = null;
        
        this.init();
    }
    
    init() {
        this.createErrorContainer();
        this.setupGlobalErrorHandlers();
    }
    
    /**
     * 创建错误显示容器
     */
    createErrorContainer() {
        if (document.getElementById('error-handler-container')) {
            this.errorContainer = document.getElementById('error-handler-container');
            return;
        }
        
        this.errorContainer = document.createElement('div');
        this.errorContainer.id = 'error-handler-container';
        this.errorContainer.className = 'error-handler-container';
        this.errorContainer.setAttribute('aria-live', 'polite');
        this.errorContainer.setAttribute('aria-atomic', 'true');
        
        // 添加样式
        this.errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.errorContainer);
    }
    
    /**
     * 设置全局错误处理器
     */
    setupGlobalErrorHandlers() {
        // 捕获未处理的JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejection',
                error: event.reason
            });
        });
    }
    
    /**
     * 处理错误
     * @param {Object} error - 错误对象
     * @param {Object} context - 错误上下文
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error, context);
        
        // 记录错误历史
        this.errorHistory.push({
            ...errorInfo,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // 显示错误消息
        this.showError(errorInfo);
        
        // 报告错误（如果启用）
        if (this.config.enableReporting) {
            this.reportError(errorInfo);
        }
        
        // 尝试错误恢复
        if (this.config.enableRecovery) {
            this.attemptRecovery(errorInfo);
        }
    }
    
    /**
     * 标准化错误对象
     */
    normalizeError(error, context) {
        let errorInfo = {
            id: this.generateErrorId(),
            type: 'unknown',
            severity: 'error',
            message: '发生了未知错误',
            details: null,
            stack: null,
            context: context,
            recoverable: false,
            userMessage: null
        };
        
        if (typeof error === 'string') {
            errorInfo.message = error;
            errorInfo.userMessage = this.getUserFriendlyMessage(error);
        } else if (error instanceof Error) {
            errorInfo.type = error.name || 'Error';
            errorInfo.message = error.message;
            errorInfo.stack = error.stack;
            errorInfo.userMessage = this.getUserFriendlyMessage(error.message);
        } else if (typeof error === 'object' && error !== null) {
            errorInfo = { ...errorInfo, ...error };
            if (!errorInfo.userMessage) {
                errorInfo.userMessage = this.getUserFriendlyMessage(errorInfo.message);
            }
        }
        
        // 确定错误严重程度
        errorInfo.severity = this.determineSeverity(errorInfo);
        
        // 确定是否可恢复
        errorInfo.recoverable = this.isRecoverable(errorInfo);
        
        return errorInfo;
    }
    
    /**
     * 获取用户友好的错误消息
     */
    getUserFriendlyMessage(message) {
        const messageMap = {
            // 文件上传相关错误
            'File too large': '文件大小超出限制，请选择较小的文件',
            'Invalid file type': '不支持的文件类型，请选择图片文件',
            'File corrupted': '文件已损坏，请选择其他文件',
            'Upload failed': '上传失败，请检查网络连接后重试',
            
            // 网络相关错误
            'Network error': '网络连接异常，请检查网络后重试',
            'Timeout': '请求超时，请重试',
            'Server error': '服务器暂时不可用，请稍后重试',
            
            // 权限相关错误
            'Permission denied': '权限不足，请联系管理员',
            'Unauthorized': '未授权访问，请重新登录',
            
            // 浏览器兼容性错误
            'Not supported': '您的浏览器不支持此功能，请升级浏览器',
            'Feature not available': '此功能暂不可用',
            
            // 数据相关错误
            'Invalid data': '数据格式错误，请检查输入',
            'Data not found': '未找到相关数据',
            'Validation failed': '数据验证失败，请检查输入'
        };
        
        // 尝试精确匹配
        if (messageMap[message]) {
            return messageMap[message];
        }
        
        // 尝试模糊匹配
        for (const [key, value] of Object.entries(messageMap)) {
            if (message.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }
        
        // 默认消息
        return '操作失败，请重试或联系技术支持';
    }
    
    /**
     * 确定错误严重程度
     */
    determineSeverity(errorInfo) {
        const criticalKeywords = ['crash', 'fatal', 'critical', 'security'];
        const warningKeywords = ['deprecated', 'warning', 'fallback'];
        
        const message = errorInfo.message.toLowerCase();
        
        if (criticalKeywords.some(keyword => message.includes(keyword))) {
            return 'critical';
        }
        
        if (warningKeywords.some(keyword => message.includes(keyword))) {
            return 'warning';
        }
        
        return 'error';
    }
    
    /**
     * 判断错误是否可恢复
     */
    isRecoverable(errorInfo) {
        const recoverableTypes = [
            'network',
            'timeout',
            'upload',
            'validation',
            'file'
        ];
        
        return recoverableTypes.some(type => 
            errorInfo.type.toLowerCase().includes(type) ||
            errorInfo.message.toLowerCase().includes(type)
        );
    }
    
    /**
     * 显示错误消息
     */
    showError(errorInfo) {
        const errorElement = this.createErrorElement(errorInfo);
        this.errorContainer.appendChild(errorElement);
        
        // 自动隐藏
        if (this.config.autoHide && errorInfo.severity !== 'critical') {
            setTimeout(() => {
                this.hideError(errorInfo.id);
            }, this.config.autoHideDelay);
        }
        
        // 触发自定义事件
        this.dispatchErrorEvent('error-shown', errorInfo);
    }
    
    /**
     * 创建错误显示元素
     */
    createErrorElement(errorInfo) {
        const errorElement = document.createElement('div');
        errorElement.className = `error-notification error-${errorInfo.severity}`;
        errorElement.setAttribute('data-error-id', errorInfo.id);
        errorElement.setAttribute('role', 'alert');
        
        const iconMap = {
            critical: '🚨',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const icon = iconMap[errorInfo.severity] || '❌';
        
        errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-icon">${icon}</div>
                <div class="error-message">
                    <div class="error-title">${errorInfo.userMessage}</div>
                    ${errorInfo.details ? `<div class="error-details">${errorInfo.details}</div>` : ''}
                    ${this.config.showStackTrace && errorInfo.stack ? 
                        `<details class="error-stack">
                            <summary>技术详情</summary>
                            <pre>${errorInfo.stack}</pre>
                        </details>` : ''}
                </div>
                <div class="error-actions">
                    ${errorInfo.recoverable && this.config.showRecoveryOptions ? 
                        `<button class="error-retry-btn" onclick="errorHandler.retry('${errorInfo.id}')">重试</button>` : ''}
                    <button class="error-close-btn" onclick="errorHandler.hideError('${errorInfo.id}')" aria-label="关闭错误消息">×</button>
                </div>
            </div>
        `;
        
        // 添加样式
        this.applyErrorStyles(errorElement, errorInfo.severity);
        
        return errorElement;
    }
    
    /**
     * 应用错误样式
     */
    applyErrorStyles(element, severity) {
        const baseStyles = `
            margin-bottom: 10px;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            pointer-events: auto;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const severityStyles = {
            critical: 'background: #fee; border-left: 4px solid #dc2626; color: #7f1d1d;',
            error: 'background: #fef2f2; border-left: 4px solid #ef4444; color: #7f1d1d;',
            warning: 'background: #fffbeb; border-left: 4px solid #f59e0b; color: #78350f;',
            info: 'background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e3a8a;'
        };
        
        element.style.cssText = baseStyles + (severityStyles[severity] || severityStyles.error);
        
        // 添加内部元素样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .error-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            .error-icon {
                font-size: 20px;
                flex-shrink: 0;
            }
            .error-message {
                flex: 1;
                min-width: 0;
            }
            .error-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            .error-details {
                font-size: 14px;
                opacity: 0.8;
                margin-bottom: 8px;
            }
            .error-stack {
                margin-top: 8px;
                font-size: 12px;
            }
            .error-stack pre {
                background: rgba(0, 0, 0, 0.05);
                padding: 8px;
                border-radius: 4px;
                overflow-x: auto;
                max-height: 200px;
            }
            .error-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            .error-retry-btn, .error-close-btn {
                background: none;
                border: 1px solid currentColor;
                color: inherit;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            .error-retry-btn:hover, .error-close-btn:hover {
                background: currentColor;
                color: white;
            }
            .error-close-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                font-size: 16px;
                font-weight: bold;
            }
        `;
        
        if (!document.getElementById('error-handler-styles')) {
            style.id = 'error-handler-styles';
            document.head.appendChild(style);
        }
    }
    
    /**
     * 隐藏错误消息
     */
    hideError(errorId) {
        const errorElement = this.errorContainer.querySelector(`[data-error-id="${errorId}"]`);
        if (errorElement) {
            errorElement.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
        
        // 添加滑出动画
        if (!document.getElementById('slideOut-animation')) {
            const style = document.createElement('style');
            style.id = 'slideOut-animation';
            style.textContent = `
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * 重试操作
     */
    retry(errorId) {
        const errorInfo = this.errorHistory.find(e => e.id === errorId);
        if (!errorInfo) return;
        
        const attempts = this.retryAttempts.get(errorId) || 0;
        if (attempts >= this.config.maxRetries) {
            this.showError({
                ...errorInfo,
                id: this.generateErrorId(),
                message: '重试次数已达上限',
                userMessage: '重试次数已达上限，请稍后再试或联系技术支持',
                recoverable: false
            });
            return;
        }
        
        this.retryAttempts.set(errorId, attempts + 1);
        this.hideError(errorId);
        
        // 延迟重试
        setTimeout(() => {
            this.dispatchErrorEvent('error-retry', errorInfo);
        }, this.config.retryDelay);
    }
    
    /**
     * 尝试错误恢复
     */
    attemptRecovery(errorInfo) {
        // 根据错误类型尝试不同的恢复策略
        switch (errorInfo.type.toLowerCase()) {
            case 'network':
                this.recoverFromNetworkError(errorInfo);
                break;
            case 'file':
            case 'upload':
                this.recoverFromFileError(errorInfo);
                break;
            case 'validation':
                this.recoverFromValidationError(errorInfo);
                break;
            default:
                // 通用恢复策略
                this.genericRecovery(errorInfo);
        }
    }
    
    /**
     * 网络错误恢复
     */
    recoverFromNetworkError(errorInfo) {
        // 检查网络连接
        if (navigator.onLine === false) {
            const handleOnline = () => {
                this.showError({
                    ...errorInfo,
                    id: this.generateErrorId(),
                    severity: 'info',
                    message: '网络连接已恢复',
                    userMessage: '网络连接已恢复，您可以重试之前的操作',
                    recoverable: true
                });
                window.removeEventListener('online', handleOnline);
            };
            window.addEventListener('online', handleOnline);
        }
    }
    
    /**
     * 文件错误恢复
     */
    recoverFromFileError(errorInfo) {
        // 提供文件选择建议
        const suggestions = {
            'File too large': '建议压缩图片或选择较小的文件',
            'Invalid file type': '请选择 JPG、PNG、GIF 或 WebP 格式的图片',
            'File corrupted': '请确保文件完整且未损坏'
        };
        
        const suggestion = suggestions[errorInfo.message];
        if (suggestion) {
            errorInfo.details = suggestion;
        }
    }
    
    /**
     * 验证错误恢复
     */
    recoverFromValidationError(errorInfo) {
        // 提供输入建议
        errorInfo.details = '请检查输入内容是否符合要求';
    }
    
    /**
     * 通用恢复策略
     */
    genericRecovery(errorInfo) {
        // 记录错误并提供通用建议
        console.warn('Error occurred:', errorInfo);
    }
    
    /**
     * 报告错误
     */
    async reportError(errorInfo) {
        if (!this.config.reportEndpoint) return;
        
        try {
            await fetch(this.config.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: errorInfo,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (reportError) {
            console.warn('Failed to report error:', reportError);
        }
    }
    
    /**
     * 分发错误事件
     */
    dispatchErrorEvent(eventType, errorInfo) {
        const event = new CustomEvent(eventType, {
            detail: errorInfo,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * 生成错误ID
     */
    generateErrorId() {
        return 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 清除所有错误
     */
    clearAllErrors() {
        if (this.errorContainer) {
            this.errorContainer.innerHTML = '';
        }
    }
    
    /**
     * 清除特定组件的错误
     * @param {string} componentName - 组件名称
     * @param {string} containerId - 容器ID（可选）
     */
    clearComponentErrors(componentName, containerId = null) {
        if (!this.errorContainer) return;
        
        // 查找并移除特定组件的错误
        const errorElements = this.errorContainer.querySelectorAll('.error-notification');
        errorElements.forEach(element => {
            const errorId = element.getAttribute('data-error-id');
            // 检查错误历史中是否有匹配的组件错误
            const errorInfo = this.errorHistory.find(error => 
                error.id === errorId && 
                error.context && 
                error.context.component === componentName &&
                (containerId === null || error.context.container === containerId)
            );
            
            if (errorInfo) {
                element.remove();
            }
        });
    }
    
    /**
     * 显示成功消息
     * @param {string} message - 成功消息
     * @param {Object} options - 选项
     */
    showSuccess(message, options = {}) {
        const successInfo = {
            id: this.generateErrorId(),
            type: 'success',
            severity: 'info',
            message: message,
            userMessage: message,
            context: options.context || {},
            recoverable: false
        };
        
        this.showError(successInfo);
    }
    
    /**
     * 获取错误历史
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }
    
    /**
     * 获取错误统计
     */
    getErrorStats() {
        const stats = {
            total: this.errorHistory.length,
            bySeverity: {},
            byType: {},
            recent: this.errorHistory.slice(-10)
        };
        
        this.errorHistory.forEach(error => {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * 销毁错误处理器
     */
    destroy() {
        if (this.errorContainer && this.errorContainer.parentNode) {
            this.errorContainer.parentNode.removeChild(this.errorContainer);
        }
        
        // 移除样式
        const styles = document.getElementById('error-handler-styles');
        if (styles) {
            styles.remove();
        }
        
        const slideOutStyles = document.getElementById('slideOut-animation');
        if (slideOutStyles) {
            slideOutStyles.remove();
        }
        
        this.errorHistory = [];
        this.retryAttempts.clear();
    }
}

// 注意：全局错误处理器实例在 script.js 的 initializeComponents() 函数中创建
// 避免重复初始化，此处不再创建实例