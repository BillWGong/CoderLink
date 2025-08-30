#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CoderLink 启动器
用于启动CoderLink项目的Python脚本
"""

import os
import sys
import subprocess
import webbrowser
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver

class CoderLinkLauncher:
    def __init__(self):
        self.port = 8000
        self.server = None
        self.server_thread = None
        
    def find_available_port(self, start_port=8000):
        """查找可用端口"""
        import socket
        for port in range(start_port, start_port + 100):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        return None
    
    def start_server(self):
        """启动HTTP服务器"""
        try:
            # 查找可用端口
            self.port = self.find_available_port()
            if not self.port:
                print("❌ 无法找到可用端口")
                return False
                
            # 切换到项目目录
            os.chdir(os.path.dirname(os.path.abspath(__file__)))
            
            # 创建自定义处理器
            class CustomHandler(SimpleHTTPRequestHandler):
                def end_headers(self):
                    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                    self.send_header('Pragma', 'no-cache')
                    self.send_header('Expires', '0')
                    super().end_headers()
                    
                def log_message(self, format, *args):
                    # 简化日志输出
                    print(f"📡 {args[0]} - {args[1]}")
            
            # 启动服务器
            self.server = HTTPServer(('localhost', self.port), CustomHandler)
            
            def run_server():
                print(f"🚀 CoderLink 服务器启动成功!")
                print(f"📍 访问地址: http://localhost:{self.port}")
                print(f"🌐 正在自动打开浏览器...")
                print(f"⏹️  按 Ctrl+C 停止服务器")
                print("-" * 50)
                self.server.serve_forever()
            
            # 在新线程中运行服务器
            self.server_thread = threading.Thread(target=run_server, daemon=True)
            self.server_thread.start()
            
            # 等待服务器启动
            time.sleep(1)
            
            # 自动打开浏览器
            webbrowser.open(f'http://localhost:{self.port}')
            
            return True
            
        except Exception as e:
            print(f"❌ 启动服务器失败: {e}")
            return False
    
    def stop_server(self):
        """停止服务器"""
        if self.server:
            print("\n🛑 正在停止服务器...")
            self.server.shutdown()
            self.server.server_close()
            print("✅ 服务器已停止")
    
    def run(self):
        """运行启动器"""
        print("="*50)
        print("🔗 CoderLink 启动器")
        print("📋 智能联系人管理系统")
        print("="*50)
        
        if self.start_server():
            try:
                # 保持程序运行
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.stop_server()
                print("👋 感谢使用 CoderLink!")
        else:
            print("❌ 启动失败，请检查错误信息")
            sys.exit(1)

def main():
    """主函数"""
    launcher = CoderLinkLauncher()
    launcher.run()

if __name__ == "__main__":
    main()