import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssignmentStatus } from '../../types';
import AtRiskSection from '../AtRiskSection';
import TodaysActionList from '../TodaysActionList';
import { generateAlerts, generateActionItems } from '../../services/alertService';
import { formatCurrency } from '../../utils/format';
import { getPriorityColorDashboard } from '../../utils/statusStyles';
import { useAssignments } from '../../hooks/useAssignments';
import { useStudents } from '../../hooks/useStudents';
import { useWriters } from '../../hooks/useWriters';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import TodaysFinancials from './TodaysFinancials';
import MetricsGrid from './MetricsGrid';
import CalendarWidget from './CalendarWidget';
import UpcomingPriority from './UpcomingPriority';
import WorkloadPieChart from './WorkloadPieChart';
import WriterWorkloadGrid from './WriterWorkloadGrid';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: assignments = [] } = useAssignments();
  const { data: students = [] } = useStudents();
  const { data: writers = [] } = useWriters();
  const { data: stats = { totalPending: 0, totalOverdue: 0, pendingAmount: 0, pendingWriterPay: 0, activeDissertations: 0 } } = useDashboardStats();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'high' | 'overdue'>('all');

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const alerts = useMemo(
    () => generateAlerts(assignments, students, writers),
    [assignments, students, writers]
  );

  const actionItems = useMemo(
    () => generateActionItems(assignments, students),
    [assignments, students]
  );

  const todaysFinancials = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const tasksDueToday = assignments.filter((a) => {
      const deadline = new Date(a.deadline);
      return deadline >= todayStart && deadline < todayEnd;
    });
    const earned = tasksDueToday.reduce((sum, a) => sum + (a.price - a.paidAmount), 0);
    const collected = assignments.reduce((sum, a) => {
      if (!Array.isArray(a.paymentHistory)) return sum;
      return (
        sum +
        a.paymentHistory
          .filter((p) => {
            const paymentDate = new Date(p.date);
            return p.type === 'incoming' && paymentDate >= todayStart && paymentDate < todayEnd;
          })
          .reduce((s, p) => s + p.amount, 0)
      );
    }, 0);
    return { earned, paid: 0, collected };
  }, [assignments]);

  const netProfit = useMemo(() => {
    const totalRevenue = assignments.reduce((sum, a) => sum + a.price, 0);
    const totalCost = assignments.reduce((sum, a) => sum + (a.writerPrice || 0) + (a.sunkCosts || 0), 0);
    return totalRevenue - totalCost;
  }, [assignments]);

  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [assignments]);

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    assignments.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    return Object.keys(statusCounts).map((key) => ({ name: key, value: statusCounts[key] }));
  }, [assignments]);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    upcomingAssignments.forEach((a) => {
      const timeDiff = new Date(a.deadline).getTime() - Date.now();
      const hoursDiff = timeDiff / (1000 * 3600);
      if (hoursDiff > 0 && hoursDiff < 24) {
        const key = `notified-24h-${a.id}`;
        const lastNotified = Number(localStorage.getItem(key) || 0);
        if (!lastNotified || Date.now() - lastNotified > SIX_HOURS_MS) {
          new Notification('Deadline Approaching!', {
            body: `${a.title} is due in ${Math.round(hoursDiff)} hours.`,
            icon: '/favicon.ico',
          });
          localStorage.setItem(key, String(Date.now()));
        }
      }
    });
  }, [upcomingAssignments]);

  const goToPending = () => navigate('/assignments', { state: { filterStatus: AssignmentStatus.IN_PROGRESS } });
  const goToOverdue = () => navigate('/assignments', { state: { filterSpecial: 'overdue' } });
  const goToIncoming = () => navigate('/payments', { state: { tab: 'incoming' } });
  const goToOutgoing = () => navigate('/payments', { state: { tab: 'outgoing' } });

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const handleNavigate = (path: string, state?: any) => {
    navigate(path, state);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-secondary-900 tracking-tight uppercase">Overview</h2>
          <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">Business Pulse & Performance</p>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="p-3 bg-white rounded-apple shadow-ios text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50 transition-apple active:scale-95 border border-secondary-100/50"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {alerts.length > 0 && <AtRiskSection alerts={alerts} onViewAll={() => navigate('/alerts')} />}
      <TodaysActionList actions={actionItems} onViewAll={() => navigate('/actions')} />
      <TodaysFinancials earned={todaysFinancials.earned} collected={todaysFinancials.collected} formatCurrency={formatCurrency} />

      <MetricsGrid
        stats={stats}
        netProfit={netProfit}
        formatCurrency={formatCurrency}
        goToPending={goToPending}
        goToOverdue={goToOverdue}
        goToIncoming={goToIncoming}
        goToOutgoing={goToOutgoing}
        goToPayments={() => navigate('/payments')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CalendarWidget
            calendarAssignments={assignments}
            currentDate={currentDate}
            calendarFilter={calendarFilter}
            onFilterChange={setCalendarFilter}
            onChangeMonth={changeMonth}
            onNavigate={handleNavigate}
            getPriorityColor={getPriorityColorDashboard}
          />
        </div>
        <div className="space-y-6">
          <UpcomingPriority
            assignments={upcomingAssignments}
            onNavigate={handleNavigate}
            getPriorityColor={getPriorityColorDashboard}
          />
          <WorkloadPieChart statusData={statusData} />
        </div>
      </div>

      <WriterWorkloadGrid writers={writers} assignments={assignments} onNavigate={handleNavigate} />

      <button
        onClick={() => navigate('/assignments')}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-full shadow-ios-xl hover:shadow-ios-lg hover:scale-105 active:scale-90 transition-apple flex items-center justify-center group z-30 ring-4 ring-white"
        title="Create New Assignment"
      >
        <svg className="w-7 h-7 group-hover:rotate-90 transition-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default DashboardPage;
