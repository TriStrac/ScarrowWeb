/** Shared demo org roster for Organization + Messages (DM threads). */
export interface OrgMember {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  roleBadge: string;
  registeredDeviceCount: number;
}

export const DEMO_ORG_NAME = 'Scarrow Demo Farm';

export const DEMO_ORG_MEMBERS: OrgMember[] = [
  {
    id: '1',
    name: 'Head Admin',
    username: '@admin',
    email: 'admin@scarrow.local',
    phone: '09170000001',
    address: 'Scarrow HQ, Cabanatuan City, Nueva Ecija',
    role: 'Admin',
    roleBadge: 'Admin',
    registeredDeviceCount: 2,
  },
  {
    id: '2',
    name: 'Juan Dela Cruz',
    username: '@juan_dc',
    email: 'juan.d@scarrow.local',
    phone: '09171234567',
    address: '123 Rizal St., Brgy. San Jose, Cabanatuan City, Nueva Ecija',
    role: 'Member',
    roleBadge: 'Farmer',
    registeredDeviceCount: 1,
  },
  {
    id: '3',
    name: 'Ana Reyes',
    username: '@ana_r',
    email: 'ana.r@scarrow.local',
    phone: '09179876543',
    address: '45 Mabini Ave., Cabanatuan City, Nueva Ecija',
    role: 'Member',
    roleBadge: 'Farmer',
    registeredDeviceCount: 0,
  },
  {
    id: '4',
    name: 'Pedro Ramos',
    username: '@pedro_r',
    email: 'pedro.r@scarrow.local',
    phone: '09175550123',
    address: 'Sitio Maligaya, Talavera, Nueva Ecija',
    role: 'Member',
    roleBadge: 'Farmer',
    registeredDeviceCount: 3,
  },
];

export function getOrgMemberById(id: string): OrgMember | undefined {
  return DEMO_ORG_MEMBERS.find((m) => m.id === id);
}

/** Direct-message thread id for an org member (avoids colliding with system thread ids like "1","2"). */
export function dmThreadIdForMember(memberId: string): string {
  return `dm-${memberId}`;
}
