export class Position {
  id!: number;
  attributes!: PositionAttributes;
  deviceId!: number;
  protocol!: string;
  serverTime!: Date;
  deviceTime!: Date;
  fixTime!: Date;
  outdated!: boolean;
  valid!: boolean;
  latitude!: number;
  longitude!: number;
  altitude!: number;
  speed!: number;
  course!: number;
  address!: string;
  accuracy!: number;
  network!: string;
  geofenceIds!: number[];
  deviceName!: string;
  uniqueId!: string;
  model!: string;
  nameDriver!: string;
  status!: string;
}

export class PositionAttributes {
  ignition!: boolean;
  status!: number;
  io1!: string;
  io2!: string;
  io3!: string;
  io4!: string;
  io5!: string;
  io6!: string;
  io7!: string;
  distance!: number;
  totalDistance!: number;
  motion!: boolean;
  batteryLevel!: number;
}

export class Device {
  id!: number;
  attributes!: DeviceAttributes;
  groupId!: number;
  calendarId!: number;
  name!: string;
  uniqueId!: string;
  status!: string;
  lastUpdate!: Date;
  positionId!: number;
  phone!: string;
  model!: string;
  contact!: string;
  category!: string;
  disabled!: boolean;
  expirationTime!: any;
}

export class DeviceAttributes {
  nameDriver!: string;
  carNumber!: string;
  speedLimit!: string;
  region!: string
}

export class EnrichedPosition {
  position!: Position;
  device!: Device;
}

export interface Driver {
  id: number
  attributes: {
    carNumber: string
    region: string
  }
  name: string
  email: string
  phone: string
  driver: true
  password: any
}


export interface Superviseur {
  id: number
  attributes: {
    region: string
  }
  name: string
  email: string
  phone: string
  supervisor: boolean
  password: any
}


export interface User {
  id: number
  attributes: UserAttributes
  name: string
  login: any
  email: string
  phone: string
  readonly: boolean

  administrator: boolean
  supervisor: boolean
  driver: boolean
  map: any
  latitude: number
  longitude: number
  zoom: number
  coordinateFormat: any
  disabled: boolean
  expirationTime: any
  deviceLimit: number
  userLimit: number
  deviceReadonly: boolean
  limitCommands: boolean
  disableReports: boolean
  fixedEmail: boolean
  poiLayer: any
  totpKey: any
  temporary: boolean
  password: any
}

export interface UserAttributes {
  carNumber: string
}

