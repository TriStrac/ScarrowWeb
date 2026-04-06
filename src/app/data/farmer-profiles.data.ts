export interface FarmerDevice {
  id: string;
  centralName: string;
  status: 'Active' | 'Inactive';
  online: boolean;
  frequencyHz: number;
  lastTriggered: string;
  location: string;
  linkedNodeCount: number;
}

export interface FarmerProfile {
  id: string;
  name: string;
  farmName: string;
  role: string;
  devices: FarmerDevice[];
}

export const PROFILE_BY_ID: Record<string, FarmerProfile> = {
  '1': {
    id: '1',
    name: 'Juan Dela Cruz',
    farmName: 'Scarrow Demo Farm',
    role: 'Farmer',
    devices: [
      {
        id: '101',
        centralName: 'Central Hub Alpha',
        status: 'Active',
        online: true,
        frequencyHz: 200,
        lastTriggered: '45 seconds ago',
        location: 'Field A',
        linkedNodeCount: 3,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Maria Santos',
    farmName: 'Scarrow Demo Farm',
    role: 'Farmer',
    devices: [
      {
        id: '201',
        centralName: 'Central Hub North',
        status: 'Active',
        online: true,
        frequencyHz: 150,
        lastTriggered: '2 minutes ago',
        location: 'North plot',
        linkedNodeCount: 0,
      },
      {
        id: '202',
        centralName: 'Central Hub Shed',
        status: 'Inactive',
        online: false,
        frequencyHz: 120,
        lastTriggered: '3 days ago',
        location: 'Shed B',
        linkedNodeCount: 0,
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Pedro Ramos',
    farmName: 'Scarrow Demo Farm',
    role: 'Farmer',
    devices: [
      {
        id: '301',
        centralName: 'Central Hub Field',
        status: 'Active',
        online: true,
        frequencyHz: 180,
        lastTriggered: '12 minutes ago',
        location: 'Rice paddy 2',
        linkedNodeCount: 0,
      },
    ],
  },
};

export function findDeviceById(deviceId: string): FarmerDevice | null {
  for (const profile of Object.values(PROFILE_BY_ID)) {
    const d = profile.devices.find((x) => x.id === deviceId);
    if (d) return d;
  }
  return null;
}
