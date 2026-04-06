import { PROFILE_BY_ID } from './farmer-profiles.data';

/**
 * Demo registry: central hubs with paired node devices.
 * Central history = coordination / comms with nodes; node history = pest deterrence events for reports.
 */

export type PestClass = 'Bird' | 'Rodent';

/** Shown on the central device history table (comms / coordination, not pest strikes). */
export interface CentralCommHistoryEntry {
  /** Display label, e.g. "4/6/26 (2:15 PM)" */
  timeTriggered: string;
  /** What the central did or observed (sync, relay, alert). */
  event: string;
  /** Which node was involved, or "—" for hub-only. */
  nodeDevice: string;
  /** Short outcome (latency, RSSI, command ack). */
  detail: string;
}

/** One pest-detection / deterrence cycle on a node (for reporting). */
export interface NodePestHistoryEntry {
  timeTriggered: string;
  /** ISO-like local datetime for filtering and charts (e.g. 2026-04-06T06:05:00). */
  occurredAt: string;
  pestClass: PestClass;
  frequencyHz: number;
  /** Raw length for charts / exports. */
  durationSeconds: number;
  /** Human-readable, e.g. "3 min 20 s" or "45 s". */
  durationDisplay: string;
}

export interface ScarrowNodeDeviceMock {
  id: string;
  parentCentralId: string;
  deviceName: string;
  location: string;
  model: string;
  online: boolean;
  batteryPercent: number;
  firmwareVersion: string;
  history: NodePestHistoryEntry[];
}

export interface ScarrowCentralDeviceMock {
  id: string;
  deviceName: string;
  location: string;
  model: string;
  online: boolean;
  batteryPercent: number;
  firmwareVersion: string;
  nodes: ScarrowNodeDeviceMock[];
  history: CentralCommHistoryEntry[];
}

const CENTRAL_HUB_ALPHA: ScarrowCentralDeviceMock = {
  id: '101',
  deviceName: 'Central Hub Alpha',
  location: 'Field A',
  model: 'Model X',
  online: true,
  batteryPercent: 78,
  firmwareVersion: 'v1.2.3',
  history: [
    {
      timeTriggered: '4/6/26 (6:12 AM)',
      event: 'Scheduled telemetry pull',
      nodeDevice: 'Node East A',
      detail: 'OK · 38 ms',
    },
    {
      timeTriggered: '4/6/26 (5:48 AM)',
      event: 'Relayed deterrence command',
      nodeDevice: 'Node North B',
      detail: 'Ack · 19 kHz profile',
    },
    {
      timeTriggered: '4/5/26 (9:22 PM)',
      event: 'Node heartbeat missed (retry)',
      nodeDevice: 'Node South C',
      detail: 'Recovered after 2 pings',
    },
    {
      timeTriggered: '4/5/26 (4:10 PM)',
      event: 'Firmware status sync',
      nodeDevice: 'Node East A',
      detail: 'v1.2.3 · battery 82%',
    },
    {
      timeTriggered: '4/5/26 (11:05 AM)',
      event: 'Mesh route optimization',
      nodeDevice: 'All nodes',
      detail: '3/3 paths stable',
    },
  ],
  nodes: [
    {
      id: '101-n1',
      parentCentralId: '101',
      deviceName: 'Node East A',
      location: 'Field A · East berm',
      model: 'Model X-N',
      online: true,
      batteryPercent: 82,
      firmwareVersion: 'v1.2.3',
      history: [
        {
          timeTriggered: '4/6/26 (6:05 AM)',
          occurredAt: '2026-04-06T06:05:00',
          pestClass: 'Bird',
          frequencyHz: 18500,
          durationSeconds: 200,
          durationDisplay: '3 min 20 s',
        },
        {
          timeTriggered: '4/5/26 (7:40 PM)',
          occurredAt: '2026-04-05T19:40:00',
          pestClass: 'Rodent',
          frequencyHz: 22000,
          durationSeconds: 90,
          durationDisplay: '1 min 30 s',
        },
        {
          timeTriggered: '4/5/26 (2:18 PM)',
          occurredAt: '2026-04-05T14:18:00',
          pestClass: 'Bird',
          frequencyHz: 19200,
          durationSeconds: 45,
          durationDisplay: '45 s',
        },
      ],
    },
    {
      id: '101-n2',
      parentCentralId: '101',
      deviceName: 'Node North B',
      location: 'Field A · North fence',
      model: 'Model X-N',
      online: true,
      batteryPercent: 71,
      firmwareVersion: 'v1.2.2',
      history: [
        {
          timeTriggered: '4/6/26 (5:45 AM)',
          occurredAt: '2026-04-06T05:45:00',
          pestClass: 'Rodent',
          frequencyHz: 23500,
          durationSeconds: 720,
          durationDisplay: '12 min',
        },
        {
          timeTriggered: '4/4/26 (6:12 PM)',
          occurredAt: '2026-04-04T18:12:00',
          pestClass: 'Bird',
          frequencyHz: 18000,
          durationSeconds: 1080,
          durationDisplay: '18 min',
        },
      ],
    },
    {
      id: '101-n3',
      parentCentralId: '101',
      deviceName: 'Node South C',
      location: 'Field A · South gate',
      model: 'Model X-N',
      online: true,
      batteryPercent: 65,
      firmwareVersion: 'v1.2.3',
      history: [
        {
          timeTriggered: '4/5/26 (10:02 PM)',
          occurredAt: '2026-04-05T22:02:00',
          pestClass: 'Bird',
          frequencyHz: 20000,
          durationSeconds: 300,
          durationDisplay: '5 min',
        },
        {
          timeTriggered: '4/4/26 (8:55 AM)',
          occurredAt: '2026-04-04T08:55:00',
          pestClass: 'Rodent',
          frequencyHz: 22800,
          durationSeconds: 60,
          durationDisplay: '1 min',
        },
      ],
    },
  ],
};

const CENTRAL_BY_ID: Record<string, ScarrowCentralDeviceMock> = {
  [CENTRAL_HUB_ALPHA.id]: CENTRAL_HUB_ALPHA,
};

const NODE_BY_ID: Record<string, ScarrowNodeDeviceMock> = {};
for (const c of Object.values(CENTRAL_BY_ID)) {
  for (const n of c.nodes) {
    NODE_BY_ID[n.id] = n;
  }
}

export function getScarrowCentralMock(centralId: string): ScarrowCentralDeviceMock | null {
  return CENTRAL_BY_ID[centralId] ?? null;
}

export function getScarrowNodeMock(nodeId: string): ScarrowNodeDeviceMock | null {
  return NODE_BY_ID[nodeId] ?? null;
}

export function getNodesForCentral(centralId: string): ScarrowNodeDeviceMock[] {
  return getScarrowCentralMock(centralId)?.nodes ?? [];
}

/** Nodes registered under this central (for farmer card counts, etc.). */
export function countNodesForCentral(centralId: string): number {
  return getNodesForCentral(centralId).length;
}

/** Flat row for reports: one pest-deterrence cycle on a node paired to a central hub. */
export interface ReportPestEvent {
  occurredAt: string;
  timeTriggered: string;
  pestClass: PestClass;
  frequencyHz: number;
  durationSeconds: number;
  nodeId: string;
  nodeName: string;
  location: string;
  /** Farmer profile device id (the central hub). */
  centralId: string;
  centralName: string;
  farmerId: string;
  farmerName: string;
}

/**
 * All pest-deterrence events from **node devices linked to centrals** listed on farmer profiles.
 * Each row is tied to `centralId` (hub) and `nodeId` (field node).
 */
export function getAllReportPestEvents(): ReportPestEvent[] {
  const out: ReportPestEvent[] = [];
  for (const profile of Object.values(PROFILE_BY_ID)) {
    for (const central of profile.devices) {
      const nodes = getNodesForCentral(central.id);
      for (const n of nodes) {
        for (const h of n.history) {
          out.push({
            occurredAt: h.occurredAt,
            timeTriggered: h.timeTriggered,
            pestClass: h.pestClass,
            frequencyHz: h.frequencyHz,
            durationSeconds: h.durationSeconds,
            nodeId: n.id,
            nodeName: n.deviceName,
            location: n.location,
            centralId: central.id,
            centralName: central.centralName,
            farmerId: profile.id,
            farmerName: profile.name,
          });
        }
      }
    }
  }
  return out;
}

/**
 * Pest events recorded on **node devices** paired to the given central hub.
 * Central hubs do not emit pest rows; only their linked nodes do.
 */
export function getNodePestEventsForCentral(centralId: string): ReportPestEvent[] {
  return getAllReportPestEvents().filter((e) => e.centralId === centralId);
}

/** Node pest events for centrals assigned to this farmer (via profile devices). */
export function getReportPestEventsForFarmer(farmerId: string): ReportPestEvent[] {
  return getAllReportPestEvents().filter((e) => e.farmerId === farmerId);
}
