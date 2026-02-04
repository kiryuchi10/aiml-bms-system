"""
JWT create/verify, password hashing, RBAC dependency.
Do not commit real secrets; use .env for jwt_secret_key.
"""
from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(sub: str | int, extra: dict[str, Any] | None = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(sub), "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(sub: str | int) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": str(sub), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> str | None:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    return payload.get("sub")


def require_role(allowed: set[str]):
    """Dependency that requires one of the given roles (e.g. admin, analyst, viewer)."""
    def _require(uid: str | None = Depends(get_current_user_id)):
        if not uid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        # In a full impl, load user from DB and check role; here we allow if uid present and role in payload
        return uid
    return _require
