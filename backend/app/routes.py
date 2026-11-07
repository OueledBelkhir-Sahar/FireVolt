import asyncio

from fastapi import APIRouter, Depends, Form, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import config
from .auth import current_user, hash_password, require_admin, user_regions, verify_password
from .db import Device, Event, SessionLocal, User, utcnow
from .realtime import STATE, device_dict, event_dict, handle_detection, hub, workers

router = APIRouter(prefix="/api")


def get_db():
    with SessionLocal() as db:
        yield db


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


class UserIn(CamelModel):
    name: str
    email: str
    password: str | None = None
    regions: str = ""
    disabled: bool = False


class DeviceIn(CamelModel):
    name: str
    unique_id: str
    region: str = ""
    address: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    camera_source: str = ""


class DetectionIn(CamelModel):
    unique_id: str
    label: str
    confidence: float


def user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "administrator": u.administrator,
        "regions": u.regions,
        "disabled": u.disabled,
        "createdBy": u.created_by,
    }


# --------------------------------------------------------------------------- session
@router.post("/session")
def login(request: Request, email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    u = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if not u or u.disabled or not verify_password(password, u.password_hash):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    request.session["uid"] = u.id
    return user_dict(u)


@router.get("/session")
def get_session(user: User = Depends(current_user)):
    return user_dict(user)


@router.delete("/session", status_code=204)
def logout(request: Request):
    request.session.clear()


# --------------------------------------------------------------------------- superviseurs (admin)
@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(User).filter(User.administrator.is_(False)).order_by(User.id).all()
    return [user_dict(u) for u in rows]


@router.post("/users", status_code=201)
def create_user(body: UserIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if not body.password or len(body.password) < 6:
        raise HTTPException(400, "Mot de passe requis (6 caractères minimum)")
    if db.query(User).filter(func.lower(User.email) == body.email.strip().lower()).first():
        raise HTTPException(409, "Cet e-mail existe déjà")
    u = User(
        name=body.name.strip(),
        email=body.email.strip().lower(),
        password_hash=hash_password(body.password),
        administrator=False,
        regions=body.regions,
        disabled=body.disabled,
        created_by=admin.id,
    )
    db.add(u)
    db.commit()
    return user_dict(u)


@router.put("/users/{user_id}")
def update_user(user_id: int, body: UserIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u or u.administrator:
        raise HTTPException(404, "Superviseur introuvable")
    other = db.query(User).filter(func.lower(User.email) == body.email.strip().lower(), User.id != user_id).first()
    if other:
        raise HTTPException(409, "Cet e-mail existe déjà")
    u.name, u.email, u.regions, u.disabled = body.name.strip(), body.email.strip().lower(), body.regions, body.disabled
    if body.password:
        if len(body.password) < 6:
            raise HTTPException(400, "Mot de passe : 6 caractères minimum")
        u.password_hash = hash_password(body.password)
    db.commit()
    return user_dict(u)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.get(User, user_id)
    if not u or u.administrator:
        raise HTTPException(404, "Superviseur introuvable")
    db.delete(u)
    db.commit()


# --------------------------------------------------------------------------- locaux électriques
def visible_devices(db: Session, user: User):
    q = db.query(Device)
    if not user.administrator:
        q = q.filter(Device.region.in_(user_regions(user) or ["__none__"]))
    return q


def get_visible_device(db: Session, user: User, device_id: int) -> Device:
    d = visible_devices(db, user).filter(Device.id == device_id).first()
    if not d:
        raise HTTPException(404, "Local introuvable")
    return d


def check_region(user: User, region: str) -> str:
    if user.administrator:
        return region.strip()
    regions = user_regions(user)
    region = region.strip() or (regions[0] if regions else "")
    if region not in regions:
        raise HTTPException(403, "Région non autorisée pour ce superviseur")
    return region


@router.get("/devices")
def list_devices(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [device_dict(d) for d in visible_devices(db, user).order_by(Device.id).all()]


@router.post("/devices", status_code=201)
def create_device(body: DeviceIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    region = check_region(user, body.region)
    if db.query(Device).filter(Device.unique_id == body.unique_id.strip()).first():
        raise HTTPException(409, "Cet identifiant existe déjà")
    d = Device(
        name=body.name.strip(), unique_id=body.unique_id.strip(), region=region, address=body.address,
        latitude=body.latitude, longitude=body.longitude, camera_source=body.camera_source.strip(),
        created_by=user.id,
    )
    db.add(d)
    db.commit()
    workers.start(d)
    out = device_dict(d)
    hub.publish({"devices": [out]}, d.region)
    return out


@router.put("/devices/{device_id}")
def update_device(device_id: int, body: DeviceIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = get_visible_device(db, user, device_id)
    region = check_region(user, body.region or d.region)
    if db.query(Device).filter(Device.unique_id == body.unique_id.strip(), Device.id != device_id).first():
        raise HTTPException(409, "Cet identifiant existe déjà")
    old_region, old_src = d.region, d.camera_source
    d.name, d.unique_id, d.region, d.address = body.name.strip(), body.unique_id.strip(), region, body.address
    d.latitude, d.longitude, d.camera_source = body.latitude, body.longitude, body.camera_source.strip()
    db.commit()
    if d.camera_source != old_src:
        workers.start(d)
    out = device_dict(d)
    hub.publish({"devices": [out]}, d.region)
    if old_region != d.region:
        hub.publish({"deletedDevices": [d.id]}, old_region)
    return out


@router.delete("/devices/{device_id}", status_code=204)
def delete_device(device_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = get_visible_device(db, user, device_id)
    region = d.region
    workers.stop(d.id)
    db.query(Event).filter(Event.device_id == d.id).delete()
    db.delete(d)
    db.commit()
    hub.publish({"deletedDevices": [device_id]}, region)


@router.get("/positions")
def positions(user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Compat. Traccar : une position par local (position fixe)."""
    return [
        {"id": d.id, "deviceId": d.id, "latitude": d.latitude, "longitude": d.longitude, "address": d.address}
        for d in visible_devices(db, user).all()
    ]


@router.get("/devices/{device_id}/stream")
async def stream(device_id: int, request: Request, user: User = Depends(current_user)):
    """Flux MJPEG annoté (utilisable directement dans <img src>)."""
    with SessionLocal() as db:
        d = get_visible_device(db, user, device_id)
        did = d.id
    w = workers.workers.get(did)
    if not w:
        raise HTTPException(503, "Flux indisponible : aucune caméra active pour ce local")

    async def gen():
        last = -1
        while not await request.is_disconnected():
            if w.latest and w.frame_id != last:
                last = w.frame_id
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + w.latest + b"\r\n"
            await asyncio.sleep(0.04)

    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")


# --------------------------------------------------------------------------- historique
@router.get("/events")
def list_events(
    device_id: int | None = Query(None, alias="deviceId"),
    level: str | None = None,
    limit: int = Query(200, le=1000),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Event, Device).join(Device, Device.id == Event.device_id)
    if not user.administrator:
        q = q.filter(Device.region.in_(user_regions(user) or ["__none__"]))
    if device_id:
        q = q.filter(Event.device_id == device_id)
    if level:
        q = q.filter(Event.level == level)
    rows = q.order_by(Event.event_time.desc()).limit(limit).all()
    return [event_dict(e, d) for e, d in rows]


# --------------------------------------------------------------------------- statistiques
@router.get("/stats")
def stats(user: User = Depends(current_user), db: Session = Depends(get_db)):
    devices = visible_devices(db, user).all()
    by_region: dict[str, int] = {}
    for d in devices:
        by_region[d.region or "—"] = by_region.get(d.region or "—", 0) + 1
    out = {
        "locals": len(devices),
        "online": sum(1 for d in devices if STATE.status.get(d.id) == "online"),
        "activeAlerts": sum(1 for d in devices if STATE.level.get(d.id) == "alert"),
        "byRegion": by_region,
    }
    if user.administrator:
        out["supervisors"] = db.query(User).filter(User.created_by == user.id, User.administrator.is_(False)).count()
    return out


# --------------------------------------------------------------------------- service IA externe (optionnel)
@router.post("/detections", status_code=202)
def ingest_detection(body: DetectionIn, x_api_key: str | None = Header(None), db: Session = Depends(get_db)):
    if x_api_key != config.AI_API_KEY:
        raise HTTPException(401, "Clé API invalide")
    d = db.query(Device).filter(Device.unique_id == body.unique_id).first()
    if not d:
        raise HTTPException(404, "Local inconnu")
    handle_detection(d.id, body.label.lower(), body.confidence)
    return {"ok": True}


# --------------------------------------------------------------------------- WebSocket temps réel
@router.websocket("/socket")
async def socket(ws: WebSocket):
    uid = ws.session.get("uid")
    with SessionLocal() as db:
        user = db.get(User, uid) if uid else None
        devices = [device_dict(d) for d in visible_devices(db, user).all()] if user and not user.disabled else []
    if not user or user.disabled:
        await ws.close(code=4401)
        return
    await hub.connect(ws, user)
    try:
        await ws.send_json({"devices": devices})
        while True:
            await ws.receive_text()  # on ignore les messages entrants (keep-alive)
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(ws)
