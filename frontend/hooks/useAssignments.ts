import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DataService from '../services/dataService';
import { Assignment } from '../types';
import { queryKeys } from './queryKeys';

export function useAssignments() {
  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: DataService.getAssignments,
  });
}

function invalidateAssignmentRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
}

export function useSaveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: Assignment) => DataService.saveAssignment(assignment),
    onSuccess: () => invalidateAssignmentRelated(queryClient),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DataService.deleteAssignment(id),
    onSuccess: () => invalidateAssignmentRelated(queryClient),
  });
}
