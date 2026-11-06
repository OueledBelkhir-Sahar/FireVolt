"""
Point d'entrée principal de l'API FireVolt.
Lancement : cd backend ; python -m uvicorn main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from models import User
from routers import auth, detections, locaux, stats, users
from security import hash_pw


@asynccontextmanager
async def demarrage(app: FastAPI):
    """
    S'exécute automatiquement au lancement de l'application :
    1. Crée les tables dans app.db si elles n'existent pas encore.
    2. Crée le premier compte administrateur par défaut s'il n'existe pas.
    """
    Base.metadata.create_all(engine)
    db = SessionLocal()

    # Création automatique de l'admin principal si la base est neuve
    if not db.query(User).filter(User.role == "admin").first():
        admin = User(
            nom="admin",
            email="admin@poste.tn",
            telephone="",
            region="Tunis",
            password=hash_pw("admin123"),
            role="admin",
        )
        db.add(admin)
        db.flush()
        admin.admin_id = admin.id  # L'admin est son propre propriétaire
        db.commit()
        print(" Compte administrateur créé : admin@poste.tn / admin123")

    db.close()
    yield


# Initialisation de l'application FastAPI
app = FastAPI(title="FireVolt API", version="1.0.0", lifespan=demarrage)

# Configuration CORS (permet au frontend Angular de communiquer avec l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion de tous nos routeurs modulaires
app.include_router(auth.router)
app.include_router(users.superviseurs_router)
app.include_router(users.techniciens_router)
app.include_router(locaux.router)
app.include_router(detections.router)
app.include_router(stats.router)