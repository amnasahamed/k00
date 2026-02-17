import { Assignment, Student, Writer, Alert, ActionItem, AssignmentStatus } from '../types';

export const generateAlerts = (
  assignments: Assignment[],
  students: Student[],
  writers: Writer[]
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();

  assignments.forEach((assignment) => {
    const deadline = new Date(assignment.deadline);
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 3600);
    // Calculate overdue days more accurately
    const msPerDay = 1000 * 3600 * 24;
    const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / msPerDay);

    // Critical: Tasks due in < 24h with no writer
    if (
      hoursUntilDeadline > 0 &&
      hoursUntilDeadline < 24 &&
      !assignment.writerId &&
      assignment.status !== AssignmentStatus.COMPLETED &&
      assignment.status !== AssignmentStatus.CANCELLED
    ) {
      alerts.push({
        id: `unassigned-${assignment.id}`,
        type: 'unassigned',
        severity: 'critical',
        title: 'Urgent: Unassigned Task',
        message: `"${assignment.title}" due in ${Math.round(hoursUntilDeadline)}h with no writer assigned!`,
        assignmentId: assignment.id,
        actionLabel: 'Assign Writer',
        timestamp: now.toISOString(),
      });
    }

    // Critical: Overdue tasks
    if (
      deadline < now &&
      assignment.status !== AssignmentStatus.COMPLETED &&
      assignment.status !== AssignmentStatus.CANCELLED
    ) {
      alerts.push({
        id: `overdue-${assignment.id}`,
        type: 'overdue',
        severity: 'critical',
        title: 'Overdue Task',
        message: `"${assignment.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
        assignmentId: assignment.id,
        actionLabel: 'Update Status',
        timestamp: now.toISOString(),
      });
    }

    // Warning: Deadline approaching (24-48h)
    if (
      hoursUntilDeadline > 24 &&
      hoursUntilDeadline < 48 &&
      assignment.status === AssignmentStatus.IN_PROGRESS
    ) {
      alerts.push({
        id: `deadline-${assignment.id}`,
        type: 'deadline',
        severity: 'warning',
        title: 'Deadline Approaching',
        message: `"${assignment.title}" due in ${Math.round(hoursUntilDeadline)}h`,
        assignmentId: assignment.id,
        actionLabel: 'Check Progress',
        timestamp: now.toISOString(),
      });
    }

    // Critical: Payment overdue (7+ days)
    const student = students.find((s) => s.id === assignment.studentId);
    const remainingAmount = assignment.price - assignment.paidAmount;
    if (
      remainingAmount > 0 &&
      deadline < now &&
      daysOverdue >= 7 &&
      assignment.status === AssignmentStatus.COMPLETED
    ) {
      alerts.push({
        id: `payment-${assignment.id}`,
        type: 'payment',
        severity: 'critical',
        title: 'Payment Overdue',
        message: `₹${remainingAmount.toLocaleString()} from ${student?.name || 'Student'} - ${daysOverdue} days overdue`,
        assignmentId: assignment.id,
        studentId: assignment.studentId,
        actionLabel: 'Send Reminder',
        timestamp: now.toISOString(),
      });
    }

    // Warning: Payment due soon
    if (
      remainingAmount > 0 &&
      hoursUntilDeadline > 0 &&
      hoursUntilDeadline < 72 &&
      assignment.status === AssignmentStatus.IN_PROGRESS
    ) {
      alerts.push({
        id: `payment-due-${assignment.id}`,
        type: 'payment',
        severity: 'warning',
        title: 'Payment Due Soon',
        message: `₹${remainingAmount.toLocaleString()} due in ${Math.round(hoursUntilDeadline / 24)} days from ${student?.name || 'Student'}`,
        assignmentId: assignment.id,
        studentId: assignment.studentId,
        actionLabel: 'Request Payment',
        timestamp: now.toISOString(),
      });
    }
  });

  // Sort by severity (critical first) and timestamp
  return alerts.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    if (a.severity === 'warning' && b.severity === 'info') return -1;
    if (a.severity === 'info' && b.severity === 'warning') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

export const generateActionItems = (
  assignments: Assignment[],
  students: Student[]
): ActionItem[] => {
  const actions: ActionItem[] = [];
  const now = new Date();

  // Payment follow-ups
  const overduePayments = assignments.filter(
    (a) =>
      a.price - a.paidAmount > 0 &&
      a.status === AssignmentStatus.COMPLETED &&
      new Date(a.deadline) < now
  );

  if (overduePayments.length > 0) {
    actions.push({
      id: 'payment-followup',
      type: 'payment',
      priority: 'high',
      title: 'Follow up on overdue payments',
      description: `${overduePayments.length} student${overduePayments.length !== 1 ? 's' : ''} with pending payments`,
      count: overduePayments.length,
    });
  }

  // Unassigned tasks
  const unassigned = assignments.filter(
    (a) =>
      !a.writerId &&
      a.status === AssignmentStatus.PENDING &&
      new Date(a.deadline) > now
  );

  if (unassigned.length > 0) {
    actions.push({
      id: 'assign-tasks',
      type: 'assignment',
      priority: 'high',
      title: 'Assign pending tasks',
      description: `${unassigned.length} task${unassigned.length !== 1 ? 's' : ''} waiting for writer assignment`,
      count: unassigned.length,
    });
  }

  // Tasks to review
  const toReview = assignments.filter((a) => a.status === AssignmentStatus.REVIEW);

  if (toReview.length > 0) {
    actions.push({
      id: 'review-tasks',
      type: 'review',
      priority: 'medium',
      title: 'Review completed assignments',
      description: `${toReview.length} assignment${toReview.length !== 1 ? 's' : ''} waiting for review`,
      count: toReview.length,
    });
  }

  // In-progress tasks due today
  const dueToday = assignments.filter((a) => {
    const deadline = new Date(a.deadline);
    // Use proper date range comparison to avoid timezone issues
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return (
      deadline >= todayStart && deadline < todayEnd &&
      a.status === AssignmentStatus.IN_PROGRESS
    );
  });

  if (dueToday.length > 0) {
    actions.push({
      id: 'due-today',
      type: 'follow-up',
      priority: 'high',
      title: 'Check progress on tasks due today',
      description: `${dueToday.length} task${dueToday.length !== 1 ? 's' : ''} due today`,
      count: dueToday.length,
      dueDate: now.toISOString(),
    });
  }

  return actions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const calculateWriterPerformance = (
  writer: Writer,
  assignments: Assignment[]
): {
  onTimeDeliveryRate: number;
  completionRate: number;
  avgRating: number;
  isReliable: boolean;
  hasRedFlag: boolean;
} => {
  const writerAssignments = assignments.filter((a) => a.writerId === writer.id);
  const completedAssignments = writerAssignments.filter(
    (a) => a.status === AssignmentStatus.COMPLETED
  );

  const onTimeDeliveries = completedAssignments.filter((a) => {
    // Check if completed before deadline
    // We'd need completedAt timestamp, for now use updatedAt as proxy
    return new Date(a.updatedAt || a.createdAt) <= new Date(a.deadline);
  });

  const onTimeDeliveryRate =
    completedAssignments.length > 0
      ? (onTimeDeliveries.length / completedAssignments.length) * 100
      : 0;

  const completionRate =
    writerAssignments.length > 0
      ? (completedAssignments.length / writerAssignments.length) * 100
      : 0;

  const avgRating = writer.rating
    ? (writer.rating.quality + writer.rating.punctuality + writer.rating.reliability) / 3
    : 0;

  const isReliable = onTimeDeliveryRate >= 95 && completionRate >= 90;
  const hasRedFlag = onTimeDeliveryRate < 80;

  return {
    onTimeDeliveryRate,
    completionRate,
    avgRating,
    isReliable,
    hasRedFlag,
  };
};

export const calculateProfitMargin = (assignment: Assignment): {
  margin: number;
  percentage: number;
  status: 'profitable' | 'marginal' | 'unprofitable';
} => {
  const revenue = assignment.price;
  const cost = (assignment.writerPrice || 0) + (assignment.sunkCosts || 0);
  const margin = revenue - cost;
  const percentage = revenue > 0 ? (margin / revenue) * 100 : 0;

  let status: 'profitable' | 'marginal' | 'unprofitable';
  if (percentage > 40) status = 'profitable';
  else if (percentage >= 20) status = 'marginal';
  else status = 'unprofitable';

  return { margin, percentage, status };
};
