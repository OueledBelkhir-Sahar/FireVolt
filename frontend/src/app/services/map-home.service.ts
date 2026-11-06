import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import {Device, EnrichedPosition, Position} from '../models/models.model';


@Injectable({
  providedIn: 'root'
})
export class MapHomeService {
  private socket: WebSocket | undefined; // l'objet WebSocket qui va écouter les données en temps réel
  private devicesMap: Map<number, any> = new Map(); //une mémoire locale pour stocker les devices par ID
  fullData$: BehaviorSubject<EnrichedPosition[] | null> = new BehaviorSubject<EnrichedPosition[] | null>(null); //Un Subject pour envoyer des positions enrichies aux composants qui écoutent
  //fullData$ = this.fullDataSubject.asObservable(); //Un Observable public  pour recevoir les données dans le composant.
  socketEvents: BehaviorSubject<any> = new BehaviorSubject(null);
 // private latestPositions: Map<number, any> = new Map();

  constructor(private http: HttpClient) {}

  getGeofencesByDeviceId(deviceId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/geofences?deviceId=${deviceId}`);
  }
  // Si le device n'est pas encore connu (pas dans devicesMap), il va faire un GET /devices?id=xxx
  private fetchDeviceById(deviceId: number): Promise<any> {
    const params = new HttpParams().set('id', deviceId.toString());
    return this.http.get<Device>(`${environment.apiURL}devices/${deviceId}`).toPromise();
  }

  connectWebSocket() {

    this.socket = new WebSocket(`${environment.apiURL.replace('http', 'ws')}socket`);

    //À chaque réception d'un message WebSocket
    this.socket.onmessage = async (event) => {
      //transformation du message reçu (JSON) en objet JavaScript
      const data = JSON.parse(event.data);
      if (data.events) {
        this.socketEvents.next(data.events);
      }
      //le message contient un tableau devices
      if (data.devices) {
        //parcourt chaque device et on le stocke dans devicesMap
        data.devices.forEach((device: any) => {
          this.devicesMap.set(device.id, device);
        });
      }

      //Si le message contient aussi des positions
      if (data.positions) {
        //On enrichit toutes les positions en parallèle (avec Promise.all)
        const enrichedPositions: EnrichedPosition[] = await Promise.all(
          data.positions.map(async (position: any) => {
            const deviceId = position.deviceId;
            //On récupère l'appareil associé à cette position depuis devicesMap
            let device = this.devicesMap.get(deviceId);

            //'appareil n'existe pas encore dans devicesMap "hors ligne"
            if (!device) {
              try {
                const result = await this.fetchDeviceById(deviceId); //await  on attend la réponse avant de continuer
                //Si result est défini, on prend result[0]
                console.log('resultSock', result);
                device = result;
                if (device) {
                  //l'ajoute dans devicesMap
                  this.devicesMap.set(device.id, device);
                }
              } catch (error) {
                console.error(`Erreur lors du fetch deviceId=${deviceId}`, error);
              }
            }

            return {
              position: position,
              device: device,
            };
          })
        );


        //On envoie toutes les positions enrichies à ceux qui écoutent
        this.fullData$.next(enrichedPositions);
      }
    };

    //erreur du websocket
    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    //fermeture du websocket automatique :serveur qui plante, erreur réseau
    this.socket.onclose = (event) => {
      console.log('WebSocket closed', event);
    };
  }
  // Méthode pour créer une géofence
  createGeofence(geofence: any): Observable<any> {
    return this.http.post<any>('/api/geofences', geofence);
  }

  // Méthode pour associer un device à une géofence
  linkDeviceToGeofence(deviceId: number, geofenceId: number): Observable<any> {
    return this.http.post<any>('/api/permissions', {
      deviceId: deviceId,
      geofenceId: geofenceId,
    });
  }


  //fermeture manuellement
  disconnectWebSocket() {
    if (this.socket) {
      this.socket.close();
    }
  }
}


