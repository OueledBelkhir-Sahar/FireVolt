export type AlertLevel = 'normal' | 'suspect' | 'alert';

export interface User {
  id: number;
  name: string;
  email: string;
  administrator: boolean;
  regions: string; // "Tunis,Bizerte"
  disabled: boolean;
  createdBy?: number | null;
  password?: string;
}


export interface Local {
  id: number;
  name: string;
  uniqueId: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  cameraSource: string;
  status: 'online' | 'offline' | 'unknown';
  alertLevel: AlertLevel;
  lastUpdate?: string | null;
}

export interface FvEvent {
  id: number;
  deviceId: number;
  deviceName?: string | null;
  region?: string | null;
  type: string; // fire | smoke | spark
  level: 'suspect' | 'alert';
  confidence: number;
  eventTime: string;
}

export interface Stats {
  locals: number;
  online: number;
  activeAlerts: number;
  byRegion: Record<string, number>;
  supervisors?: number;
}

export const TYPE_LABEL: Record<string, string> = { fire: 'Feu', smoke: 'Fumée', spark: 'Étincelle' };
export const TYPE_ICON: Record<string, string> = { fire: 'fa-fire', smoke: 'fa-smog', spark: 'fa-bolt' };
export const LEVEL_LABEL: Record<string, string> = { normal: 'Normal', suspect: 'Suspect', alert: 'Alerte' };
export const LEVEL_CLASS: Record<string, string> = { normal: 'ok', suspect: 'warn', alert: 'danger' };

export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;
export const typeIcon = (t: string) => TYPE_ICON[t] ?? 'fa-triangle-exclamation';
export const levelLabel = (l: string) => LEVEL_LABEL[l] ?? l;
export const levelClass = (l: string) => LEVEL_CLASS[l] ?? 'ok';

export const regionsOf = (u: User | null) =>
  (u?.regions ?? '').split(',').map((r) => r.trim()).filter(Boolean);
