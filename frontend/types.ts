
export enum AssignmentStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Under Review',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum AssignmentType {
  ESSAY = 'Essay',
  DISSERTATION = 'Dissertation',
  REPORT = 'Report',
  PRESENTATION = 'Presentation',
  OTHER = 'Other'
}

export enum AssignmentPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface University {
  id: number;
  name: string;
  location?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  university?: string;
  universityId?: number;
  University?: University;
  remarks?: string;
  isFlagged?: boolean; // Bad client / Non-payer
  referredBy?: string; // ID of the student who referred them
}

export interface WriterRating {
  quality: number;
  punctuality: number;
  communication: number;
  reliability: number;
  count: number;
}

export interface WriterPerformanceMetrics {
  avgTurnaroundDays: number;
  revisionRate: number;
  completedTasks: number;
}

export interface Writer {
  id: number | string; // Can be number (from backend) or string (from frontend)
  name: string;
  contact: string;
  specialty?: string;
  isFlagged?: boolean;
  rating?: WriterRating;
  availabilityStatus?: 'available' | 'busy' | 'vacation';
  maxConcurrentTasks?: number;
  performanceMetrics?: WriterPerformanceMetrics;
}

export interface ChapterProgress {
  chapterNumber: number;
  title: string;
  isCompleted: boolean;
  remarks: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface PaymentHistoryEntry {
  date: string;
  amount: number;
  type: 'incoming' | 'outgoing';
  method?: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  timestamp: string;
  from: AssignmentStatus;
  to: AssignmentStatus;
  note?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  size?: number;
}

export interface Assignment {
  id: string;
  studentId: string;
  writerId?: string | number; // Can be string or number depending on source
  title: string;
  type: AssignmentType;
  subject: string;
  level: string; // Undergraduate, Masters, PhD
  deadline: string; // ISO Date string
  status: AssignmentStatus;
  priority: AssignmentPriority;

  // Document
  documentLink?: string;

  // Word Count specifics
  wordCount?: number;
  costPerWord?: number;       // Client Rate
  writerCostPerWord?: number; // Writer Rate

  // Financials - Incoming (Student)
  price: number;
  paidAmount: number;

  // Financials - Outgoing (Writer)
  writerPrice?: number;
  writerPaidAmount?: number;
  sunkCosts?: number; // Money paid to previous writers (abandoned work)

  // Dissertation specific
  isDissertation: boolean;
  totalChapters?: number;
  chapters?: ChapterProgress[];

  createdAt: string;
  updatedAt?: string;
  description?: string;

  // New fields
  activityLog?: ActivityLogEntry[];
  paymentHistory?: PaymentHistoryEntry[];
  statusHistory?: StatusHistoryEntry[];
  attachments?: Attachment[];
  isArchived?: boolean;
}

export interface DashboardStats {
  totalPending: number;
  totalOverdue: number;
  pendingAmount: number;     // From Students
  pendingWriterPay: number;  // To Writers
  activeDissertations: number;
}

// Alert and Action Items
export interface Alert {
  id: string;
  type: 'payment' | 'deadline' | 'unassigned' | 'writer' | 'overdue';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  assignmentId?: string;
  studentId?: string;
  writerId?: string;
  actionLabel?: string;
  timestamp: string;
}

export interface ActionItem {
  id: string;
  type: 'payment' | 'assignment' | 'review' | 'follow-up';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  relatedId?: string;
  dueDate?: string;
  count?: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  revenue: number;
  previousWeekRevenue: number;
  profit: number;
  profitMargin: number;
  completedTasks: number;
  topWriter: {
    name: string;
    tasksCompleted: number;
  };
  avgStudentSatisfaction: number;
}

// --- Writer Dashboard Types ---

export interface WriterPerformanceProfile {
  id: number;
  name: string;
  phone: string;
  level: string;
  points: number;
  rating: number;
  streak: number;
}

export interface Achievement {
  id: number;
  achievementType: 'SpeedDemon' | 'Perfectionist' | 'StreakMaster' | 'QualityChampion';
  description: string;
  awardedAt: string;
}

export interface DashboardPerformance {
  completionRate: number;
  averageRating: number;
  onTimeRate: number;
  totalEarnings: number;
  totalPaid: number;
  pendingPayment: number;
}

export interface WriterDashboardData {
  writer: WriterPerformanceProfile;
  performance: DashboardPerformance;
  assignments: Assignment[];
  achievements: Achievement[];
  availableAssignments: Assignment[];
  stats: {
    total: number;
    active: number;
    completed: number;
  };
}
