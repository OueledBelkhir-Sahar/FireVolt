"""Gestion des locaux électriques surveillés."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Detection, Local, User
from portee import local_ou_404, locaux_visibles, techniciens_visibles
from schemas import AssocierIn, DetectionOut, LocalIn, LocalOut
from security import current_user, exiger

router = APIRouter(prefix="/locaux", tags=["Locaux électriques"])


def _identifiant_libre(db: Session, identifiant: str, sauf_id: int = None):
    """Vérifie que le code/identifiant unique du local n'est pas déjà pris."""
    q = db.query(Local).filter(Local.identifiant == identifiant)
    if sauf_id:
        q = q.filter(Local.id != sauf_id)
    if q.first():
        raise HTTPException(status_code=400, detail="Cet identifiant de local existe déjà")


@router.get("", response_model=List[LocalOut])
def liste_locaux(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Liste tous les locaux accessibles par l'utilisateur connecté."""
    return locaux_visibles(db, user).all()


@router.get("/{lid}", response_model=LocalOut)
def un_local(lid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Récupère les détails d'un local précis (vérifie l'autorisation)."""
    return local_ou_404(db, user, lid)


@router.post("", response_model=LocalOut, status_code=201)
def creer_local(data: LocalIn, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Crée un nouveau local électrique."""
    _identifiant_libre(db, data.identifiant)
    local = Local(
        **data.model_dump(),
        admin_id=user.admin_id,
        superviseur_id=user.id if user.role == "superviseur" else None
    )
    db.add(local)
    db.commit()
    db.refresh(local)
    return local


@router.put("/{lid}", response_model=LocalOut)
def modifier_local(lid: int, data: LocalIn, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Modifie les informations d'un local (nom, GPS, stream_url...)."""
    local = local_ou_404(db, user, lid)
    _identifiant_libre(db, data.identifiant, sauf_id=lid)
    for champ, valeur in data.model_dump().items():
        setattr(local, champ, valeur)
    db.commit()
    db.refresh(local)
    return local


@router.delete("/{lid}")
def supprimer_local(lid: int, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Supprime un local et purge l'historique de ses détections associées."""
    local = local_ou_404(db, user, lid)
    db.query(Detection).filter(Detection.local_id == lid).delete()
    db.delete(local)
    db.commit()
    return {"ok": True}


@router.put("/{lid}/associer", response_model=LocalOut)
def associer_technicien(lid: int, data: AssocierIn, user: User = Depends(exiger("admin", "superviseur")), db: Session = Depends(get_db)):
    """Assigne un technicien à un local (ou retire l'assignation si technicien_id est null)."""
    local = local_ou_404(db, user, lid)
    if data.technicien_id is None:
        local.technicien_id = None
    else:
        t = techniciens_visibles(db, user).filter(User.id == data.technicien_id).first()
        if not t:
            raise HTTPException(status_code=400, detail="Technicien introuvable dans votre périmètre")
        local.technicien_id = t.id
        local.superviseur_id = t.superviseur_id
    db.commit()
    db.refresh(local)
    return local


@router.get("/{lid}/historique", response_model=List[DetectionOut])
def historique_detections(lid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Renvoie les 200 dernières alertes/détections pour ce local."""
    local_ou_404(db, user, lid)
    return (
        db.query(Detection)
        .filter(Detection.local_id == lid)
        .order_by(Detection.date.desc())
        .limit(200)
        .all()
    )