import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Assignment, Student, Writer } from '../../types';
import * as DataService from '../../services/dataService';
import { useToast } from '../Layout';
import { formatCurrency } from '../../utils/format';
import PaymentTabs from './PaymentTabs';
import PaymentStatsStrip from './PaymentStatsStrip';
import PaymentList from './PaymentList';
import PaymentModal from './PaymentModal';
import FinanceReports from './FinanceReports';

type PaymentType = 'incoming' | 'outgoing' | 'finance';

const PaymentsPage: React.FC = () => {
    const { addToast } = useToast();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<PaymentType>('incoming');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [writers, setWriters] = useState<Writer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Date range filter
    const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [isEditMode, setIsEditMode] = useState(false);

    // Chart Data State
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [subjectData, setSubjectData] = useState<any[]>([]);
    const [seasonalityData, setSeasonalityData] = useState<any[]>([]);
    const [topStudentsData, setTopStudentsData] = useState<any[]>([]);
    const [writerMatrixData, setWriterMatrixData] = useState<any[]>([]);
    const [referralData, setReferralData] = useState<any[]>([]);
    const [referralScatterData, setReferralScatterData] = useState<any[]>([]);

    useEffect(() => {
        refreshData();

        // Handle Deep Linking
        if (location.state) {
            const state = location.state as any;
            if (state.tab) setActiveTab(state.tab);
        }
    }, [location.state]);

    const refreshData = async () => {
        try {
            const data = await DataService.getAssignments();
            const studentList = await DataService.getStudents();
            const writerList = await DataService.getWriters();

            setAssignments(data);
            setStudents(studentList);
            setWriters(writerList);
            calculateFinanceData(data, studentList, writerList);
        } catch (error) {
            console.error("Failed to fetch payment data", error);
            addToast("Failed to load data", "error");
        }
    };

    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#5856D6', '#FF3B30'];

    const calculateFinanceData = React.useCallback((data: Assignment[], studentList: Student[], writerList: Writer[]) => {
        // Apply date filter
        let filteredData = data;
        if (dateRangeFilter !== 'all') {
            const now = new Date();

            filteredData = data.filter(a => {
                const createdAt = new Date(a.createdAt);

                switch (dateRangeFilter) {
                    case 'today':
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                        return createdAt >= todayStart && createdAt < todayEnd;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return createdAt >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        return createdAt >= monthAgo;
                    case 'year':
                        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        return createdAt >= yearAgo;
                    default:
                        return true;
                }
            });
        }
        // 1. Monthly Data (Chronological)
        const months: Record<string, { name: string, revenue: number, cost: number, profit: number, date: number }> = {};
        const seasonal: Record<number, number> = {};

        filteredData.forEach(a => {
            const date = new Date(a.createdAt || new Date().toISOString());
            const key = `${date.getMonth()}-${date.getFullYear()}`;
            const name = date.toLocaleString('default', { month: 'short', year: '2-digit' });

            if (!months[key]) {
                months[key] = { name, revenue: 0, cost: 0, profit: 0, date: date.getTime() };
            }

            const rev = a.price || 0;
            const cost = (a.writerPrice || 0) + (a.sunkCosts || 0);

            months[key].revenue += rev;
            months[key].cost += cost;
            months[key].profit += (rev - cost);

            const monthIndex = date.getMonth();
            seasonal[monthIndex] = (seasonal[monthIndex] || 0) + 1;
        });

        setMonthlyData(Object.values(months).sort((a, b) => a.date - b.date).slice(-6));

        // 2. Subject Profit Data (Radar)
        const subjects: Record<string, number> = {};
        let maxSubjectVal = 0;
        data.forEach(a => {
            const cost = (a.writerPrice || 0) + (a.sunkCosts || 0);
            const profit = (a.price || 0) - cost;
            if (profit > 0) subjects[a.subject] = (subjects[a.subject] || 0) + profit;
        });

        const subjectArr = Object.keys(subjects)
            .map(key => {
                if (subjects[key] > maxSubjectVal) maxSubjectVal = subjects[key];
                return { subject: key, A: subjects[key], fullMark: maxSubjectVal };
            })
            .sort((a, b) => b.A - a.A)
            .slice(0, 6); // Top 6 for Radar

        // Normalize fullMark
        const finalSubjectData = subjectArr.map(s => ({ ...s, fullMark: maxSubjectVal }));
        setSubjectData(finalSubjectData);

        // 3. Seasonality
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        setSeasonalityData(monthNames.map((name, index) => ({ name, jobs: seasonal[index] || 0 })));

        // 4. Top Students (Radial Bar)
        const studentSpend: Record<string, number> = {};
        data.forEach(a => {
            studentSpend[a.studentId] = (studentSpend[a.studentId] || 0) + a.price;
        });

        const topS = Object.keys(studentSpend).map((sid, index) => {
            const s = studentList.find(st => st.id === sid);
            return {
                name: s?.name || 'Unknown',
                value: studentSpend[sid],
                fill: COLORS[index % COLORS.length] // Assign color for RadialBar
            };
        }).sort((a, b) => b.value - a.value).slice(0, 5);
        setTopStudentsData(topS);

        // 5. Writer Matrix (Cost vs Quality vs Volume)
        const matrix = writerList.map(w => {
            const wAssignments = data.filter(a => a.writerId === w.id);
            const volume = wAssignments.length;
            if (volume === 0) return null;

            const avgCost = wAssignments.reduce((acc, curr) => acc + (curr.writerCostPerWord || 0), 0) / volume;
            const rating = w.rating?.quality || 0;

            return {
                name: w.name,
                x: Number(avgCost.toFixed(2)),
                y: rating,
                z: volume
            };
        }).filter(Boolean);
        setWriterMatrixData(matrix);

        // 6. Referral Network (Scatter)
        const referralMap: Record<string, { name: string, count: number, value: number }> = {};
        studentList.forEach(s => { referralMap[s.id] = { name: s.name, count: 0, value: 0 }; });

        data.forEach(a => {
            const student = studentList.find(s => s.id === a.studentId);
            if (student && student.referredBy && referralMap[student.referredBy]) {
                referralMap[student.referredBy].value += a.price;
            }
        });
        studentList.forEach(s => {
            if (s.referredBy && referralMap[s.referredBy]) {
                referralMap[s.referredBy].count += 1;
            }
        });

        const referrals = Object.values(referralMap)
            .filter(r => r.count > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
        setReferralData(referrals);

        // Scatter Data Preparation
        // X: Count, Y: Value, Z: Avg Value
        const refScatter = Object.values(referralMap)
            .filter(r => r.count > 0)
            .map(r => ({
                name: r.name,
                x: r.count,
                y: r.value,
                z: Math.round(r.value / r.count) // Avg Value per referral
            }));
        setReferralScatterData(refScatter);
    }, [dateRangeFilter]);

    const openPaymentModal = (assignment: Assignment, editMode: boolean = false) => {
        setSelectedAssignment(assignment);
        setIsEditMode(editMode);

        if (editMode) {
            if (activeTab === 'incoming') {
                setPaymentAmount(assignment.paidAmount);
            } else {
                setPaymentAmount(assignment.writerPaidAmount || 0);
            }
        } else {
            if (activeTab === 'incoming') {
                const remaining = assignment.price - assignment.paidAmount;
                setPaymentAmount(remaining > 0 ? remaining : 0);
            } else {
                const remaining = (assignment.writerPrice || 0) - (assignment.writerPaidAmount || 0);
                setPaymentAmount(remaining > 0 ? remaining : 0);
            }
        }

        setIsModalOpen(true);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;

        const amount = Number(paymentAmount);

        // Validate that student name exists for outgoing payments
        if (activeTab === 'outgoing') {
            const student = students.find(s => s.id === selectedAssignment.studentId);
            if (!student || !student.name) {
                addToast('Student name is required for outgoing payments', 'error');
                return;
            }
        }

        // Validate payment amount is not negative
        if (amount < 0) {
            addToast('Payment amount cannot be negative', 'error');
            return;
        }

        // Validate payment amount doesn't exceed total amount in edit mode
        if (isEditMode) {
            if (activeTab === 'incoming' && amount > selectedAssignment.price) {
                addToast('Payment amount cannot exceed total amount', 'error');
                return;
            } else if (activeTab === 'outgoing' && amount > (selectedAssignment.writerPrice || 0)) {
                addToast('Payment amount cannot exceed total writer payment', 'error');
                return;
            }
        }

        let updatedAssignment: Assignment;

        if (activeTab === 'incoming') {
            updatedAssignment = {
                ...selectedAssignment,
                paidAmount: isEditMode ? amount : selectedAssignment.paidAmount + amount
            };
        } else {
            updatedAssignment = {
                ...selectedAssignment,
                writerPaidAmount: isEditMode ? amount : (selectedAssignment.writerPaidAmount || 0) + amount
            };
        }

        try {
            await DataService.saveAssignment(updatedAssignment);
            setIsModalOpen(false);
            setSelectedAssignment(null);
            await refreshData();
            addToast('Transaction recorded successfully', 'success');
        } catch (error) {
            console.error("Failed to record transaction", error);
            addToast('Failed to record transaction', 'error');
        }
    };

    const totalRevenue = assignments.reduce((sum, a) => sum + a.price, 0);
    const totalCost = assignments.reduce((sum, a) => sum + (a.writerPrice || 0) + (a.sunkCosts || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const totalSunk = assignments.reduce((sum, a) => sum + (a.sunkCosts || 0), 0);

    const totalStudentDue = assignments.reduce((sum, a) => sum + (a.price - a.paidAmount), 0);
    const totalWriterDue = assignments.reduce((sum, a) => sum + ((a.writerPrice || 0) - (a.writerPaidAmount || 0)), 0);

    const filteredAssignments = React.useMemo(() => {
        return (activeTab === 'incoming'
            ? assignments.filter(a => a.price > 0)
            : assignments.filter(a => (a.writerPrice || 0) > 0)
        ).filter(a => {
            const student = students.find(s => s.id === a.studentId);
            const writer = writers.find(w => w.id === a.writerId);
            const entityName = activeTab === 'incoming' ? student?.name : writer?.name;

            return a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entityName && entityName.toLowerCase().includes(searchTerm.toLowerCase()));
        });
    }, [assignments, students, writers, activeTab, searchTerm]);

    const stats = React.useMemo(() => {
        if (activeTab === 'incoming') {
            const total = filteredAssignments.reduce((sum, a) => sum + a.price, 0);
            const paid = filteredAssignments.reduce((sum, a) => sum + a.paidAmount, 0);
            return { total, paid, pending: total - paid, labelTotal: 'Total Receivable', labelPaid: 'Received', labelPending: 'Pending' };
        } else if (activeTab === 'outgoing') {
            const total = filteredAssignments.reduce((sum, a) => sum + (a.writerPrice || 0), 0);
            const paid = filteredAssignments.reduce((sum, a) => sum + (a.writerPaidAmount || 0), 0);
            return { total, paid, pending: total - paid, labelTotal: 'Total Payable', labelPaid: 'Paid', labelPending: 'To Pay' };
        }
        return { total: 0, paid: 0, pending: 0, labelTotal: '', labelPaid: '', labelPending: '' };
    }, [filteredAssignments, activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                {/* iOS Style Segmented Control */}
                <PaymentTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {activeTab === 'finance' ? (
                <FinanceReports
                    monthlyData={monthlyData}
                    subjectData={subjectData}
                    seasonalityData={seasonalityData}
                    topStudentsData={topStudentsData}
                    writerMatrixData={writerMatrixData}
                    referralScatterData={referralScatterData}
                    dateRangeFilter={dateRangeFilter}
                    onDateRangeChange={setDateRangeFilter}
                    formatCurrency={formatCurrency}
                    totalProfit={totalProfit}
                    profitMargin={profitMargin}
                    totalStudentDue={totalStudentDue}
                    totalSunk={totalSunk}
                />
            ) : (
                <>
                    <PaymentStatsStrip stats={stats} />
                    <PaymentList
                        filteredAssignments={filteredAssignments}
                        students={students}
                        writers={writers}
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onPay={(assignment) => openPaymentModal(assignment, false)}
                        onEdit={(assignment) => openPaymentModal(assignment, true)}
                    />
                </>
            )}

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={selectedAssignment}
                activeTab={activeTab}
                students={students}
                writers={writers}
                isEditMode={isEditMode}
                paymentAmount={paymentAmount}
                onAmountChange={setPaymentAmount}
                onSubmit={handlePayment}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default PaymentsPage;
