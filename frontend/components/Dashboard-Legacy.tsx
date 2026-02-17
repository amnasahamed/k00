import React, { useEffect, useState } from 'react';
import { getDashboardStats, getAssignments, getWriters, getStudents } from '../services/dataService';
import { Assignment, AssignmentStatus, AssignmentPriority, Alert, ActionItem, Student } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import Button from './ui/Button';
import AtRiskSection from './AtRiskSection';
import TodaysActionList from './TodaysActionList';
import { generateAlerts, generateActionItems, calculateProfitMargin, calculateWriterPerformance } from '../services/alertService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
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

    // Calendar Modal State
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDayAssignments, setSelectedDayAssignments] = useState<Assignment[]>([]);

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const getPriorityColor = (priority: AssignmentPriority) => {
        switch (priority) {
            case AssignmentPriority.HIGH: return 'text-red-600 bg-red-100';
            case AssignmentPriority.MEDIUM: return 'text-yellow-600 bg-yellow-100';
            case AssignmentPriority.LOW: return 'text-green-600 bg-green-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#8E8E93'];

    // Navigate with filters (Deep Linking)
    const goToPending = () => navigate('/assignments', { state: { filterStatus: AssignmentStatus.IN_PROGRESS } });
    const goToOverdue = () => navigate('/assignments', { state: { filterSpecial: 'overdue' } });
    const goToIncoming = () => navigate('/payments', { state: { tab: 'incoming' } });
    const goToOutgoing = () => navigate('/payments', { state: { tab: 'outgoing' } });

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDayClick = (assignments: Assignment[], date: Date) => {
        setSelectedDayAssignments(assignments);
        setSelectedDate(date);
        setIsDayModalOpen(true);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 md:h-24 bg-gray-50 border border-gray-100 rounded-apple"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = dateObj.toDateString();
            let daysAssignments = calendarAssignments.filter(a => new Date(a.deadline).toDateString() === dateStr && a.status !== AssignmentStatus.COMPLETED);

            // Apply calendar filter
            if (calendarFilter === 'high') {
                daysAssignments = daysAssignments.filter(a => a.priority === AssignmentPriority.HIGH);
            } else if (calendarFilter === 'overdue') {
                const now = new Date();
                daysAssignments = daysAssignments.filter(a => new Date(a.deadline) < now);
            }

            const isToday = new Date().toDateString() === dateStr;

            days.push(
                <div
                    key={i}
                    onClick={() => handleDayClick(daysAssignments, dateObj)}
                    className={`h-10 md:h-24 p-1 md:p-2 border rounded-apple overflow-hidden flex flex-col gap-1 transition-all duration-200 ease-apple hover:shadow-ios-md cursor-pointer active:scale-[0.98] ${isToday ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                >
                    <span className={`text-[10px] md:text-xs font-semibold ${isToday ? 'text-primary' : 'text-gray-500'}`}>{i}</span>
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {daysAssignments.map(a => (
                            <div
                                key={a.id}
                                onClick={(e) => { e.stopPropagation(); navigate('/assignments', { state: { highlightId: a.id } }); }}
                                className="cursor-pointer hidden md:block text-[9px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-[6px] truncate border-l-2 border-danger font-medium"
                                title={a.title}
                            >
                                {a.title}
                            </div>
                        ))}
                        {daysAssignments.length > 0 && (
                            <div className="md:hidden w-1.5 h-1.5 rounded-full bg-danger mx-auto mt-1"></div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Row with Settings */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h2>
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2.5 bg-white rounded-apple shadow-ios text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 ease-apple active:scale-95"
                    title="Settings"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>

            {/* At-Risk Section (Critical Alerts) */}
            {alerts.length > 0 && <AtRiskSection alerts={alerts} onViewAll={() => navigate('/alerts')} />}

            {/* Today's Action List */}
            <TodaysActionList actions={actionItems} onViewAll={() => navigate('/actions')} />

            {/* Today's Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaysFinancials.earned > 0 && (
                    <div className="mesh-gradient-primary rounded-apple-lg p-6 text-white shadow-ios-lg animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.05s' }}>
                        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-2">Potential Collection Today</p>
                                <p className="text-4xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(todaysFinancials.earned)}</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-apple-lg backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                        </div>
                    </div>
                )}
                {todaysFinancials.collected > 0 && (
                    <div className="mesh-gradient-success rounded-apple-lg p-6 text-white shadow-ios-lg animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-2">Collected Today</p>
                                <p className="text-4xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(todaysFinancials.collected)}</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-apple-lg backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                <Card className="bg-white hover-lift hover:shadow-ios-md transition-all duration-200 ease-apple cursor-pointer group" onClick={goToPending}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Pending Tasks</p>
                            <p className="text-3xl font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">{stats.totalPending}</p>
                        </div>
                        <div className="p-2.5 bg-primary/8 rounded-apple text-primary group-hover:bg-primary/15 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white hover-lift hover:shadow-ios-md transition-all duration-200 ease-apple cursor-pointer group" onClick={goToOverdue}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-danger uppercase tracking-wider mb-1.5">Overdue</p>
                            <p className="text-3xl font-semibold text-danger">{stats.totalOverdue}</p>
                        </div>
                        <div className="p-2.5 bg-danger/8 rounded-apple text-danger group-hover:bg-danger/15 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white hover-lift hover:shadow-ios-md transition-all duration-200 ease-apple cursor-pointer group" onClick={goToIncoming}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-success uppercase tracking-wider mb-1.5">To Collect</p>
                            <p className="text-2xl md:text-3xl font-semibold text-gray-900 group-hover:text-success transition-all">{formatCurrency(stats.pendingAmount)}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">From Students</p>
                        </div>
                        <div className="p-2.5 bg-success/8 rounded-apple text-success group-hover:bg-success/15 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white hover-lift hover:shadow-ios-md transition-all duration-200 ease-apple cursor-pointer group" onClick={goToOutgoing}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-warning uppercase tracking-wider mb-1.5">To Pay</p>
                            <p className="text-2xl md:text-3xl font-semibold text-gray-900 group-hover:text-warning transition-all">{formatCurrency(stats.pendingWriterPay)}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-1">To Writers</p>
                        </div>
                        <div className="p-2.5 bg-warning/8 rounded-apple text-warning group-hover:bg-warning/15 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                    </div>
                </Card>
                <Card className="mesh-gradient-premium text-white hover:shadow-ios-lg transition-all duration-300 ease-apple cursor-pointer relative overflow-hidden group" onClick={() => navigate('/payments')}>
                    <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1.5">Net Profit</p>
                            <p className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(netProfit)}</p>
                            <p className="text-[10px] text-white/60 font-medium mt-1">All Time</p>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-apple backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Calendar Widget */}
                    <div className="bg-white p-6 rounded-apple-lg shadow-ios">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-semibold text-gray-900 text-lg tracking-tight">Deadlines Calendar</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-apple p-1">
                                    <button
                                        onClick={() => setCalendarFilter('all')}
                                        className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'all' ? 'bg-white shadow-ios text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setCalendarFilter('high')}
                                        className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'high' ? 'bg-white shadow-ios text-danger' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        High Priority
                                    </button>
                                    <button
                                        onClick={() => setCalendarFilter('overdue')}
                                        className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'overdue' ? 'bg-white shadow-ios text-warning' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Overdue
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 rounded-apple p-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-[8px] shadow-ios transition-all duration-200 ease-apple active:scale-95 text-gray-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-xs font-semibold w-20 text-center text-gray-900">{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-[8px] shadow-ios transition-all duration-200 ease-apple active:scale-95 text-gray-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 mb-3">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] uppercase font-semibold text-gray-500 tracking-wider">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>

                {/* Sidebar Area (1/3 width) */}
                <div className="space-y-6">
                    {/* Upcoming List with Visual Alarm */}
                    <Card title="Upcoming Priority" className="h-auto">
                        <div className="space-y-0">
                            {upcomingAssignments.length > 0 ? (
                                upcomingAssignments.map((a, idx) => {
                                    const timeDiff = new Date(a.deadline).getTime() - new Date().getTime();
                                    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    const hoursLeft = Math.ceil(timeDiff / (1000 * 3600));
                                    const isOverdue = daysLeft < 0;
                                    const isUrgent = hoursLeft > 0 && hoursLeft < 6;

                                    // Calculate profit margin
                                    const profitInfo = calculateProfitMargin(a);
                                    const marginColors = {
                                        profitable: 'bg-success/10 text-success border-success/20',
                                        marginal: 'bg-warning/10 text-warning border-warning/20',
                                        unprofitable: 'bg-danger/10 text-danger border-danger/20'
                                    };

                                    return (
                                        <div key={a.id} onClick={() => navigate('/assignments', { state: { highlightId: a.id } })} className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-apple transition-all duration-200 ease-apple active:scale-[0.98] ${idx !== upcomingAssignments.length - 1 ? 'border-b border-gray-100' : ''} ${isUrgent ? 'animate-pulse bg-danger/5 border-danger/20 border' : ''}`}>
                                            <div className="min-w-0 pr-4 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate tracking-tight">{a.title}</h4>
                                                    {/* Profit Margin Badge */}
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${marginColors[profitInfo.status]} whitespace-nowrap`} title={`${profitInfo.percentage.toFixed(0)}% margin`}>
                                                        {profitInfo.percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{a.subject}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${getPriorityColor(a.priority)}`}>
                                                    {a.priority}
                                                </span>
                                                <span className={`text-xs font-semibold ${isOverdue ? 'text-danger' : isUrgent ? 'text-danger font-bold' : daysLeft <= 2 ? 'text-warning' : 'text-gray-500'}`}>
                                                    {isOverdue ? 'Overdue' : hoursLeft < 24 ? `${hoursLeft}h` : `${daysLeft}d`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-400 py-12">
                                    <p className="text-sm">No upcoming tasks. Enjoy your day!</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Workload Chart */}
                    <Card title="Workload" className="h-[300px]">
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Writer Workload Section */}
            {writers.length > 0 && (
                <div className="bg-white p-6 rounded-apple-lg shadow-ios">
                    <h3 className="font-semibold text-gray-900 mb-5 text-lg tracking-tight">Writer Workload</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {writers.slice(0, 8).map(writer => {
                            const writerAssignments = calendarAssignments.filter(a =>
                                a.writerId === writer.id &&
                                a.status !== AssignmentStatus.COMPLETED &&
                                a.status !== AssignmentStatus.CANCELLED
                            );
                            const activeCount = writerAssignments.length;
                            const maxTasks = writer.maxConcurrentTasks || 5;
                            const utilizationPercent = Math.min((activeCount / maxTasks) * 100, 100);
                            const status = writer.availabilityStatus || 'available';

                            // Calculate performance metrics
                            const performance = calculateWriterPerformance(writer, calendarAssignments);

                            const statusColors = {
                                available: 'bg-success/10 text-success border-success/20',
                                busy: 'bg-warning/10 text-warning border-warning/20',
                                vacation: 'bg-primary/10 text-primary border-primary/20'
                            };

                            return (
                                <div key={writer.id} className="bg-gray-50 p-4 rounded-apple border border-gray-100 hover:shadow-ios-md hover:border-gray-200 transition-all duration-200 ease-apple cursor-pointer active:scale-[0.98]" onClick={() => navigate('/writers')}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-sm text-gray-900 truncate flex-1 tracking-tight">{writer.name}</h4>
                                        <div className="flex items-center gap-1">
                                            {performance.isReliable && (
                                                <span className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[8px] font-bold border border-success/20" title="95%+ on-time delivery">
                                                    ⭐ RELIABLE
                                                </span>
                                            )}
                                            {performance.hasRedFlag && (
                                                <span className="px-2 py-0.5 bg-danger/10 text-danger rounded-full text-[8px] font-bold border border-danger/20" title="< 80% on-time delivery">
                                                    ⚠ RISK
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-semibold border ${statusColors[status as keyof typeof statusColors]} inline-block mb-2`}>
                                            {status}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-medium">
                                            <span>{activeCount} / {maxTasks} tasks</span>
                                            <span>{Math.round(utilizationPercent)}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ease-apple ${utilizationPercent >= 90 ? 'bg-danger' :
                                                    utilizationPercent >= 70 ? 'bg-warning' :
                                                        'bg-success'
                                                    }`}
                                                style={{ width: `${utilizationPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                        {writer.rating && writer.rating.count > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-500">★</span>
                                                <span className="font-medium">{((writer.rating.quality + writer.rating.punctuality) / 2).toFixed(1)}</span>
                                            </div>
                                        )}
                                        {performance.onTimeDeliveryRate > 0 && (
                                            <span className={`font-medium ${performance.onTimeDeliveryRate >= 95 ? 'text-success' :
                                                performance.onTimeDeliveryRate >= 80 ? 'text-warning' :
                                                    'text-danger'
                                                }`}>
                                                {Math.round(performance.onTimeDeliveryRate)}% on-time
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {writers.length > 8 && (
                        <button onClick={() => navigate('/writers')} className="mt-5 text-sm text-primary hover:text-[#0051D5] font-medium transition-colors duration-200">
                            View all writers →
                        </button>
                    )}
                </div>
            )}

            {/* Floating Action Button for Quick Add */}
            <button
                onClick={() => navigate('/assignments')}
                className="fixed bottom-20 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-full shadow-ios-xl hover:shadow-ios-lg hover:scale-105 active:scale-95 transition-all duration-200 ease-apple flex items-center justify-center group z-30 ring-4 ring-white"
                title="Create New Assignment"
            >
                <svg className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200 ease-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Calendar Day Modal */}
            <Modal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} title={`Tasks for ${selectedDate?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`}>
                <div className="space-y-3">
                    {selectedDayAssignments.length > 0 ? (
                        selectedDayAssignments.map(a => (
                            <div
                                key={a.id}
                                onClick={() => navigate('/assignments', { state: { highlightId: a.id } })}
                                className="p-4 bg-gray-50 rounded-apple border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 ease-apple active:scale-[0.98]"
                            >
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-900 tracking-tight">{a.title}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{a.subject} • {a.type}</p>
                                </div>
                                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${getPriorityColor(a.priority)}`}>
                                    {a.priority}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-apple border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">No deadlines scheduled for this day.</p>
                        </div>
                    )}
                    <div className="pt-3">
                        <Button variant="ghost" className="w-full" onClick={() => setIsDayModalOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;