import React from 'react';
import { Alert } from '../types';
import { useNavigate } from 'react-router-dom';

interface AtRiskSectionProps {
  alerts: Alert[];
  onViewAll?: () => void;
}

const AtRiskSection: React.FC<AtRiskSectionProps> = ({ alerts, onViewAll }) => {
  const navigate = useNavigate();

  // Show only first 2 alerts unless expanded
  const visibleAlerts = alerts.slice(0, 2);

  if (alerts.length === 0) {
    return null;
  }

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

  return (
    <div className="bg-white rounded-apple-lg shadow-ios p-6 border-l-4 border-danger animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-danger/10 rounded-apple">
            <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 tracking-tight">At-Risk Items</h3>
            <p className="text-xs text-gray-500 mt-0.5">Requires immediate attention</p>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-danger/10 text-danger rounded-full text-xs font-semibold">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => handleAlertClick(alert)}
            className={`flex items-start gap-3 p-4 rounded-apple border transition-all duration-200 ease-apple cursor-pointer hover:shadow-ios-md active:scale-[0.98] ${getSeverityStyles(alert.severity)}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm tracking-tight">{alert.title}</h4>
              <p className="text-xs mt-1 opacity-80">{alert.message}</p>
            </div>
            {alert.actionLabel && (
              <button className="flex-shrink-0 px-3 py-1.5 bg-white/50 hover:bg-white/80 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple active:scale-95">
                {alert.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {(alerts.length > 2 || onViewAll) && (
        <button 
          onClick={onViewAll || (() => navigate('/'))}
          className="mt-4 w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center gap-1"
        >
          {alerts.length > 2 ? `View all ${alerts.length} alerts` : 'View all'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AtRiskSection;
