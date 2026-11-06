"""Connexion à la base de données SQLite (un simple fichier : app.db)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Le moteur de connexion vers le fichier SQLite
engine = create_engine(
    "sqlite:///./app.db",
    connect_args={"check_same_thread": False}
)

# 2. L'usine pour créer des sessions de travail avec la base
SessionLocal = sessionmaker(bind=engine, autoflush=False)

# 3. La classe de base dont hériteront tous nos modèles de tables
Base = declarative_base()


# 4. La dépendance FastAPI pour gérer le cycle de vie d'une connexion
def get_db():
    """Ouvre une session pour chaque requête HTTP, puis la referme proprement."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()