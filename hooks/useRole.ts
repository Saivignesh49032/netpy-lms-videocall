'use client';

import { useUser } from './useUser';
import { 
  permissions,
  isSuperAdmin,
  isOrgAdmin,
  isStaff,
  isStudent,
  isAdminOrAbove,
  isStaffOrAbove,
  Role
} from '@/lib/permissions';

export const useRole = () => {
  const { user, isLoaded } = useUser();
  const role = user?.role as Role | undefined;

  return {
    user,
    role,
    isLoaded,
    
    // Direct Hierarchy Checks
    isSuperAdmin: isSuperAdmin(role),
    isOrgAdmin: isOrgAdmin(role),
    isStaff: isStaff(role),
    isStudent: isStudent(role),
    isAdminOrAbove: isAdminOrAbove(role),
    isStaffOrAbove: isStaffOrAbove(role),

    // Advanced Permissions
    can: {
      addOrgAdmins: permissions.canAddOrgAdmins(role),
      addStaff: permissions.canAddStaff(role),
      addStudents: permissions.canAddStudents(role),
      createBatches: permissions.canCreateBatches(role),
      createSubjects: permissions.canCreateSubjects(role),
      createMeeting: permissions.canCreateMeeting(role),
      joinMeeting: permissions.canJoinMeeting(role),
      startRecording: permissions.canStartRecording(role),
      drawWhiteboard: permissions.canDrawWhiteboard(role),
      postQA: permissions.canPostQA(role),
      answerPinQA: permissions.canAnswerPinQA(role),
      viewAllOrgs: permissions.canViewAllOrgs(role),
      manageOrgSettings: permissions.canManageOrgSettings(role),
      viewLectureHistory: permissions.canViewLectureHistory(role),
      viewRecordings: permissions.canViewRecordings(role),
    }
  };
};
