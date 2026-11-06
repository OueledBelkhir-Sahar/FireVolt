import {Superviseur} from '../models/models.model';

export function createDefaultSuperviseur(): Superviseur {
  return {
    id: 0,
    attributes: {
      region: ''
    },
    name: '',
    email: '',
    phone: '',
    password: '',
    supervisor: true,
  };
}
