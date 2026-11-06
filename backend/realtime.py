"""
Temps réel : garde la liste des navigateurs connectés (WebSockets)
et diffuse instantanément les alertes aux utilisateurs concernés.
"""
from typing import List, Tuple
from fastapi import WebSocket


class Hub:
    def __init__(self):
        # Liste des tuples (connexion_websocket, id_utilisateur)
        self.clients: List[Tuple[WebSocket, int]] = []

    async def connecter(self, ws: WebSocket, user_id: int):
        """Accepte la connexion WebSocket et enregistre le client."""
        await ws.accept()
        self.clients.append((ws, user_id))

    def deconnecter(self, ws: WebSocket):
        """Retire le client lorsqu'il ferme son navigateur."""
        self.clients = [c for c in self.clients if c[0] is not ws]

    async def diffuser(self, message: dict, destinataires: List[int]):
        """Envoie l'alerte uniquement aux personnes concernées (admin, superviseur, technicien)."""
        ids = {i for i in destinataires if i is not None}
        for ws, uid in list(self.clients):
            if uid in ids:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.deconnecter(ws)


# Instance unique partagée dans toute l'application
hub = Hub()