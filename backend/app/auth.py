import hashlib
import hmac
import os

from fastapi import Depends, HTTPException, Request

from .db import SessionLocal, User


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return salt.hex() + "$" + dk.hex()


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, hash_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 200_000)
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


def user_regions(user: User) -> list[str]:
    return [r.strip() for r in (user.regions or "").split(",") if r.strip()]


def current_user(request: Request) -> User:
    """Lit le cookie de session (JSESSIONID, comme Traccar)."""
    uid = request.session.get("uid")
    if not uid:
        raise HTTPException(401, "Non authentifié")
    with SessionLocal() as db:
        user = db.get(User, uid)
    if not user or user.disabled:
        request.session.clear()
        raise HTTPException(401, "Session invalide")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if not user.administrator:
        raise HTTPException(403, "Réservé à l'administrateur")
    return user
