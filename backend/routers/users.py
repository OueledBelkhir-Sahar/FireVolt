"""Gestion des superviseurs (réservé à l'admin) et des techniciens (admin + superviseur)."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Local, User
from portee import techniciens_visibles
from schemas import UserIn, UserOut
from security import exiger, hash_pw

# Deux routeurs distincts pour structurer l'API
superviseurs_router = APIRouter(prefix="/superviseurs", tags=["Superviseurs (admin)"])
techniciens_router = APIRouter(prefix="/techniciens", tags=["Techniciens"])


# ==========================================
# FONCTIONS UTILITAIRES INTERNES
# ==========================================
def _email_libre(db: Session, email: str, sauf_id: int = None):
    """Vérifie que l'email n'est pas déjà pris par un autre compte."""
    q = db.query(User).filter(User.email == email)
    if sauf_id:
        q = q.filter(User.id != sauf_id)
    if q.first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")


def _appliquer(u: User, data: UserIn):
    """Met à jour les informations d'un utilisateur et hache le mot de passe s'il est fourni."""
    u.nom, u.email, u.telephone, u.region = data.nom, data.email, data.telephone, data.region
    if data.password:
        u.password = hash_pw(data.password)


def _superviseur_valide(db: Session, admin_id: int, sup_id: int) -> User:
    """Vérifie qu'un superviseur existe et appartient bien à cet admin."""
    sup = db.query(User).filter(
        User.id == sup_id, User.role == "superviseur", User.admin_id == admin_id
    ).first()
    if not sup:
        raise HTTPException(status_code=400, detail="Superviseur introuvable")
    return sup


# ==========================================
# SUPERVISEURS (Accès réservé à l'Admin)
# ==========================================
@superviseurs_router.get("", response_model=List[UserOut])
def liste_superviseurs(admin: User = Depends(exiger("admin")), db: Session = Depends(get_db)):
    """L'admin liste tous ses superviseurs."""
    return db.query(User).filter(User.role == "superviseur", User.admin_id == admin.id).all()


@superviseurs_router.post("", response_model=UserOut, status_code=201)
def creer_superviseur(data: UserIn, admin: User = Depends(exiger("admin")), db: Session = Depends(get_db)):
    """L'admin crée un nouveau compte superviseur."""
    if not data.password:
        raise HTTPException(status_code=400, detail="Le mot de passe est obligatoire")
    _email_libre(db, data.email)
    u = User(role="superviseur", admin_id=admin.id, password="")
    _appliquer(u, data)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _superviseur_ou_404(db: Session, admin: User, uid: int) -> User:
    u = db.query(User).filter(User.id == uid, User.role == "superviseur", User.admin_id == admin.id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Superviseur introuvable")
    return u


@superviseurs_router.put("/{uid}", response_model=UserOut)
def modifier_superviseur(uid: int, data: UserIn, admin: User = Depends(exiger("admin")), db: Session = Depends(get_db)):
    """L'admin modifie les coordonnées ou mot de passe d'un superviseur."""
    u = _superviseur_ou_404(db, admin, uid)
    _email_libre(db, data.email, sauf_id=uid)
    _appliquer(u, data)
    db.commit()
    db.refresh(u)
    return u


@superviseurs_router.delete("/{uid}")
def supprimer_superviseur(uid: int, admin: User = Depends(exiger("admin")), db: Session = Depends(get_db)):
    """Supprime un superviseur s'il n'a plus de techniciens rattachés."""
    u = _superviseur_ou_404(db, admin, uid)
    if db.query(User).filter(User.superviseur_id == uid).first():
        raise HTTPException(status_code=409, detail="Ce superviseur a encore des techniciens : réaffectez-les d'abord")
    # Libère les locaux associés
    db.query(Local).filter(Local.superviseur_id == uid).update({"superviseur_id": None})
    db.delete(u)
    db.commit()
    return {"ok": True}


# ==========================================
# TECHNICIENS (Admin + Superviseur)
# ==========================================
@techniciens_router.get("", response_model=List[UserOut])
def liste_techniciens(user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Liste les techniciens selon la portée de l'utilisateur connecté."""
    return techniciens_visibles(db, user).all()


@techniciens_router.post("", response_model=UserOut, status_code=201)
def creer_technicien(data: UserIn, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Crée un technicien et l'associe à un superviseur."""
    if not data.password:
        raise HTTPException(status_code=400, detail="Le mot de passe est obligatoire")
    _email_libre(db, data.email)

    if user.role == "superviseur":
        sup_id = user.id                       # Rattaché automatiquement à lui-même
    else:
        if not data.superviseur_id:
            raise HTTPException(status_code=400, detail="Choisissez le superviseur du technicien")
        sup_id = _superviseur_valide(db, user.id, data.superviseur_id).id

    t = User(role="technicien", admin_id=user.admin_id, superviseur_id=sup_id, password="")
    _appliquer(t, data)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def _technicien_ou_404(db: Session, user: User, tid: int) -> User:
    t = techniciens_visibles(db, user).filter(User.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Technicien introuvable")
    return t


@techniciens_router.put("/{tid}", response_model=UserOut)
def modifier_technicien(tid: int, data: UserIn, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Met à jour un technicien."""
    t = _technicien_ou_404(db, user, tid)
    _email_libre(db, data.email, sauf_id=tid)
    _appliquer(t, data)

    # L'admin peut changer le superviseur d'un technicien (ses locaux suivront)
    if user.role == "admin" and data.superviseur_id and data.superviseur_id != t.superviseur_id:
        _superviseur_valide(db, user.id, data.superviseur_id)
        t.superviseur_id = data.superviseur_id
        db.query(Local).filter(Local.technicien_id == t.id).update({"superviseur_id": data.superviseur_id})

    db.commit()
    db.refresh(t)
    return t


@techniciens_router.delete("/{tid}")
def supprimer_technicien(tid: int, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Supprime un technicien et libère ses locaux associés."""
    t = _technicien_ou_404(db, user, tid)
    db.query(Local).filter(Local.technicien_id == tid).update({"technicien_id": None})
    db.delete(t)
    db.commit()
    return {"ok": True}