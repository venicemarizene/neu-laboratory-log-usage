export const LAB_ROOMS = [
  'M101', 'M102', 'M103', 'M104', 'M105',
  'M106', 'M107', 'M108', 'M109', 'M110', 'M111'
] as const;

export type LabRoom = (typeof LAB_ROOMS)[number];

export const USER_ROLES = {
  ADMIN: 'Admin',
  PROFESSOR: 'Professor',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
