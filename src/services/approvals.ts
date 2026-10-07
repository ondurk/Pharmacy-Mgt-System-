import { ApprovalRequest, User, UserRole } from '../types';

export interface ApprovalCheckResult {
  canApprove: boolean;
  reason?: string;
}

/**
 * Validates whether the given user can approve the specified request.
 * Enforces key business rule:
 * 1. Dual Control: NO user can approve their own transaction.
 * 2. Role Privilege: Only 'director' or 'admin' can approve.
 */
export function validateApprovalPermission(
  request: ApprovalRequest,
  currentUser: User
): ApprovalCheckResult {
  // Check 1: Role authority
  const allowedRoles: UserRole[] = ['director', 'admin'];
  if (!allowedRoles.includes(currentUser.role)) {
    return {
      canApprove: false,
      reason: `Unauthorized: Role '${currentUser.role}' does not have director-level approval privileges.`,
    };
  }

  // Check 2: Strict Dual-Control (Anti Self-Approval)
  if (request.requestedByUserId === currentUser.id) {
    return {
      canApprove: false,
      reason: `Segregation of Duties Violation: You cannot approve your own transaction (requested by ${currentUser.name}). Must be reviewed by another Director.`,
    };
  }

  return { canApprove: true };
}
