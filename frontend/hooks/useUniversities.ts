import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as UniversitiesApi from '../api/universities';
import { queryKeys } from './queryKeys';

export function useUniversities() {
  return useQuery({
    queryKey: queryKeys.universities,
    queryFn: UniversitiesApi.getUniversities,
  });
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => UniversitiesApi.createUniversity(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universities });
    },
  });
}

export function useUpdateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      UniversitiesApi.updateUniversity(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universities });
    },
  });
}

export function useDeleteUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => UniversitiesApi.deleteUniversity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.universities });
    },
  });
}
