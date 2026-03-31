import os
import subprocess
import time
import webbrowser
import sys

def main():
    # 获取脚本所在目录
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)
    
    frontend_path = os.path.join(root, "backend", "frontend")
    
    print(f"--- AI 英语助手 启动器 ---")
    print(f"工作目录: {root}")
    
    # 后端指令
    backend_cmd = f'cd /d "{os.path.join(root, "backend")}" && ..\\.venv\\Scripts\\activate && python -m uvicorn main:app --reload --port 8000'
    # 前端指令
    frontend_cmd = f'cd /d "{frontend_path}" && npm run dev'
    
    try:
        print("[1/3] 启动后端服务...")
        subprocess.Popen(["cmd", "/k", backend_cmd], creationflags=subprocess.CREATE_NEW_CONSOLE)
        
        print("[2/3] 启动前端服务...")
        subprocess.Popen(["cmd", "/k", frontend_cmd], creationflags=subprocess.CREATE_NEW_CONSOLE)
        
        print("[3/3] 7秒后打开浏览器...")
        time.sleep(7)
        webbrowser.open("http://localhost:3000")
        
        print("启动任务已提交。本窗口将在 3 秒后关闭。")
        time.sleep(3)
        
    except Exception as e:
        print(f"启动出错: {e}")
        input("按回车键退出...")

if __name__ == "__main__":
    main()
