import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionItem } from '../types';
import { useAssignments } from '../hooks/useAssignments';
import { useStudents } from '../hooks/useStudents';
import { generateActionItems } from '../services/alertService';
import { useToast } from '../providers/ToastProvider';
import TodaysActionList from './TodaysActionList';
import Button from './ui/Button';

const ActionsView: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: assignments = [], isLoading: loadingAssignments, isError: assignmentsError } = useAssignments();
  const { data: students = [], isLoading: loadingStudents, isError: studentsError } = useStudents();
  const [actions, setActions] = useState<ActionItem[]>([]);

  const loading = loadingAssignments || loadingStudents;

  useEffect(() => {
    if (assignmentsError || studentsError) {
      addToast('Failed to load actions', 'error');
      return;
    }
    if (!loading) {
      setActions(generateActionItems(assignments, students));
    }
  }, [assignments, students, loading, assignmentsError, studentsError, addToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Today&apos;s Actions</h2>
          <p className="text-sm text-secondary-500 mt-1">Prioritized follow-ups across tasks, payments, and writers.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <TodaysActionList actions={actions} />
      )}
    </div>
  );
};

export default ActionsView;
