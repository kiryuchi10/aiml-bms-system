"""
Auth: POST /login, /refresh, GET /me, POST /logout.
Use .env for jwt_secret_key; do not commit real secrets.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user_id,
)
from app.db.session import get_db

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    # Placeholder: in production, load user by email and verify_password
    from app.models.sql import User
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")
    access = create_access_token(user.id, extra={"role": user.role})
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    sub = payload.get("sub")
    access = create_access_token(sub)
    new_refresh = create_refresh_token(sub)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


class MeResponse(BaseModel):
    id: int
    email: str
    role: str


@router.get("/me", response_model=MeResponse)
def me(uid: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    from app.models.sql import User
    user = db.query(User).filter(User.id == int(uid)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return MeResponse(id=user.id, email=user.email, role=user.role)


@router.post("/logout")
def logout():
    return {"detail": "Logged out"}
