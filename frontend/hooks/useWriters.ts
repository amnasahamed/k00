import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DataService from '../services/dataService';
import { Writer } from '../types';
import { queryKeys } from './queryKeys';

export function useWriters() {
  return useQuery({
    queryKey: queryKeys.writers,
    queryFn: DataService.getWriters,
  });
}

export function useSaveWriter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (writer: Writer) => DataService.saveWriter(writer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.writers });
    },
  });
}

export function useDeleteWriter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => DataService.deleteWriter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.writers });
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments });
    },
  });
}

export function useRateWriter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      writerId,
      quality,
      punctuality,
    }: {
      writerId: string | number;
      quality: number;
      punctuality: number;
    }) => DataService.rateWriter(writerId, quality, punctuality),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.writers });
    },
  });
}
