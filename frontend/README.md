# TrackRp - Frontend

Application web de suivi de véhicules GPS développée avec Angular.

## Important : backend Traccar obligatoire

Ce frontend ne fonctionne pas seul. Il utilise le serveur Traccar
(https://www.traccar.org/) comme backend.
Il faut démarrer Traccar avant de lancer l'application.

## Lancer l'application

1. Démarrer le backend Traccar (par défaut sur http://localhost:8082)
2. Dans le dossier du frontend :

```bash
npm install
ng serve --proxy-config proxy.conf.json
```

3. Ouvrir http://localhost:4200
