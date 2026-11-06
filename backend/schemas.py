"""Schémas Pydantic : la forme des données échangées avec le frontend (In = entrée, Out = sortie)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ==========================================
# UTILISATEURS (Admin, Superviseur, Technicien)
# ==========================================
class UserIn(BaseModel):
    """Ce que le frontend envoie pour créer ou modifier un utilisateur."""
    nom: str
    email: str
    telephone: Optional[str] = None
    region: str
    password: Optional[str] = None          # Obligatoire à la création, facultatif à la modification
    superviseur_id: Optional[int] = None    # Pour un technicien : son superviseur assigné


class UserOut(BaseModel):
    """Ce que l'API renvoie au frontend ."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    nom: str
    email: str
    telephone: Optional[str] = None
    region: Optional[str] = None
    role: str
    superviseur_id: Optional[int] = None


# ==========================================
# LOCAUX ÉLECTRIQUES
# ==========================================
class LocalIn(BaseModel):
    """Données requises pour enregistrer un local électrique."""
    identifiant: str
    nom: Optional[str] = None
    region: str
    adresse: Optional[str] = None
    latitude: float
    longitude: float
    stream_url: Optional[str] = None


class LocalOut(LocalIn):
    """Données d'un local renvoyées avec son ID et les utilisateurs associés."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    superviseur_id: Optional[int] = None
    technicien_id: Optional[int] = None


class AssocierIn(BaseModel):
    """Pour assigner un technicien à un local (ou None pour retirer)."""
    technicien_id: Optional[int] = None


# ==========================================
# DÉTECTIONS IA (Alertes)
# ==========================================
class DetectionIn(BaseModel):
    """Ce que le script d'IA envoie quand il détecte une anomalie."""
    local_id: int
    type: str
    confiance: float = 0
    image_url: Optional[str] = None


class DetectionOut(DetectionIn):
    """Alerte renvoyée au superviseur avec son ID et sa date."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: datetime