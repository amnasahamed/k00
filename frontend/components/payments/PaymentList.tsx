import React from 'react';
import { Assignment, Student, Writer } from '../../types';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/format';

type PaymentType = 'incoming' | 'outgoing' | 'finance';

interface PaymentListProps {
    filteredAssignments: Assignment[];
    students: Student[];
    writers: Writer[];
    activeTab: PaymentType;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onPay: (assignment: Assignment) => void;
    onEdit: (assignment: Assignment) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({
    filteredAssignments,
    students,
    writers,
    activeTab,
    searchTerm,
    onSearchChange,
    onPay,
    onEdit,
}) => {
    return (
        <div className="space-y-4 animate-in slide-in-from-left duration-300">
            <div className="relative group">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary transition-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'incoming' ? 'students' : 'writers'} or tasks...`}
                    className="w-full bg-secondary-100/50 border border-secondary-200/50 rounded-apple-lg pl-11 pr-4 py-3 text-sm font-bold text-secondary-900 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-apple placeholder:text-secondary-400"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-apple-lg shadow-ios overflow-hidden">
                {filteredAssignments.map((assignment, idx) => {
                    const student = students.find(s => s.id === assignment.studentId);
                    const writer = writers.find(w => w.id === assignment.writerId);

                    let total = 0, paid = 0, due = 0, entityName = '';

                    if (activeTab === 'incoming') {
                        total = assignment.price;
                        paid = assignment.paidAmount;
                        due = total - paid;
                        entityName = student?.name || 'Unknown Student';
                    } else {
                        total = assignment.writerPrice || 0;
                        paid = assignment.writerPaidAmount || 0;
                        due = total - paid;
                        entityName = writer?.name || 'Unassigned Writer';
                    }

                    const isFullyPaid = due <= 0;

                    return (
                        <div key={assignment.id} className={`p-5 group/item transition-apple hover:bg-secondary-50/50 ${idx !== filteredAssignments.length - 1 ? 'border-b border-secondary-100' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-4">
                                    <h3 className="font-bold text-secondary-900 text-sm leading-tight group-hover/item:text-primary transition-apple">{assignment.title}</h3>
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">{entityName}</p>
                                </div>
                                <div className="text-right">
                                    {isFullyPaid ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-success/5 text-success-600 border border-success-100">
                                            Settled ✓
                                        </span>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-danger-500 tracking-tight">
                                                {formatCurrency(due)}
                                            </span>
                                            <span className="text-[8px] font-black text-danger-400 uppercase tracking-tighter mt-0.5">PENDING</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-5">
                                <div className="flex-1">
                                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden shadow-inner-white">
                                        <div
                                            className={`h-full rounded-full transition-apple duration-700 ${isFullyPaid ? 'bg-success-500' : 'bg-primary-500 shadow-ios-primary'}`}
                                            style={{ width: `${Math.min((paid / (total || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-secondary-400 mt-2 font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isFullyPaid ? 'bg-success' : 'bg-primary'}`}></div> {formatCurrency(paid)} Paid</span>
                                        <span>{formatCurrency(total)} Total</span>
                                    </div>
                                    {/* Show last payment date */}
                                    {assignment.paymentHistory && assignment.paymentHistory.length > 0 && (
                                        <div className="text-[8px] font-black text-secondary-300 mt-1 uppercase tracking-tighter">
                                            Last action: {new Date(assignment.paymentHistory[assignment.paymentHistory.length - 1].date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2.5">
                                    <button
                                        onClick={() => onEdit(assignment)}
                                        className="w-9 h-9 flex items-center justify-center rounded-apple bg-secondary-50 text-secondary-400 hover:bg-white hover:text-primary hover:shadow-ios transition-apple border border-secondary-100/50"
                                    >
                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    {!isFullyPaid && (
                                        <Button size="sm" onClick={() => onPay(assignment)} className="shadow-ios-sm font-black uppercase tracking-widest text-[9px] px-4">
                                            {activeTab === 'incoming' ? 'Receive' : 'Settle'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                {filteredAssignments.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                        No pending payments found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentList;
