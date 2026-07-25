export const queryKeys = {
  students: ['students'] as const,
  writers: ['writers'] as const,
  assignments: ['assignments'] as const,
  universities: ['universities'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  writerDashboard: (id: string | number) => ['writer-dashboard', id] as const,
  leaderboard: ['leaderboard'] as const,
};
