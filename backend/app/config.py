"""Configuration FireVolt (surchargeable par variables d'environnement)."""
import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./firevolt.db")

# Compte administrateur créé au premier démarrage
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administrateur")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@firevolt.tn")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
SEED_DEMO = os.getenv("SEED_DEMO", "1") == "1"  # 1 superviseur + 3 locaux de démonstration

# Moteur IA intégré (lecture caméra + YOLO)
ENABLE_DETECTOR = os.getenv("ENABLE_DETECTOR", "1") == "1"
MODEL_PATH = os.getenv("MODEL_PATH", "../weights/best.pt")  #  best.pt de spark_detector
IMGSZ = int(os.getenv("IMGSZ", "640"))

# Logique de décision (slide 10) : NORMAL / SUSPECT / ALERTE
SUSPECT_CONF = float(os.getenv("SUSPECT_CONF", "0.25"))
ALERT_CONF = float(os.getenv("ALERT_CONF", "0.55"))
ALERT_CLASSES = set(os.getenv("ALERT_CLASSES", "fire,smoke,spark").split(","))
EVENT_COOLDOWN = int(os.getenv("EVENT_COOLDOWN", "30"))  # s entre 2 événements (même local + même classe)
CLEAR_AFTER = int(os.getenv("CLEAR_AFTER", "8"))  # s sans détection => retour à NORMAL

# Clé pour un service IA externe qui POST sur /api/detections
AI_API_KEY = os.getenv("AI_API_KEY", "firevolt-ai-key")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",")
