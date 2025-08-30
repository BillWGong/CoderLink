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
import signal

class CoderLinkLauncher:
    def __init__(self):
        self.port = 5000
        self.node_process = None
        
    def find_available_port(self, start_port=5000):
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
        """启动Node.js服务器"""
        try:
            # 切换到项目目录
            project_dir = os.path.dirname(os.path.abspath(__file__))
            os.chdir(project_dir)
            
            # 检查Node.js是否可用
            try:
                subprocess.run(['node', '--version'], check=True, capture_output=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("❌ Node.js 未安装或不可用")
                return False
            
            # 设置环境变量
            env = os.environ.copy()
            env['PORT'] = str(self.port)
            
            # 启动Node.js服务器
            print(f"🚀 正在启动 CoderLink Node.js 服务器...")
            self.node_process = subprocess.Popen(
                ['node', 'src/server.js'],
                cwd=project_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # 等待服务器启动
            time.sleep(3)
            
            # 检查进程是否还在运行
            if self.node_process.poll() is not None:
                print("❌ Node.js 服务器启动失败")
                return False
            
            print(f"🚀 CoderLink 服务器启动成功!")
            print(f"📍 访问地址: http://localhost:{self.port}")
            print(f"🌐 正在自动打开浏览器...")
            print(f"⏹️  按 Ctrl+C 停止服务器")
            print("-" * 50)
            
            # 自动打开浏览器
            webbrowser.open(f'http://localhost:{self.port}')
            
            return True
            
        except Exception as e:
            print(f"❌ 启动服务器失败: {e}")
            return False
    
    def stop_server(self):
        """停止Node.js服务器"""
        if self.node_process:
            print("\n🛑 正在停止服务器...")
            try:
                # 在Windows上终止进程
                if os.name == 'nt':
                    self.node_process.terminate()
                else:
                    self.node_process.send_signal(signal.SIGTERM)
                
                # 等待进程结束
                self.node_process.wait(timeout=5)
                print("✅ 服务器已停止")
            except subprocess.TimeoutExpired:
                print("⚠️ 强制终止服务器进程")
                self.node_process.kill()
                self.node_process.wait()
            except Exception as e:
                print(f"❌ 停止服务器时出错: {e}")
    
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