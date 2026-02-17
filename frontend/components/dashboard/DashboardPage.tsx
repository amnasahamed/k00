import React, { useEffect, useState } from 'react';
import { getDashboardStats, getAssignments, getWriters, getStudents } from '../../services/dataService';
import { Assignment, AssignmentStatus, AssignmentPriority, Alert, ActionItem, Student } from '../../types';
import AtRiskSection from '../AtRiskSection';
import TodaysActionList from '../TodaysActionList';
import { generateAlerts, generateActionItems, calculateProfitMargin, calculateWriterPerformance } from '../../services/alertService';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';
import { getPriorityColorDashboard } from '../../utils/statusStyles';
import TodaysFinancials from './TodaysFinancials';
import MetricsGrid from './MetricsGrid';
import CalendarWidget from './CalendarWidget';
import UpcomingPriority from './UpcomingPriority';
import WorkloadPieChart from './WorkloadPieChart';
import WriterWorkloadGrid from './WriterWorkloadGrid';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalPending: 0, totalOverdue: 0, pendingAmount: 0, pendingWriterPay: 0, activeDissertations: 0 });
    const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [calendarAssignments, setCalendarAssignments] = useState<Assignment[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [writers, setWriters] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    // Alerts and Actions
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);

    // Today's Financials
    const [todaysFinancials, setTodaysFinancials] = useState({ earned: 0, paid: 0, collected: 0 });

    // Business metrics
    const [netProfit, setNetProfit] = useState(0);

    // Calendar filter
    const [calendarFilter, setCalendarFilter] = useState<'all' | 'high' | 'overdue'>('all');

    useEffect(() => {
        // Request notification permission on mount
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        const refresh = async () => {
            try {
                const allAssignments = await getAssignments();
                const stats = await getDashboardStats();
                setStats(stats);
                setCalendarAssignments(allAssignments);

                // Fetch writers and students for alerts
                const writersList = await getWriters();
                setWriters(writersList);

                const studentsList = await getStudents();
                setStudents(studentsList);

                // Generate alerts and action items
                const generatedAlerts = generateAlerts(allAssignments, studentsList, writersList);
                setAlerts(generatedAlerts);

                const generatedActions = generateActionItems(allAssignments, studentsList);
                setActionItems(generatedActions);

                // Calculate Today's Financials with actual collected
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                const tasksDueToday = allAssignments.filter(a => {
                    const deadline = new Date(a.deadline);
                    return deadline >= todayStart && deadline < todayEnd;
                });
                const revenuePotential = tasksDueToday.reduce((sum, a) => sum + (a.price - a.paidAmount), 0);

                // Calculate actual collected today from payment history
                const collectedToday = allAssignments.reduce((sum, a) => {
                    if (a.paymentHistory && Array.isArray(a.paymentHistory)) {
                        return sum + a.paymentHistory
                            .filter(p => {
                                const paymentDate = new Date(p.date);
                                return p.type === 'incoming' && paymentDate >= todayStart && paymentDate < todayEnd;
                            })
                            .reduce((s, p) => s + p.amount, 0);
                    }
                    return sum;
                }, 0);

                setTodaysFinancials({ earned: revenuePotential, paid: 0, collected: collectedToday });

                // Calculate Net Profit
                const totalRevenue = allAssignments.reduce((sum, a) => sum + a.price, 0);
                const totalCost = allAssignments.reduce((sum, a) => sum + (a.writerPrice || 0) + (a.sunkCosts || 0), 0);
                setNetProfit(totalRevenue - totalCost);

                // Get Upcoming Deadlines
                const active = allAssignments.filter(a =>
                    a.status !== AssignmentStatus.COMPLETED &&
                    a.status !== AssignmentStatus.CANCELLED
                );
                setUpcomingAssignments(active.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5));

                // Status Distribution
                const statusCounts: Record<string, number> = {};
                allAssignments.forEach(a => {
                    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
                });
                setStatusData(Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] })));

                // Browser Notification Logic
                if ('Notification' in window && Notification.permission === 'granted') {
                    active.forEach(a => {
                        const timeDiff = new Date(a.deadline).getTime() - new Date().getTime();
                        const hoursDiff = timeDiff / (1000 * 3600);
                        if (hoursDiff > 0 && hoursDiff < 24 && !sessionStorage.getItem(`notified-${a.id}`)) {
                            new Notification("Deadline Approaching!", {
                                body: `${a.title} is due in ${Math.round(hoursDiff)} hours.`,
                                icon: '/favicon.ico'
                            });
                            sessionStorage.setItem(`notified-${a.id}`, 'true');
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        refresh();
        const interval = setInterval(refresh, 60000); // Refresh every minute for countdowns
        return () => clearInterval(interval);
    }, []);

    // Navigate with filters (Deep Linking)
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
            {/* Header Row with Settings */}
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </div>

            {/* At-Risk Section (Critical Alerts) */}
            {alerts.length > 0 && <AtRiskSection alerts={alerts} onViewAll={() => navigate('/alerts')} />}

            {/* Today's Action List */}
            <TodaysActionList actions={actionItems} onViewAll={() => navigate('/actions')} />

            {/* Today's Pulse */}
            <TodaysFinancials earned={todaysFinancials.earned} collected={todaysFinancials.collected} formatCurrency={formatCurrency} />

            {/* Key Metrics */}
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
                {/* Main Content Area (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Calendar Widget */}
                    <CalendarWidget
                        calendarAssignments={calendarAssignments}
                        currentDate={currentDate}
                        calendarFilter={calendarFilter}
                        onFilterChange={setCalendarFilter}
                        onChangeMonth={changeMonth}
                        onNavigate={handleNavigate}
                        getPriorityColor={getPriorityColorDashboard}
                    />
                </div>

                {/* Sidebar Area (1/3 width) */}
                <div className="space-y-6">
                    {/* Upcoming List with Visual Alarm */}
                    <UpcomingPriority
                        assignments={upcomingAssignments}
                        onNavigate={handleNavigate}
                        getPriorityColor={getPriorityColorDashboard}
                    />

                    {/* Workload Chart */}
                    <WorkloadPieChart statusData={statusData} />
                </div>
            </div>

            {/* Writer Workload Section */}
            <WriterWorkloadGrid
                writers={writers}
                assignments={calendarAssignments}
                onNavigate={handleNavigate}
            />

            {/* Floating Action Button for Quick Add */}
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
