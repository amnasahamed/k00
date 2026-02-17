import React from 'react';
import { Writer, Assignment, AssignmentStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

interface WriterListProps {
    writers: Writer[];
    assignments: Assignment[];
    selectedId: string | number | null;
    onSelect: (id: string | number, writer: Writer) => void;
}

const WriterList: React.FC<WriterListProps> = ({ writers, assignments, selectedId, onSelect }) => {
    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col h-full lg:col-span-1 border border-secondary-200">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {writers.length > 0 ? (
                    <div className="divide-y divide-secondary-100">
                        {writers.map(writer => {
                            const isSelected = selectedId === writer.id;
                            const writerAssignments = assignments.filter(a => String(a.writerId) === String(writer.id));
                            const pendingPay = writerAssignments.reduce((sum, a) => sum + ((a.writerPrice || 0) - (a.writerPaidAmount || 0)), 0);
                            const activeCount = writerAssignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length;

                            return (
                                <div
                                    key={writer.id}
                                    className={`p-4 flex items-center justify-between transition-apple cursor-pointer border-b border-secondary-100 ${isSelected ? 'bg-primary/5' : 'hover:bg-secondary-50/50'}`}
                                    onClick={() => onSelect(writer.id, writer)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-apple ${isSelected ? 'bg-primary text-white shadow-ios' : 'bg-secondary-100 text-secondary-600'}`}>
                                            {writer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className={`text-sm font-bold truncate tracking-tight ${isSelected ? 'text-primary' : 'text-secondary-900'}`}>{writer.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] text-secondary-500 font-semibold">{writer.specialty || 'Generalist'}</p>
                                                {activeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        {pendingPay > 0 ? (
                                            <span className="text-[10px] font-black text-danger-600 bg-danger/5 px-2 py-0.5 rounded-full border border-danger/10 uppercase tracking-widest leading-none">
                                                {formatCurrency(pendingPay)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-success-600 uppercase tracking-widest leading-none">Settled</span>
                                        )}
                                        <p className="text-[9px] text-secondary-400 font-bold uppercase tracking-widest">
                                            {activeCount} Active
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-secondary-400 space-y-2">
                        <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <p className="text-sm font-medium">No writers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WriterList;
