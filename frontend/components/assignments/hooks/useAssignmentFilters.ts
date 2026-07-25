import { useMemo, useState } from 'react';
import { Assignment, AssignmentStatus, Student } from '../../../types';

export type AssignmentSortBy = 'deadline' | 'createdAt' | 'title';

export function useAssignmentFilters(assignments: Assignment[], students: Student[]) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<AssignmentSortBy>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        const student = students.find((s) => s.id === a.studentId);
        const term = searchTerm.toLowerCase();
        const searchMatch =
          a.title.toLowerCase().includes(term) ||
          a.subject.toLowerCase().includes(term) ||
          (!!student && student.name.toLowerCase().includes(term));
        const statusMatch = statusFilter === 'all' || a.status === statusFilter;
        const priorityMatch = priorityFilter === 'all' || a.priority === priorityFilter;
        const isOverdue =
          new Date(a.deadline) < new Date() && a.status !== AssignmentStatus.COMPLETED;
        const overdueMatch = !isOverdueFilter || isOverdue;
        const archivedMatch = showArchived ? a.isArchived : !a.isArchived;
        return statusMatch && priorityMatch && searchMatch && overdueMatch && archivedMatch;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'deadline':
            comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'title':
            comparison = a.title.localeCompare(b.title);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [
    assignments,
    students,
    searchTerm,
    statusFilter,
    priorityFilter,
    isOverdueFilter,
    showArchived,
    sortBy,
    sortOrder,
  ]);

  return {
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    searchTerm,
    setSearchTerm,
    isOverdueFilter,
    setIsOverdueFilter,
    showArchived,
    setShowArchived,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAssignments,
  };
}
