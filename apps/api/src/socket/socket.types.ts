import { Socket } from 'socket.io';
import { IUser, UserRole } from '@nirikshan/shared-types';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: IUser;
  };
}

export interface IGpsLocationStreamPayload {
  inspectionId: string;
  coordinates: [number, number]; // [longitude, latitude]
  accuracyMeters?: number;
  speedKmh?: number;
  headingDeg?: number;
  batteryLevel?: number;
  timestamp: string;
}
