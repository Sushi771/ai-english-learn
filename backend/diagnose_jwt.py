import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()

print("=== JWT 诊断工具 ===")
print()

# 1. 检查 JWT Secret
secret = os.getenv("SUPABASE_JWT_SECRET", "")
print(f"SUPABASE_JWT_SECRET 长度: {len(secret)}")
print(f"前4个字符: {secret[:4] if secret else 'N/A'}")
print()

# 2. 解码一个测试 token（用户粘贴）
print("请将你的 Supabase access_token 粘贴到下方（从浏览器 Application > LocalStorage 或 Cookie 中获取）：")
token = input("Token: ").strip()

if token:
    try:
        header_b64 = token.split('.')[0]
        # 修复 base64 padding
        header_b64 += '=' * (4 - len(header_b64) % 4)
        header = json.loads(base64.b64decode(header_b64))
        print()
        print(f"✅ JWT Header: {json.dumps(header, indent=2)}")
        print()
        print(f"算法 (alg): {header.get('alg', '未找到')}")
        
        # 3. 尝试用 PyJWT 解码
        import jwt
        try:
            payload = jwt.decode(token, secret.encode("utf-8"), algorithms=[header.get("alg", "HS256")], options={"verify_aud": False})
            print(f"✅ PyJWT 解码成功！user_id (sub): {payload.get('sub')}")
        except Exception as e:
            print(f"❌ PyJWT 解码失败: {e}")
    except Exception as e:
        print(f"❌ Header 解析失败: {e}")
