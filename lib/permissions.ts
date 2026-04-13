export type Role = 'super_admin' | 'org_admin' | 'staff' | 'student';

// Basic role helpers
export const isSuperAdmin = (role?: Role | null) => role === 'super_admin';
export const isOrgAdmin = (role?: Role | null) => role === 'org_admin';
export const isStaff = (role?: Role | null) => role === 'staff';
export const isStudent = (role?: Role | null) => role === 'student';

// Hierarchy checks
export const isAdminOrAbove = (role?: Role | null) => isSuperAdmin(role) || isOrgAdmin(role);
export const isStaffOrAbove = (role?: Role | null) => isAdminOrAbove(role) || isStaff(role);

// Strict Capability checks mirroring the permissions matrix
export const permissions = {
  canAddOrgAdmins: (role?: Role | null) => isAdminOrAbove(role),
  canAddStaff: (role?: Role | null) => isAdminOrAbove(role),
  canAddStudents: (role?: Role | null) => isStaffOrAbove(role),
  
  canCreateBatches: (role?: Role | null) => isStaffOrAbove(role),
  canCreateSubjects: (role?: Role | null) => isAdminOrAbove(role),
  
  canCreateMeeting: (role?: Role | null) => isStaffOrAbove(role),
  canJoinMeeting: (role?: Role | null) => !!role, // Anyone authenticated
  
  canStartRecording: (role?: Role | null) => isStaffOrAbove(role),
  canDrawWhiteboard: (role?: Role | null) => isStaffOrAbove(role), // Students are host-granted only in MeetingRoom
  
  canPostQA: (role?: Role | null) => !!role,
  canAnswerPinQA: (role?: Role | null) => isStaffOrAbove(role),
  
  canViewAllOrgs: (role?: Role | null) => isSuperAdmin(role),
  canManageOrgSettings: (role?: Role | null) => isAdminOrAbove(role),
  
  canViewLectureHistory: (role?: Role | null) => !!role, // UI filters properly by assignment
  canViewRecordings: (role?: Role | null) => !!role, // UI filters properly by assignment
};
