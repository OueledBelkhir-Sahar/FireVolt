"""
La 'portée' : filtre ce que chaque rôle a le droit de VOIR.
- admin       -> tout ce qui appartient à son compte
- superviseur -> ses techniciens et les locaux qui lui sont rattachés
- technicien  -> uniquement les locaux qui lui sont associés
"""
from fastapi import HTTPException
from sqlalchemy.orm import Query, Session

from models import Local, User


def locaux_visibles(db: Session, user: User) -> Query:
    """Renvoie la requête filtrée des locaux selon les droits de l'utilisateur."""
    q = db.query(Local)

    if user.role == "admin":
        return q.filter(Local.admin_id == user.id)
    if user.role == "superviseur":
        return q.filter(Local.superviseur_id == user.id)
    # Technicien : uniquement les locaux assignés à son id
    return q.filter(Local.technicien_id == user.id)


def techniciens_visibles(db: Session, user: User) -> Query:
    """Renvoie la liste des techniciens accessibles pour cet utilisateur."""
    q = db.query(User).filter(User.role == "technicien")

    if user.role == "admin":
        return q.filter(User.admin_id == user.id)
    if user.role == "superviseur":
        return q.filter(User.superviseur_id == user.id)
    # Un technicien ne voit que son propre profil
    return q.filter(User.id == user.id)


def local_ou_404(db: Session, user: User, local_id: int) -> Local:
    """
    Récupère un local par son ID seulement si l'utilisateur a le droit d'y accéder.
    Renvoie une erreur 404 sinon (évite qu'un utilisateur fouille les locaux des autres).
    """
    local = locaux_visibles(db, user).filter(Local.id == local_id).first()
    if not local:
        raise HTTPException(status_code=404, detail="Local introuvable ou non autorisé")
    return local