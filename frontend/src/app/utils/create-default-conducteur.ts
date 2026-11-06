import {Driver} from '../models/models.model';

export function createDefaultConducteur(): Driver {
  return {
    id: 0,
    attributes: {
      carNumber: '',
      region: ''
    },
    name: '',
    email: '',
    phone: '',
    password: '',
    driver: true,
  };
}
