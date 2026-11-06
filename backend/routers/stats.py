"""Statistiques du tableau de bord d'accueil, adaptées selon le rôle."""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Local, User
from portee import locaux_visibles, techniciens_visibles
from security import current_user

router = APIRouter(tags=["Statistiques"])


@router.get("/stats")
def stats(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Renvoie les compteurs pour les cartes du dashboard d'accueil."""
    # Répartition des locaux par région
    par_region = (
        locaux_visibles(db, user)
        .with_entities(Local.region, func.count(Local.id))
        .group_by(Local.region)
        .all()
    )

    resultat = {
        "nb_locaux": locaux_visibles(db, user).count(),
        "locaux_par_region": [{"region": r, "count": c} for r, c in par_region],
    }

    # Données réservées à l'Admin
    if user.role == "admin":
        resultat["nb_superviseurs"] = db.query(User).filter(
            User.role == "superviseur", User.admin_id == user.id
        ).count()

    # Données pour l'Admin et le Superviseur
    if user.role in ("admin", "superviseur"):
        resultat["nb_techniciens"] = techniciens_visibles(db, user).count()

    return resultat