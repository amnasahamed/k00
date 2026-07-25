import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../types';
import { generateAlerts } from '../services/alertService';
import { useToast } from '../providers/ToastProvider';
import { useAssignments } from '../hooks/useAssignments';
import { useStudents } from '../hooks/useStudents';
import { useWriters } from '../hooks/useWriters';
import Button from './ui/Button';

const AlertsView: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: assignments = [], isLoading: loadingAssignments, isError: assignmentsError } = useAssignments();
  const { data: students = [], isLoading: loadingStudents, isError: studentsError } = useStudents();
  const { data: writers = [], isLoading: loadingWriters, isError: writersError } = useWriters();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loading = loadingAssignments || loadingStudents || loadingWriters;

  useEffect(() => {
    if (assignmentsError || studentsError || writersError) {
      addToast('Failed to load data', 'error');
      return;
    }
    if (!loading) {
      setAlerts(generateAlerts(assignments, students, writers));
    }
  }, [assignments, students, writers, loading, assignmentsError, studentsError, writersError, addToast]);

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-danger/10 border-danger/30 text-danger';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'info':
        return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.assignmentId) {
      navigate('/assignments', { state: { highlightId: alert.assignmentId } });
    } else if (alert.studentId) {
      navigate('/students', { state: { selectStudent: alert.studentId } });
    } else if (alert.writerId) {
      navigate('/writers', { state: { selectWriter: alert.writerId } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">Alerts</h2>
          <p className="text-sm text-secondary-500 mt-1">Risk signals across overdue work, payments, and capacity.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-apple-lg border border-dashed border-secondary-200 bg-secondary-50/50 p-10 text-center text-secondary-500">
          No active alerts right now.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => handleAlertClick(alert)}
              className={`w-full text-left p-4 rounded-apple border ${getSeverityStyles(alert.severity)} transition hover:opacity-90`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm opacity-80 mt-1">{alert.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsView;
