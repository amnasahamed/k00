import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Student, Writer, Assignment } from '../types';
import * as DataService from '../services/dataService';
import { generateAlerts } from '../services/alertService';
import { useToast } from './Layout';
import Button from './ui/Button';

const AlertsView: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      const [studentList, writerList, assignmentList] = await Promise.all([
        DataService.getStudents(),
        DataService.getWriters(),
        DataService.getAssignments()
      ]);

      setStudents(studentList);
      setWriters(writerList);
      setAssignments(assignmentList);

      const generatedAlerts = generateAlerts(assignmentList, studentList, writerList);
      setAlerts(generatedAlerts);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch alert data", error);
      addToast("Failed to load data", "error");
      setLoading(false);
    }
  };

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
      navigate('/students', { state: { highlightId: alert.studentId } });
    } else if (alert.writerId) {
      navigate('/writers', { state: { highlightId: alert.writerId } });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">All Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">{alerts.length} alert{alerts.length !== 1 ? 's' : ''} requiring attention</p>
        </div>
        <Button onClick={refreshData} variant="secondary">
          Refresh
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <div className="bg-white rounded-apple-lg shadow-ios overflow-hidden">
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`flex items-start gap-4 p-5 transition-all duration-200 ease-apple cursor-pointer hover:bg-gray-50 active:scale-[0.995] ${getSeverityStyles(alert.severity)}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-sm text-gray-900 tracking-tight">{alert.title}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                    </span>
                    {alert.actionLabel && (
                      <span className="text-xs text-gray-500">{alert.actionLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-apple-lg shadow-ios p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No alerts</h3>
          <p className="text-gray-500 text-sm">Everything looks good! No immediate issues requiring attention.</p>
        </div>
      )}
    </div>
  );
};

export default AlertsView;
