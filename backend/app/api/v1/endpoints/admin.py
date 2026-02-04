"""
Admin: placeholder for admin-only endpoints. Use RBAC (require_role) in production.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/users")
def list_users():
    return {"users": []}
