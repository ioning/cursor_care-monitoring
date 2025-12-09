export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Device {
  id: string;
  name: string;
  deviceType: string;
  status: string;
  lastSeenAt?: string;
}

export interface TelemetryData {
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

