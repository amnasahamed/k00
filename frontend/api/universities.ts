import { University } from '../types';
import { apiFetch } from './client';

export const getUniversities = (): Promise<University[]> =>
  apiFetch<University[]>('/api/universities');

export const createUniversity = (name: string): Promise<University> =>
  apiFetch<University>('/api/universities', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const updateUniversity = (id: number, name: string): Promise<University> =>
  apiFetch<University>(`/api/universities/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });

export const deleteUniversity = (id: number): Promise<{ success: boolean }> =>
  apiFetch(`/api/universities/${id}`, { method: 'DELETE' });
