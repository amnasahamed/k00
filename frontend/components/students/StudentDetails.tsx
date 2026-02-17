import React from 'react';
import { Student, Assignment } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentDetailsProps {
    student: Student;
    students: Student[];
    assignments: Assignment[];
    onEdit: (student: Student) => void;
    onDelete: (id: string) => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ student, students, assignments, onEdit, onDelete }) => {
    const studentAssignments = assignments.filter(a => a.studentId === student.id);
    const totalProjected = studentAssignments.reduce((acc, curr) => acc + curr.price, 0);
    const totalPaid = studentAssignments.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalDue = totalProjected - totalPaid;

    const isVIP = totalProjected > 20000;

    const referrer = students.find(s => s.id === student.referredBy);
    const referralsMade = students.filter(s => s.referredBy === student.id);

    const networkRevenue = referralsMade.reduce((sum, s) => {
        const sAssignments = assignments.filter(a => a.studentId === s.id);
        return sum + sAssignments.reduce((aSum, a) => aSum + a.price, 0);
    }, 0);

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
                        onClick={() => onEdit(student)}
                        className="p-2 bg-secondary-100 text-secondary-600 rounded-full hover:bg-secondary-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(student.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
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

export default StudentDetails;
