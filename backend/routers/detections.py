"""Détections de l'IA : réception, notifications et alertes en direct."""
import os
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Detection, Local, User
from portee import locaux_visibles
from realtime import hub
from schemas import DetectionIn, DetectionOut
from security import current_user, utilisateur_depuis_token

# Clé API secrète que votre script IA doit fournir dans l'en-tête HTTP
AI_API_KEY = os.getenv("AI_API_KEY", "cle-ia-secrete")

router = APIRouter(tags=["Détections IA"])


@router.post("/detections", response_model=DetectionOut, status_code=201)
async def nouvelle_detection(data: DetectionIn, x_api_key: str = Header(...), db: Session = Depends(get_db)):
    """
    Appelée par votre script YOLO / IA dès qu'une anomalie (fumée, étincelle...) est détectée.
    """
    if x_api_key != AI_API_KEY:
        raise HTTPException(status_code=401, detail="Clé API IA invalide")

    local = db.get(Local, data.local_id)
    if not local:
        raise HTTPException(status_code=404, detail="Local introuvable")

    # Enregistrement en base de données
    d = Detection(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)

    # Diffusion en temps réel aux responsables de ce local précis
    await hub.diffuser(
        {
            "id": d.id,
            "local_id": local.id,
            "local": local.nom or local.identifiant,
            "region": local.region,
            "type": d.type,
            "confiance": d.confiance,
            "image_url": d.image_url,
            "date": d.date.isoformat(),
        },
        [local.admin_id, local.superviseur_id, local.technicien_id],
    )
    return d


@router.get("/detections", response_model=List[DetectionOut])
def notifications(limite: int = 100, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Renvoie les dernières alertes visibles par l'utilisateur (pour la cloche de notification)."""
    ids = [i for (i,) in locaux_visibles(db, user).with_entities(Local.id).all()]
    if not ids:
        return []
    return (
        db.query(Detection)
        .filter(Detection.local_id.in_(ids))
        .order_by(Detection.date.desc())
        .limit(limite)
        .all()
    )


@router.websocket("/ws/alertes")
async def ws_alertes(ws: WebSocket, token: str):
    """Canal WebSocket ouvert par le frontend pour recevoir les alertes instantanées."""
    db = SessionLocal()
    try:
        user = utilisateur_depuis_token(token, db)
        user_id = user.id
    except HTTPException:
        await ws.close(code=4401)
        return
    finally:
        db.close()

    await hub.connecter(ws, user_id)
    try:
        while True:
            # Maintient la connexion ouverte
            await ws.receive_text()
    except WebSocketDisconnect:
        hub.deconnecter(ws)