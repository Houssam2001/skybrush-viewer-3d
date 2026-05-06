export type DroneModelType = 'sphere' | 'quad' | 'flapper';

export function isValidDroneModelType(value: string): value is DroneModelType {
  return value === 'sphere' || value === 'quad' || value === 'flapper';
}

export type CustomEnvironmentSettings = {
  modelUrl?: string;
  hdrUrl?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  cameraPosition?: [number, number, number];
  shadows: boolean;
  googleApiKey?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  useGoogleMaps?: boolean;
  testMode?: boolean;
};
