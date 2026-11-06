"""Routes d'authentification : connexion et récupération du profil connecté."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserOut
from security import check_pw, creer_token, current_user

# Préfixe pour toutes les routes de ce fichier : /auth
router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Connexion d'un utilisateur.
    Remarque : selon la norme OAuth2, le champ s'appelle 'username', mais on y passe l'email.
    """
    user = db.query(User).filter(User.email == form.username).first()

    # Vérification : utilisateur existe et mot de passe valide
    if not user or not check_pw(form.password, user.password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    # Renvoie le token ainsi que les informations essentielles pour le frontend
    return {
        "access_token": creer_token(user.id),
        "token_type": "bearer",
        "id": user.id,
        "role": user.role,
        "nom": user.nom,
        "region": user.region,
    }


@router.get("/me", response_model=UserOut)
def moi(user: User = Depends(current_user)):
    """Renvoie le profil de l'utilisateur actuellement connecté via son token."""
    return user