export interface SystemResponse {
  name: string;
  description: string;
  value: number; // double di C++ menjadi number di TS
  status: string;
  icon: string;
}

export interface ServiceStatus {
  name: string;
  description: string;
  uptime: string;
  response: string;
  cpu: string;
  memory: string;
  status: string;
  icon: string;
}

export interface ServiceResponse {
  services: ServiceStatus[];
}