@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo 🔗 CoderLink 启动器
echo 📋 智能联系人管理系统  
echo ========================================
echo.

echo 🔍 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，请先安装Python 3.6+
    echo 📥 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python环境检查通过
echo 🚀 正在启动CoderLink...
echo.
echo 💡 提示：
echo    - 服务器启动后会自动打开浏览器
echo    - 按 Ctrl+C 可停止服务器
echo    - 关闭此窗口也会停止服务器
echo.
echo ⏳ 启动中，请稍候...
echo ========================================

python launcher.py

echo.
echo 👋 CoderLink 已停止运行
echo 感谢使用！
pause