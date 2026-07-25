import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DataService from '../services/dataService';
import { Student } from '../types';
import { queryKeys } from './queryKeys';

export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: DataService.getStudents,
  });
}

export function useSaveStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (student: Student) => DataService.saveStudent(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DataService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
    },
  });
}
