"""Les 3 tables de la base de données : users, locaux, detections."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


class User(Base):
    """Un compte utilisateur : admin, superviseur ou technicien."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    nom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    telephone = Column(String)
    region = Column(String)
    password = Column(String, nullable=False)        # Mot de passe haché (jamais en clair)
    role = Column(String, nullable=False)            # "admin" | "superviseur" | "technicien"

    # Hiérarchie entre utilisateurs
    admin_id = Column(Integer, ForeignKey("users.id"))        # L'admin qui chapeaute tout
    superviseur_id = Column(Integer, ForeignKey("users.id"))  # Pour un technicien : son superviseur


class Local(Base):
    """Un local électrique surveillé."""
    __tablename__ = "locaux"

    id = Column(Integer, primary_key=True)
    identifiant = Column(String, unique=True, nullable=False)  # Ex : code barre ou ID unique
    nom = Column(String)
    region = Column(String, nullable=False)
    adresse = Column(String)
    latitude = Column(Float, nullable=False)    # Pour placer le marqueur sur la carte
    longitude = Column(Float, nullable=False)
    stream_url = Column(String)                 # Flux vidéo de la caméra en direct

    # Responsabilités
    admin_id = Column(Integer, ForeignKey("users.id"))
    superviseur_id = Column(Integer, ForeignKey("users.id"))   # Superviseur responsable
    technicien_id = Column(Integer, ForeignKey("users.id"))    # Technicien assigné


class Detection(Base):
    """Une anomalie / alerte détectée par votre modèle IA."""
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True)
    local_id = Column(Integer, ForeignKey("locaux.id"), nullable=False, index=True)
    type = Column(String, nullable=False)       # Ex : incendie, fumée, étincelle
    confiance = Column(Float, default=0)        # Score de confiance de l'IA (entre 0 et 1)
    image_url = Column(String)                  # Capture de la détection
    date = Column(DateTime, default=datetime.utcnow)