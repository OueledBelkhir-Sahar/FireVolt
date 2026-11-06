"""Sécurité : hachage des mots de passe, jeton JWT et contrôle des rôles."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User

# Clé secrète pour signer les jetons JWT (à changer en production via variable d'environnement)
SECRET = os.getenv("SECRET_KEY", "change-me-cle-secrete-firevolt")
oauth2 = OAuth2PasswordBearer(tokenUrl="auth/login")


# ==========================================
# 1. HACHAGE DES MOTS DE PASSE (Bcrypt)
# ==========================================
def hash_pw(mot_de_passe: str) -> str:
    """Transforme un mot de passe en clair en empreinte chiffrée impossible à inverser."""
    return bcrypt.hashpw(mot_de_passe.encode(), bcrypt.gensalt()).decode()


def check_pw(mot_de_passe: str, hache: str) -> bool:
    """Compare un mot de passe en clair avec l'empreinte stockée en base."""
    return bcrypt.checkpw(mot_de_passe.encode(), hache.encode())


# ==========================================
# 2. GESTION DU JETON JWT
# ==========================================
def creer_token(user_id: int) -> str:
    """Génère un jeton signé valable 12 heures contenant l'identifiant de l'utilisateur."""
    exp = datetime.now(timezone.utc) + timedelta(hours=12)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET, algorithm="HS256")


def utilisateur_depuis_token(token: str, db: Session) -> User:
    """Décode le token et renvoie l'utilisateur correspondant depuis la base."""
    try:
        uid = int(jwt.decode(token, SECRET, algorithms=["HS256"])["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user


# ==========================================
# 3. DÉPENDANCES FASTAPI (Authentification & Rôles)
# ==========================================
def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    """Dépendance FastAPI : récupère l'utilisateur actuellement connecté depuis le header HTTP."""
    return utilisateur_depuis_token(token, db)


def exiger(*roles_autorises: str):
    """
    Réserve une route à certains rôles précis.
    Exemple d'utilisation : Depends(exiger("admin", "superviseur"))
    """

    def verifier(user: User = Depends(current_user)) -> User:
        if user.role not in roles_autorises:
            raise HTTPException(status_code=403, detail="Accès refusé pour votre rôle")
        return user

    return verifier