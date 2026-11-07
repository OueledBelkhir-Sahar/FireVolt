# 🔥 FireVolt

**Surveillance intelligente et détection précoce d'incendie dans les locaux électriques.**

FireVolt analyse en temps réel le flux de caméras installées dans des locaux électriques (postes de distribution, locaux techniques) et détecte trois situations dangereuses : **feu**, **fumée** et **étincelles**. Dès qu'une détection est confirmée, l'alerte est diffusée instantanément aux superviseurs concernés via une application web.


---

## Contexte

Les locaux électriques sont intégrés au cœur des villes, à proximité immédiate du public et des habitations, et ne bénéficient pas d'une surveillance humaine permanente. Un départ de feu non détecté rapidement peut se propager aux habitations voisines, aux véhicules et à l'environnement.

Les capteurs classiques (fumée, chaleur) réagissent tard : ils dépendent de la propagation physique des particules jusqu'au plafond, ne couvrent que le voisinage du capteur et ne localisent pas l'origine du foyer. FireVolt utilise la **vision par ordinateur** pour détecter dès le premier signe visuel, sur tout le volume vu par la caméra, avec une boîte englobante qui délimite l'anomalie.

## Fonctionnalités

**Administrateur**
- Tableau de bord : nombre de superviseurs créés, nombre de locaux, caméras en ligne, alertes actives.
- Carte géographique de tous les locaux : un clic zoome sur le local et permet d'ouvrir son flux en direct.
- Gestion des superviseurs : liste (nom, e-mail, régions), ajout, modification, désactivation, suppression.
- Gestion des locaux : identifiant, localisation exacte (carte interactive), région, source caméra, accès au flux et à l'historique.

**Superviseur**
- Tableau de bord : nombre de locaux **par région**, carte limitée à ses régions.
- Gestion des locaux de ses régions, flux en direct et historique des détections.

**Temps réel**
- Pins de carte colorés selon l'état (normal / suspect / alerte), notification instantanée en cas d'alerte.
- Flux vidéo annoté par le modèle, directement dans le navigateur.
- Historique des détections mis à jour en direct.

## Architecture

```
 Caméra (webcam, IP RTSP, ESP32-CAM)
        │ flux vidéo
        ▼
┌─────────────────────────────── Backend FastAPI (port 8082) ──────────────────────────────┐
│  Thread caméra ─► YOLO (best.pt) ─► logique de décision ─► SQLite (utilisateurs, locaux,  │
│                                      Normal/Suspect/Alerte    événements)                 │
│                         │                                                                  │
│          REST /api/*  +  WebSocket /api/socket  +  flux MJPEG /api/devices/{id}/stream     │
└───────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                │ proxy /api (dev)
                                                ▼
                               Frontend Angular 19 (port 4200)
                          Leaflet (carte) · signaux · WebSocket
```

| Couche | Technologie |
|---|---|
| IA | YOLO26 (Ultralytics), classes `fire`, `smoke`, `spark` |
| API | FastAPI, SQLAlchemy, SQLite, WebSocket |
| Frontend | Angular 19 (composants standalone, signaux), Leaflet, FontAwesome |
| Authentification | session par cookie signé (`JSESSIONID`), mots de passe PBKDF2-SHA256 |


## Moteur IA

- Modèle : **YOLO26s**, entraîné pendant 100 époques (`imgsz=800`, `patience=20`) sur le jeu de données *spark_detector* (3 classes : feu, fumée, étincelle).
- Poids : [`weights/best.pt`](weights/best.pt)
- Résultats d'entraînement : dossier [`results/`](results/)

| Courbe F1 | Courbe précision-rappel | Matrice de confusion |
|---|---|---|
| ![F1](results/BoxF1_curve.png) | ![PR](results/BoxPR_curve.png) | ![Confusion](results/confusion_matrix_normalized.png) |

### Logique de décision

| État | Condition (réglable) | Action |
|---|---|---|
| **Normal** | aucune détection | veille silencieuse |
| **Suspect** | confiance entre 0,25 et 0,55 | enregistré dans l'historique, pin orange |
| **Alerte** | `fire`, `smoke` ou `spark` avec confiance ≥ 0,55 | notification temps réel, pin rouge, événement enregistré |

Retour automatique à *Normal* après 8 s sans détection. Un anti-spam limite l'enregistrement à un événement toutes les 30 s par local et par classe (le passage à l'alerte est toujours enregistré).

## Structure du dépôt

```
FireVolt/
├─ backend/
│  ├─ app/
│  │  ├─ main.py        point d'entrée, middlewares, données de démonstration
│  │  ├─ config.py      réglages (variables d'environnement)
│  │  ├─ db.py          modèles User, Device, Event
│  │  ├─ auth.py        hachage des mots de passe, session, droits
│  │  ├─ realtime.py    état, WebSocket, décision, threads caméra + YOLO
│  │  └─ routes.py      endpoints REST, flux MJPEG, WebSocket
│  └─ requirements.txt
├─ frontend/
│  ├─ src/app/
│  │  ├─ core/          modèles, services (auth, API, store temps réel), gardes
│  │  ├─ layout/        coquille (menu latéral, notifications)
│  │  ├─ pages/         connexion, tableau de bord, superviseurs, locaux, historique
│  │  └─ shared/        carte, sélecteur de position, fenêtre de flux
│  └─ proxy.conf.json
├─ weights/             modèle entraîné (best.pt)
└─ results/             courbes et résultats d'entraînement
```

## Installation

**Prérequis** : Python 3.10+, Node.js 20+ (Angular 19), une webcam ou une caméra IP pour tester le flux. Un GPU NVIDIA est recommandé pour la détection fluide.

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Linux / macOS : source .venv/bin/activate
pip install -r requirements.txt
pip install opencv-python-headless ultralytics   # moteur vidéo + IA
uvicorn app.main:app --port 8082 --reload
```

Documentation interactive de l'API : http://localhost:8082/docs

*Option GPU (Windows, CUDA 12.6) :*
`pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126 --force-reinstall`

Le serveur doit être lancé **depuis le dossier `backend`** (chemins relatifs vers la base et vers `../weights/best.pt`).

### 2. Frontend

```bash
cd frontend
npm install
npm start          # ng serve avec le proxy vers le backend
```

Application : http://localhost:4200

### 3. Brancher une caméra

Dans l'application : *Locaux électriques* → modifier un local → champ **Source caméra** :

| Source | Valeur |
|---|---|
| Webcam du serveur | `0` |
| Caméra IP | `rtsp://utilisateur:motdepasse@adresse/flux` |
| ESP32-CAM (MJPEG) | `http://adresse:81/stream` |

## Comptes de démonstration

Créés au premier démarrage (3 locaux de démonstration à Tunis, Bizerte et Sfax) :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Administrateur | `admin@firevolt.tn` | `admin123` |
| Superviseur (Tunis, Bizerte) | `sup@firevolt.tn` | `sup123` |

⚠️ **À changer avant tout déploiement** (voir *Configuration*).

## Configuration

Variables d'environnement lues par `backend/app/config.py` :

| Variable | Défaut | Rôle |
|---|---|---|
| `SECRET_KEY` | `change-me-in-production` | signature du cookie de session |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@firevolt.tn` / `admin123` | compte administrateur initial |
| `SEED_DEMO` | `1` | `0` pour ne pas créer les données de démonstration |
| `DATABASE_URL` | `sqlite:///./firevolt.db` | base de données |
| `MODEL_PATH` | `../weights/best.pt` | poids YOLO |
| `ENABLE_DETECTOR` | `1` | `0` pour désactiver la lecture caméra |
| `SUSPECT_CONF` / `ALERT_CONF` | `0.25` / `0.55` | seuils de décision |
| `ALERT_CLASSES` | `fire,smoke,spark` | classes déclenchant une alerte |
| `EVENT_COOLDOWN` / `CLEAR_AFTER` | `30` / `8` (secondes) | anti-spam / retour à normal |
| `AI_API_KEY` | `firevolt-ai-key` | clé du point d'entrée `/api/detections` |

## API

| Méthode | Route | Accès |
|---|---|---|
| `POST` `GET` `DELETE` | `/api/session` | connexion, session courante, déconnexion |
| `GET` `POST` `PUT` `DELETE` | `/api/users` | administrateur (superviseurs) |
| `GET` `POST` `PUT` `DELETE` | `/api/devices` | administrateur : tous · superviseur : ses régions |
| `GET` | `/api/devices/{id}/stream` | flux MJPEG annoté |
| `GET` | `/api/events` | historique (filtres `deviceId`, `level`, `limit`) |
| `GET` | `/api/stats` | compteurs du tableau de bord |
| `POST` | `/api/detections` | service IA externe (en-tête `X-API-Key`) |
| `WS` | `/api/socket` | diffusion temps réel (`devices`, `events`, `deletedDevices`) |

Simuler une détection sans caméra :

```bash
curl -X POST http://localhost:8082/api/detections \
  -H "X-API-Key: firevolt-ai-key" -H "Content-Type: application/json" \
  -d '{"uniqueId": "LOC-TUN-001", "label": "fire", "confidence": 0.9}'
```

## Sécurité

- Mots de passe hachés (PBKDF2-SHA256, sel aléatoire, 200 000 itérations), jamais renvoyés par l'API.
- Cookie de session signé ; compte désactivé = accès refusé immédiatement.
- Contrôle d'accès **côté serveur** : un superviseur n'accède qu'aux locaux de ses régions (404 sinon) et ne peut pas appeler les routes d'administration (403).
- En production : définir `SECRET_KEY`, changer les comptes de démonstration, servir en HTTPS (`https_only=True` pour le cookie) et restreindre `CORS_ORIGINS`.


## Crédits et licences

Les jeux de données d'entraînement proviennent de [Roboflow Universe](https://universe.roboflow.com/) (*Fire-Smoke-Spark* par ZETA et *Spark Detector*), publiés sous licence **CC BY 4.0** : toute réutilisation doit en citer les auteurs.

