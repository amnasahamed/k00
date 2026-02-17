import React from 'react';
import { Assignment, Student, Writer } from '../../types';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type PaymentType = 'incoming' | 'outgoing' | 'finance';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Assignment | null;
    activeTab: PaymentType;
    students: Student[];
    writers: Writer[];
    isEditMode: boolean;
    paymentAmount: number;
    onAmountChange: (value: number) => void;
    onSubmit: (e: React.FormEvent) => void;
    formatCurrency: (amount: number) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    assignment,
    activeTab,
    students,
    writers,
    isEditMode,
    paymentAmount,
    onAmountChange,
    onSubmit,
    formatCurrency,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={
            isEditMode
                ? "Correct Payment"
                : (activeTab === 'incoming' ? "Receive Payment" : "Make Payment")
        }>
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="bg-secondary-50 p-6 rounded-apple-lg text-center border border-secondary-100/50 shadow-inner-white">
                    <p className="text-[10px] text-secondary-400 uppercase tracking-widest font-black mb-1">
                        {activeTab === 'incoming' ? 'From Student' : 'To Writer'}
                    </p>
                    <h3 className="text-lg font-bold text-secondary-900 mb-1">{assignment?.title}</h3>
                    {assignment && (
                        <div className="text-sm font-semibold text-secondary-600 mb-4 space-y-1">
                            <p><span className="text-secondary-400">Student:</span> {students.find(s => s.id === assignment.studentId)?.name || 'Unknown Student'}</p>
                            {activeTab === 'outgoing' && (
                                <p><span className="text-secondary-400">Writer:</span> {writers.find(w => w.id === assignment.writerId)?.name || 'Unassigned Writer'}</p>
                            )}
                        </div>
                    )}

                    <div className="inline-block bg-white px-5 py-3 rounded-apple shadow-ios border border-secondary-100/50">
                        <p className="text-[10px] text-secondary-300 uppercase font-black tracking-widest mb-1">Current Balance</p>
                        {activeTab === 'incoming' ? (
                            <div className="flex items-baseline gap-1 justify-center">
                                <span className="text-2xl font-bold text-secondary-900">{formatCurrency(assignment?.paidAmount || 0)}</span>
                                <span className="text-sm font-semibold text-secondary-300">/ {formatCurrency(assignment?.price || 0)}</span>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-1 justify-center">
                                <span className="text-2xl font-bold text-secondary-900">{formatCurrency(assignment?.writerPaidAmount || 0)}</span>
                                <span className="text-sm font-semibold text-secondary-300">/ {formatCurrency(assignment?.writerPrice || 0)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <Input
                        label={isEditMode ? 'Corrected Total Amount' : 'Transaction Amount'}
                        type="number"
                        required
                        autoFocus
                        value={paymentAmount}
                        onChange={e => {
                            const value = e.target.value;
                            if (value === '' || !isNaN(Number(value))) {
                                onAmountChange(value === '' ? 0 : Number(value));
                            }
                        }}
                        className="bg-secondary-50 border-secondary-100 focus:bg-white transition-apple"
                        rightContent={!isEditMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (!assignment) return;
                                    if (activeTab === 'incoming') {
                                        onAmountChange(assignment.price - assignment.paidAmount);
                                    } else {
                                        onAmountChange((assignment.writerPrice || 0) - (assignment.writerPaidAmount || 0));
                                    }
                                }}
                                className="text-[10px] font-black text-primary-600 hover:text-primary-800 px-4 h-full border-l border-secondary-100 transition-apple uppercase tracking-widest"
                            >
                                MAX
                            </button>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100 mt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest px-6">Cancel</Button>
                    <Button type="submit" variant={isEditMode ? "secondary" : "primary"} className="text-[10px] font-black uppercase tracking-widest px-8 shadow-ios-primary">
                        {isEditMode ? 'Update Record' : 'Process Payment'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentModal;
