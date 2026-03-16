import { LAB_ROOMS } from './constants';

export const MOCK_USERS = [
  {
    uid: 'admin-1',
    name: 'Admin User',
    email: 'admin@neu.edu',
    role: 'Admin',
    blocked: false,
    QR_String: 'ADM-001'
  },
  {
    uid: 'prof-1',
    name: 'Dr. Sarah Johnson',
    email: 's.johnson@neu.edu',
    role: 'Professor',
    blocked: false,
    QR_String: 'PROF-101'
  },
  {
    uid: 'prof-2',
    name: 'Prof. Michael Chen',
    email: 'm.chen@neu.edu',
    role: 'Professor',
    blocked: true,
    QR_String: 'PROF-102'
  },
  {
    uid: 'prof-3',
    name: 'Dr. Elena Rodriguez',
    email: 'e.rodriguez@neu.edu',
    role: 'Professor',
    blocked: false,
    QR_String: 'PROF-103'
  }
];

export const MOCK_ROOM_LOGS = [
  {
    id: 'log-1',
    professorId: 'prof-1',
    professorName: 'Dr. Sarah Johnson',
    roomId: 'M101',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() - 1800000).toISOString(),
    status: 'Completed'
  },
  {
    id: 'log-2',
    professorId: 'prof-3',
    professorName: 'Dr. Elena Rodriguez',
    roomId: 'M105',
    timestamp: new Date().toISOString(),
    status: 'Active'
  },
  {
    id: 'log-3',
    professorId: 'prof-1',
    professorName: 'Dr. Sarah Johnson',
    roomId: 'M111',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 82800000).toISOString(),
    status: 'Completed'
  }
];