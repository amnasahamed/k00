import React, { useState, useEffect } from 'react';
import { Student, Assignment } from '../types';
import * as DataService from '../services/dataService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import Modal from './ui/Modal';
import { useToast } from './Layout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentsView: React.FC = () => {
    const { addToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // Mobile Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});
    const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

    // Desktop Split View State
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'pending' | 'vip'>('name');
    const [filterType, setFilterType] = useState<'all' | 'vip' | 'flagged' | 'referrer'>('all');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            const s = await DataService.getStudents();
            setStudents(s);
            const a = await DataService.getAssignments();
            setAssignments(a);
        } catch (error) {
            console.error("Failed to fetch data", error);
            addToast('Failed to load data', 'error');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent.name) return;
        try {
            const saved = await DataService.saveStudent(editingStudent as Student);
            setIsModalOpen(false);
            setEditingStudent({});
            await refreshData();
            setSelectedStudentId(saved.id); // Auto-select on save
            addToast('Student saved', 'success');
        } catch (error) {
            console.error("Failed to save student", error);
            addToast('Failed to save student', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this student?')) {
            try {
                await DataService.deleteStudent(id);
                await refreshData();
                if (selectedStudentId === id) setSelectedStudentId(null);
                addToast('Student deleted', 'success');
            } catch (error) {
                console.error("Failed to delete student", error);
                addToast('Failed to delete student', 'error');
            }
        }
    };

    const getStudentAssignments = (studentId: string) => assignments.filter(a => a.studentId === studentId);

    const filteredStudents = students
        .filter(s => {
            // Text search
            const textMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase());

            if (!textMatch) return false;

            // Filter by type
            if (filterType === 'vip') {
                const totalProjected = getStudentAssignments(s.id).reduce((sum, a) => sum + a.price, 0);
                return totalProjected > 20000;
            }
            if (filterType === 'flagged') return s.isFlagged;
            if (filterType === 'referrer') {
                return students.some(st => st.referredBy === s.id);
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'revenue') {
                const revA = getStudentAssignments(a.id).reduce((sum, asg) => sum + asg.price, 0);
                const revB = getStudentAssignments(b.id).reduce((sum, asg) => sum + asg.price, 0);
                return revB - revA;
            }
            if (sortBy === 'pending') {
                const pendingA = getStudentAssignments(a.id).reduce((sum, asg) => sum + (asg.price - asg.paidAmount), 0);
                const pendingB = getStudentAssignments(b.id).reduce((sum, asg) => sum + (asg.price - asg.paidAmount), 0);
                return pendingB - pendingA;
            }
            if (sortBy === 'vip') {
                const revA = getStudentAssignments(a.id).reduce((sum, asg) => sum + asg.price, 0);
                const revB = getStudentAssignments(b.id).reduce((sum, asg) => sum + asg.price, 0);
                return (revB > 20000 ? 1 : 0) - (revA > 20000 ? 1 : 0);
            }
            return 0;
        });

    const StudentDetails: React.FC<{ student: Student }> = ({ student }) => {
        const studentAssignments = getStudentAssignments(student.id);
        const totalProjected = studentAssignments.reduce((acc, curr) => acc + curr.price, 0);
        const totalPaid = studentAssignments.reduce((acc, curr) => acc + curr.paidAmount, 0);
        const totalDue = totalProjected - totalPaid;

        // VIP Calculation
        const isVIP = totalProjected > 20000;

        // Referral Logic
        const referrer = students.find(s => s.id === student.referredBy);
        const referralsMade = students.filter(s => s.referredBy === student.id);

        // Calculate Network Revenue
        const networkRevenue = referralsMade.reduce((sum, s) => {
            const sAssignments = getStudentAssignments(s.id);
            return sum + sAssignments.reduce((aSum, a) => aSum + a.price, 0);
        }, 0);

        // Payment Timeline Data
        const paymentTimeline = studentAssignments
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map(a => ({
                date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                revenue: a.price,
                paid: a.paidAmount,
                pending: a.price - a.paidAmount
            }));

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-secondary-900">{student.name}</h2>
                            {isVIP && <Badge variant="warning">VIP</Badge>}
                            {student.isFlagged && <Badge variant="danger">FLAGGED</Badge>}
                        </div>
                        <p className="text-secondary-500">{student.university || 'No University'}</p>
                        {referrer && (
                            <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Referred by {referrer.name}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <a href={`tel:${student.phone}`} className="p-2 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </a>
                        <button
                            onClick={() => {
                                setHistoryStudent(null);
                                setEditingStudent(student);
                                setIsModalOpen(true);
                            }}
                            className="p-2 bg-secondary-100 text-secondary-600 rounded-full hover:bg-secondary-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <Card className="text-center border-secondary-200 bg-secondary-50" noPadding>
                        <div className="p-4">
                            <p className="text-[10px] text-secondary-400 uppercase font-bold tracking-wider">Total</p>
                            <p className="text-xl font-bold text-secondary-800">{formatCurrency(totalProjected)}</p>
                        </div>
                    </Card>
                    <Card className="text-center border-emerald-100 bg-emerald-50" noPadding>
                        <div className="p-4">
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Paid</p>
                            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
                        </div>
                    </Card>
                    <Card className="text-center border-red-100 bg-red-50" noPadding>
                        <div className="p-4">
                            <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider">Due</p>
                            <p className="text-xl font-bold text-red-700">{formatCurrency(totalDue)}</p>
                        </div>
                    </Card>
                </div>

                {/* Payment Timeline Graph */}
                {paymentTimeline.length > 0 && (
                    <Card className="bg-gradient-to-br from-primary-50 to-indigo-50 border-primary-100" noPadding>
                        <div className="p-4">
                            <h4 className="text-sm font-bold text-primary-900 mb-3">Payment History Timeline</h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                    <AreaChart data={paymentTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="paid" name="Paid" stroke="#10b981" fillOpacity={1} fill="url(#colorPaid)" />
                                        <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPending)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>
                )}

                {student.isFlagged && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <p className="text-sm font-bold text-red-700">Flagged Client</p>
                            <p className="text-xs text-red-600">This student has been marked for non-payment or other issues. Proceed with caution.</p>
                        </div>
                    </div>
                )}

                {/* Referral Network */}
                {referralsMade.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="info">{referralsMade.length}</Badge>
                                <h4 className="text-sm font-bold text-indigo-900">Referrals Made</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-indigo-400 font-bold uppercase">Network Value</p>
                                <p className="text-sm font-bold text-indigo-700">{formatCurrency(networkRevenue)}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {referralsMade.map(ref => (
                                <div key={ref.id} className="bg-white px-3 py-1.5 rounded-lg text-xs shadow-sm text-secondary-700 border border-indigo-100">
                                    {ref.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="text-sm font-semibold text-secondary-900 mb-3 ml-1">Assignment History</h4>
                    <div className="space-y-3">
                        {studentAssignments.map(assign => (
                            <Card key={assign.id} className="hover:shadow-md transition-shadow" noPadding>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-secondary-800 text-sm">{assign.title}</h4>
                                        <Badge variant={assign.status === 'Completed' ? 'success' : 'neutral'}>{assign.status}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-secondary-500 mt-2">
                                        <span>{new Date(assign.deadline).toLocaleDateString()}</span>
                                        <span className={assign.paidAmount < assign.price ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}>
                                            {assign.paidAmount < assign.price ? `Due: ${formatCurrency(assign.price - assign.paidAmount)}` : 'Settled'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {studentAssignments.length === 0 && <p className="text-center text-secondary-400 py-8 bg-secondary-50 rounded-xl border border-dashed border-secondary-200">No history yet.</p>}
                    </div>
                </div>

                {student.remarks && (
                    <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                        <h5 className="text-xs font-bold text-yellow-700 uppercase mb-1">Remarks</h5>
                        <p className="text-sm text-secondary-700">{student.remarks}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                    <Input
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        className="flex-1"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-secondary-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="revenue">Sort: Revenue</option>
                        <option value="pending">Sort: Pending Dues</option>
                        <option value="vip">Sort: VIP Status</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-white border border-secondary-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                        <option value="all">Filter: All</option>
                        <option value="vip">Filter: VIP Only</option>
                        <option value="flagged">Filter: Flagged</option>
                        <option value="referrer">Filter: Referrers</option>
                    </select>
                    <Button onClick={() => { setEditingStudent({}); setIsModalOpen(true); }}>
                        New
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                {/* Student List (Left Panel) */}
                <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col h-full lg:col-span-1 border border-secondary-200">
                    <div className="overflow-y-auto flex-1 no-scrollbar">
                        {filteredStudents.map((student, index) => {
                            const studentAssignments = getStudentAssignments(student.id);
                            const totalDue = studentAssignments.reduce((acc, curr) => acc + (curr.price - curr.paidAmount), 0);
                            const isSelected = selectedStudentId === student.id;

                            return (
                                <div
                                    key={student.id}
                                    className={`p-4 flex items-center justify-between transition-all cursor-pointer border-b border-secondary-100 ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-secondary-50 border-l-4 border-l-transparent'}`}
                                    onClick={() => {
                                        setSelectedStudentId(student.id);
                                        // On Mobile, trigger modal logic fallback
                                        if (window.innerWidth < 1024) setHistoryStudent(student);
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${isSelected ? 'bg-primary-200 text-primary-700' : 'bg-secondary-100 text-secondary-600'}`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-semibold truncate flex items-center gap-2 ${isSelected ? 'text-primary-900' : 'text-secondary-900'}`}>
                                                {student.name}
                                                {student.isFlagged && <span className="text-[10px] animate-pulse">🚩</span>}
                                            </h3>
                                            <p className="text-xs text-secondary-500 truncate">{student.university || 'No University'}</p>
                                        </div>
                                    </div>
                                    {totalDue > 0 && (
                                        <div className="text-right">
                                            <p className="font-semibold text-xs text-red-500">{formatCurrency(totalDue)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <div className="p-8 text-center text-secondary-400">
                                No students found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View (Right Panel) - Hidden on mobile, handled by Modal */}
                <div className="hidden lg:block lg:col-span-2 bg-white rounded-2xl shadow-card p-6 h-full overflow-y-auto border border-secondary-200">
                    {selectedStudentId ? (
                        (() => {
                            const student = students.find(s => s.id === selectedStudentId);
                            return student ? <StudentDetails student={student} /> : null;
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-secondary-400">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            <p className="text-lg font-medium">Select a student to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* View Modal (Mobile Only) */}
            <Modal isOpen={!!historyStudent} onClose={() => setHistoryStudent(null)} title={`${historyStudent?.name || 'Student'}'s Details`}>
                {historyStudent && <StudentDetails student={historyStudent} />}
            </Modal>

            {/* Edit/Create Modal (Used by both Mobile & Desktop) */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingStudent.id ? "Edit Student" : "New Student"}>
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Personal Info</label>
                        <div className="space-y-3">
                            <Input required placeholder="Full Name" value={editingStudent.name || ''} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                            <Input required placeholder="Email Address" type="email" value={editingStudent.email || ''} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                            <Input required placeholder="Phone Number" type="tel" value={editingStudent.phone || ''} onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
                            <Input placeholder="University" value={editingStudent.university || ''} onChange={e => setEditingStudent({ ...editingStudent, university: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Notes & Status</label>

                        {/* Referral Selection */}
                        <select
                            className="w-full bg-white border border-secondary-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all mb-3 text-sm text-secondary-700 font-sans"
                            value={editingStudent.referredBy || ''}
                            onChange={e => setEditingStudent({ ...editingStudent, referredBy: e.target.value })}
                        >
                            <option value="">Referred By (Optional)</option>
                            {students
                                .filter(s => s.id !== editingStudent.id) // Prevent self-referral
                                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                            }
                        </select>

                        <textarea placeholder="Add remarks..." className="w-full bg-white border border-secondary-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all resize-none mb-4 font-sans text-sm" rows={3} value={editingStudent.remarks || ''} onChange={e => setEditingStudent({ ...editingStudent, remarks: e.target.value })} />

                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                            <input
                                type="checkbox"
                                id="flagStudent"
                                className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                checked={editingStudent.isFlagged || false}
                                onChange={e => setEditingStudent({ ...editingStudent, isFlagged: e.target.checked })}
                            />
                            <label htmlFor="flagStudent" className="text-sm font-bold text-red-700">Flag this Student (Bad Payer/Difficult)</label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Student</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentsView;
