import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from . import config
from .auth import hash_password
from .db import Base, Device, SessionLocal, User, engine
from .realtime import hub, janitor, workers
from .routes import router

logging.basicConfig(level=logging.INFO)


def seed():
    with SessionLocal() as db:
        admin = db.query(User).filter(User.administrator.is_(True)).first()
        if not admin:
            admin = User(
                name=config.ADMIN_NAME, email=config.ADMIN_EMAIL.lower(),
                password_hash=hash_password(config.ADMIN_PASSWORD), administrator=True,
            )
            db.add(admin)
            db.commit()
        if config.SEED_DEMO and db.query(Device).count() == 0:
            db.add(User(
                name="Superviseur Démo", email="sup@firevolt.tn", password_hash=hash_password("sup123"),
                administrator=False, regions="Tunis,Bizerte", created_by=admin.id,
            ))
            db.add_all([
                Device(name="Local Lac 1", unique_id="LOC-TUN-001", region="Tunis", address="Les Berges du Lac, Tunis",
                       latitude=36.8330, longitude=10.2300, created_by=admin.id),
                Device(name="Poste Menzel Jemil", unique_id="LOC-BIZ-001", region="Bizerte", address="Menzel Jemil, Bizerte",
                       latitude=37.2400, longitude=9.9200, created_by=admin.id),
                Device(name="Local Sfax Centre", unique_id="LOC-SFA-001", region="Sfax", address="Centre-ville, Sfax",
                       latitude=34.7406, longitude=10.7603, created_by=admin.id),
            ])
            db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    seed()
    hub.loop = asyncio.get_running_loop()
    task = asyncio.create_task(janitor())
    workers.start_all()
    yield
    task.cancel()
    workers.stop_all()


app = FastAPI(title="FireVolt API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    SessionMiddleware, secret_key=config.SECRET_KEY, session_cookie="JSESSIONID",
    max_age=60 * 60 * 12, same_site="lax", https_only=False,
)
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
