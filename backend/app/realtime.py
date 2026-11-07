"""Temps réel : état des locaux, diffusion WebSocket, logique de décision et lecture caméra + YOLO."""
import asyncio
import logging
import threading
import time

from fastapi import WebSocket

from . import config
from .auth import user_regions
from .db import Device, Event, SessionLocal, User, iso, utcnow

log = logging.getLogger("firevolt")


# --------------------------------------------------------------------------- état en mémoire
class State:
    def __init__(self):
        self.level: dict[int, str] = {}  # normal | suspect | alert
        self.status: dict[int, str] = {}  # online | offline | unknown
        self.last_seen: dict[int, float] = {}
        self.last_event: dict[tuple[int, str], float] = {}


STATE = State()


def device_dict(d: Device) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "uniqueId": d.unique_id,
        "region": d.region,
        "address": d.address,
        "latitude": d.latitude,
        "longitude": d.longitude,
        "cameraSource": d.camera_source,
        "status": STATE.status.get(d.id, "unknown"),
        "alertLevel": STATE.level.get(d.id, "normal"),
        "lastUpdate": iso(d.last_update),
    }


def event_dict(e: Event, d: Device | None = None) -> dict:
    return {
        "id": e.id,
        "deviceId": e.device_id,
        "deviceName": d.name if d else None,
        "region": d.region if d else None,
        "type": e.type,
        "level": e.level,
        "confidence": round(e.confidence, 3),
        "eventTime": iso(e.event_time),
    }


# --------------------------------------------------------------------------- WebSocket hub
class Hub:
    """Diffuse {devices|events|deletedDevices} aux clients autorisés ."""

    def __init__(self):
        self.loop: asyncio.AbstractEventLoop | None = None
        self.clients: list[tuple[WebSocket, bool, set[str]]] = []

    async def connect(self, ws: WebSocket, user: User):
        await ws.accept()
        self.clients.append((ws, user.administrator, set(user_regions(user))))

    def disconnect(self, ws: WebSocket):
        self.clients = [c for c in self.clients if c[0] is not ws]

    def publish(self, payload: dict, region: str | None):
        """Utilisable depuis n'importe quel thread."""
        if self.loop and not self.loop.is_closed():
            asyncio.run_coroutine_threadsafe(self._broadcast(payload, region), self.loop)

    async def _broadcast(self, payload: dict, region: str | None):
        for ws, is_admin, regions in list(self.clients):
            if is_admin or region is None or region in regions:
                try:
                    await ws.send_json(payload)
                except Exception:
                    self.disconnect(ws)


hub = Hub()


# --------------------------------------------------------------------------- logique de décision
def handle_detection(device_id: int, label: str, conf: float):
    """NORMAL / SUSPECT / ALERTE (slide 10) + journalisation + diffusion temps réel."""
    now = time.time()
    level = "alert" if (label in config.ALERT_CLASSES and conf >= config.ALERT_CONF) else "suspect"
    prev = STATE.level.get(device_id, "normal")
    if prev == "alert" and level == "suspect" and now - STATE.last_seen.get(device_id, 0) < config.CLEAR_AFTER:
        level = "alert"  # on ne redescend pas en 'suspect' tant que l'alerte est fraîche
    STATE.last_seen[device_id] = now
    STATE.level[device_id] = level

    ev_payload = None
    with SessionLocal() as db:
        d = db.get(Device, device_id)
        if not d:
            return
        d.last_update = utcnow()
        key = (device_id, label)
        escalated = level == "alert" and prev != "alert"
        if escalated or now - STATE.last_event.get(key, 0) >= config.EVENT_COOLDOWN:
            ev = Event(device_id=device_id, type=label, level=level, confidence=conf)
            db.add(ev)
            STATE.last_event[key] = now
            db.commit()
            ev_payload = event_dict(ev, d)
        else:
            db.commit()
        dev_payload = device_dict(d)
        region = d.region

    if level != prev:
        hub.publish({"devices": [dev_payload]}, region)
    if ev_payload:
        hub.publish({"events": [ev_payload]}, region)


async def janitor():
    """Repasse les locaux à NORMAL quand plus rien n'est détecté."""
    while True:
        await asyncio.sleep(2)
        now = time.time()
        for did, lvl in list(STATE.level.items()):
            if lvl != "normal" and now - STATE.last_seen.get(did, 0) > config.CLEAR_AFTER:
                STATE.level[did] = "normal"
                with SessionLocal() as db:
                    d = db.get(Device, did)
                    if d:
                        hub.publish({"devices": [device_dict(d)]}, d.region)


def set_status(device_id: int, status: str):
    if STATE.status.get(device_id) == status:
        return
    STATE.status[device_id] = status
    with SessionLocal() as db:
        d = db.get(Device, device_id)
        if d:
            hub.publish({"devices": [device_dict(d)]}, d.region)


# --------------------------------------------------------------------------- lecture caméra + YOLO
class CameraWorker(threading.Thread):
    def __init__(self, device_id: int, source: str, model):
        super().__init__(daemon=True, name=f"camera-{device_id}")
        self.device_id = device_id
        self.source = source
        self.model = model
        self.stop_evt = threading.Event()
        self.latest: bytes | None = None
        self.frame_id = 0

    def run(self):
        import cv2

        src = int(self.source) if self.source.isdigit() else self.source
        while not self.stop_evt.is_set():
            cap = cv2.VideoCapture(src)
            if not cap.isOpened():
                set_status(self.device_id, "offline")
                cap.release()
                self.stop_evt.wait(5)
                continue
            set_status(self.device_id, "online")
            while not self.stop_evt.is_set():
                ok, frame = cap.read()
                if not ok:
                    break
                out = frame
                if self.model is not None:
                    try:
                        res = self.model.predict(frame, imgsz=config.IMGSZ, conf=config.SUSPECT_CONF, verbose=False)[0]
                        out = res.plot()
                        best: dict[str, float] = {}
                        for b in res.boxes:
                            label = str(res.names[int(b.cls)]).lower()
                            best[label] = max(best.get(label, 0.0), float(b.conf))
                        for label, conf in best.items():
                            handle_detection(self.device_id, label, conf)
                    except Exception as exc:  # ne jamais tuer le flux à cause d'une erreur d'inférence
                        log.warning("inférence %s : %s", self.device_id, exc)
                ok2, buf = cv2.imencode(".jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 70])
                if ok2:
                    self.latest = buf.tobytes()
                    self.frame_id += 1
            cap.release()
            set_status(self.device_id, "offline")
            self.stop_evt.wait(2)


class WorkerManager:
    def __init__(self):
        self.workers: dict[int, CameraWorker] = {}
        self._model = None
        self._model_loaded = False

    def _get_model(self):
        if not self._model_loaded:
            self._model_loaded = True
            try:
                from ultralytics import YOLO

                self._model = YOLO(config.MODEL_PATH)
                log.info("Modèle YOLO chargé : %s", config.MODEL_PATH)
            except Exception as exc:
                log.warning("Modèle non chargé (%s) : flux vidéo brut sans détection", exc)
        return self._model

    def start(self, d: Device):
        self.stop(d.id)
        if not (config.ENABLE_DETECTOR and d.camera_source):
            return
        try:
            import cv2  # noqa: F401
        except ImportError:
            log.warning("opencv absent : pas de flux pour le local %s", d.id)
            return
        w = CameraWorker(d.id, d.camera_source.strip(), self._get_model())
        self.workers[d.id] = w
        w.start()

    def stop(self, device_id: int):
        w = self.workers.pop(device_id, None)
        if w:
            w.stop_evt.set()
        STATE.status.pop(device_id, None)
        STATE.level.pop(device_id, None)

    def start_all(self):
        with SessionLocal() as db:
            for d in db.query(Device).all():
                self.start(d)

    def stop_all(self):
        for did in list(self.workers):
            self.stop(did)


workers = WorkerManager()
