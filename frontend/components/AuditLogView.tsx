import React, { useState, useEffect } from 'react';
import { getAssignments } from '../services/dataService';
import { Assignment, ActivityLogEntry, PaymentHistoryEntry, StatusHistoryEntry } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

interface AuditLogItem {
  id: string;
  timestamp: string;
  type: 'activity' | 'payment' | 'status';
  assignmentTitle: string;
  studentName: string;
  details: string;
  user?: string;
  amount?: number;
  statusFrom?: string;
  statusTo?: string;
}

const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'activity' | 'payment' | 'status'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.type === filter));
    }
  }, [filter, logs]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const assignments = await getAssignments();
      
      const auditLogs: AuditLogItem[] = [];
      
      assignments.forEach(assignment => {
        // Process activity logs
        if (assignment.activityLog && Array.isArray(assignment.activityLog)) {
          assignment.activityLog.forEach((log: ActivityLogEntry) => {
            auditLogs.push({
              id: `${assignment.id}-activity-${log.timestamp}`,
              timestamp: log.timestamp,
              type: 'activity',
              assignmentTitle: assignment.title,
              studentName: assignment.studentId, // We'll need to get the actual student name
              details: `${log.action}: ${log.details}`,
              user: log.user
            });
          });
        }
        
        // Process payment history
        if (assignment.paymentHistory && Array.isArray(assignment.paymentHistory)) {
          assignment.paymentHistory.forEach((payment: PaymentHistoryEntry) => {
            auditLogs.push({
              id: `${assignment.id}-payment-${payment.date}`,
              timestamp: payment.date,
              type: 'payment',
              assignmentTitle: assignment.title,
              studentName: assignment.studentId,
              details: payment.notes || `${payment.type} payment`,
              amount: payment.amount
            });
          });
        }
        
        // Process status history
        if (assignment.statusHistory && Array.isArray(assignment.statusHistory)) {
          assignment.statusHistory.forEach((status: StatusHistoryEntry) => {
            auditLogs.push({
              id: `${assignment.id}-status-${status.timestamp}`,
              timestamp: status.timestamp,
              type: 'status',
              assignmentTitle: assignment.title,
              studentName: assignment.studentId,
              details: status.note || 'Status updated',
              statusFrom: status.from,
              statusTo: status.to
            });
          });
        }
      });
      
      // Sort by timestamp (newest first)
      auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(auditLogs);
      setFilteredLogs(auditLogs);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'activity':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Activity</span>;
      case 'payment':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Payment</span>;
      case 'status':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Status</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="ml-3 text-lg font-medium text-red-800">Error Loading Audit Logs</h3>
        </div>
        <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <Button onClick={fetchAuditLogs}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
          <p className="text-slate-500 mt-1">Comprehensive audit trail of all activities, payments, and status changes</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === 'all' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Logs
          </Button>
          <Button 
            variant={filter === 'activity' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setFilter('activity')}
          >
            Activities
          </Button>
          <Button 
            variant={filter === 'payment' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setFilter('payment')}
          >
            Payments
          </Button>
          <Button 
            variant={filter === 'status' ? 'primary' : 'secondary'} 
            size="sm"
            onClick={() => setFilter('status')}
          >
            Status Changes
          </Button>
        </div>
      </div>

      <Card>
        {filteredLogs.length > 0 ? (
          <div className="overflow-hidden">
            <ul className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <li key={log.id} className="py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {getTypeBadge(log.type)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-900">{log.assignmentTitle}</h3>
                        <p className="text-xs text-slate-500">{formatDate(log.timestamp)}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{log.details}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {log.user && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            User: {log.user}
                          </span>
                        )}
                        {log.amount && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Amount: ₹{log.amount.toFixed(2)}
                          </span>
                        )}
                        {log.statusFrom && log.statusTo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {log.statusFrom} → {log.statusTo}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Student: {log.studentName}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === 'all' 
                ? 'No audit logs have been recorded yet.' 
                : `No ${filter} logs have been recorded yet.`}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogView;