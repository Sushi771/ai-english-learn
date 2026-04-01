import os
import requests
import jwt
from jwt import PyJWTError, algorithms as jwt_algorithms
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://osotmqdwnwrgwfececmm.supabase.co")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

security = HTTPBearer()

# 缓存公钥，避免每次请求都去拉 JWKS
_jwks_cache: dict = {}

def _get_public_key(kid: str):
    """从 JWKS 端点获取对应 kid 的公钥，带简单内存缓存。"""
    if kid in _jwks_cache:
        return _jwks_cache[kid]

    try:
        resp = requests.get(JWKS_URL, timeout=5)
        resp.raise_for_status()
        jwks = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"无法获取 JWKS 公钥: {e}"
        )

    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            public_key = jwt_algorithms.ECAlgorithm.from_jwk(key_data)
            _jwks_cache[kid] = public_key
            return public_key

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"JWKS 中未找到 kid={kid} 对应的公钥"
    )

def _get_unverified_header(token: str) -> dict:
    """不验签，仅解码 header 以获取 kid 和 alg。"""
    return jwt.get_unverified_header(token)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """验证 Supabase JWT（ES256）并提取 user_id。"""
    token = credentials.credentials

    try:
        header = _get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "ES256")

        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWT header 缺少 kid 字段"
            )

        public_key = _get_public_key(kid)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            options={"verify_aud": False}
        )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWT payload 缺少 sub 字段"
            )

        return user_id

    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT 验证失败: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
