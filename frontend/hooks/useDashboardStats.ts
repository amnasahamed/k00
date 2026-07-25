import { useQuery } from '@tanstack/react-query';
import * as DataService from '../services/dataService';
import { queryKeys } from './queryKeys';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: DataService.getDashboardStats,
    refetchInterval: 60_000,
  });
}
