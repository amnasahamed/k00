import React from 'react';
import { Assignment, AssignmentStatus, AssignmentPriority, Student, Writer } from '../../types';
import { Badge } from '../ui/Badge';

interface AssignmentTableProps {
    assignments: Assignment[];
    students: Student[];
    writers: Writer[];
    selectedIds: Set<string>;
    onSelect: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    onStatusChange: (assignment: Assignment, newStatus: AssignmentStatus) => void;
    onClick: (assignment: Assignment) => void;
    onQuickSettle: (e: React.MouseEvent, assignment: Assignment) => void;
    getStatusStyles: (status: AssignmentStatus) => { card: string; row: string; select: string };
    getPriorityColor: (priority: AssignmentPriority) => string;
    formatCurrency: (amount: number) => string;
}

const AssignmentTable: React.FC<AssignmentTableProps> = ({
    assignments,
    students,
    writers,
    selectedIds,
    onSelect,
    onSelectAll,
    onStatusChange,
    onClick,
    onQuickSettle,
    getStatusStyles,
    getPriorityColor,
    formatCurrency,
}) => {
    return (
        <div className="hidden md:block bg-white rounded-apple-lg shadow-ios overflow-hidden border border-secondary-100">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-secondary-100 bg-secondary-50/10">
                        <th className="p-4 w-10 text-center">
                            <input type="checkbox" className="rounded-full border-secondary-300 text-primary focus:ring-primary/20 transition-apple" checked={assignments.length > 0 && selectedIds.size === assignments.length} onChange={(e) => onSelectAll(e.target.checked)} />
                        </th>
                        <th className="p-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Title / Subject</th>
                        <th className="p-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Client & Writer</th>
                        <th className="p-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Status</th>
                        <th className="p-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Scope</th>
                        <th className="p-4 text-right text-[10px] font-black text-secondary-400 uppercase tracking-widest bg-success/5 border-l border-secondary-100/30">Student Pay</th>
                        <th className="p-4 text-right text-[10px] font-black text-secondary-400 uppercase tracking-widest bg-danger/5 border-l border-secondary-100/30">Writer Cost</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                    {assignments.map((assignment) => {
                        const student = students.find(s => s.id === assignment.studentId);
                        const writer = writers.find(w => w.id === assignment.writerId);
                        const styles = getStatusStyles(assignment.status);
                        const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== AssignmentStatus.COMPLETED;

                        return (
                            <tr
                                key={assignment.id}
                                className="group hover:bg-secondary-50/50 transition-apple cursor-pointer"
                                onClick={() => onEdit(assignment)}
                            >
                                <td className="p-4 w-10 text-center" onClick={e => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="rounded-full border-secondary-300 text-primary focus:ring-primary/20 transition-apple"
                                        checked={selectedIds.has(String(assignment.id!))}
                                        onChange={() => onSelect(String(assignment.id!))}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-black text-secondary-900 leading-tight group-hover:text-primary transition-apple">{assignment.title}</div>
                                    <div className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">{assignment.subject}</div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium text-secondary-900">{student?.name}</div>
                                    {writer && <div className="text-xs text-secondary-400">Writer: {writer.name}</div>}
                                </td>
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                    <select
                                        className={`text-[10px] font-bold uppercase rounded px-2 py-1 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${styles.select}`}
                                        value={assignment.status}
                                        onChange={(e) => onStatusChange(assignment, e.target.value as AssignmentStatus)}
                                    >
                                        {Object.values(AssignmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-secondary-900">{assignment.wordCount?.toLocaleString() || '-'} words</div>
                                    {assignment.costPerWord ? (
                                        <div className="text-xs text-secondary-500">@{formatCurrency(assignment.costPerWord)}/word</div>
                                    ) : <span className="text-xs text-secondary-300">-</span>}
                                </td>
                                <td className="p-4">
                                    <div className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-secondary-700'}`}>
                                        {new Date(assignment.deadline).toLocaleDateString()}
                                    </div>
                                    <div className="inline-block mt-1">
                                        <Badge variant={getPriorityColor(assignment.priority) as any} size="sm">{assignment.priority}</Badge>
                                    </div>
                                </td>
                                <td className="p-4 text-right border-l border-secondary-100/30 bg-success/5">
                                    <div className="text-sm font-black text-secondary-900">{formatCurrency(assignment.price)}</div>
                                    {assignment.paidAmount < assignment.price ? (
                                        <button
                                            onClick={(e) => onQuickSettle(e, assignment)}
                                            className="text-[10px] font-black text-danger-500 hover:text-danger-700 uppercase tracking-widest transition-apple hover:underline"
                                        >
                                            Due: {formatCurrency(assignment.price - assignment.paidAmount)}
                                        </button>
                                    ) : <span className="text-[10px] font-black text-success-600 uppercase tracking-widest">Paid ✓</span>}
                                </td>
                                <td className="p-4 text-right border-l border-secondary-100/30 bg-danger/5">
                                    {assignment.writerPrice ? (
                                        <>
                                            <div className="text-sm font-black text-secondary-900">{formatCurrency(assignment.writerPrice)}</div>
                                            {(assignment.writerPaidAmount || 0) < assignment.writerPrice ? (
                                                <span className="text-[10px] font-black text-danger-500 uppercase tracking-widest">Due: {formatCurrency(assignment.writerPrice - (assignment.writerPaidAmount || 0))}</span>
                                            ) : <span className="text-[10px] font-black text-success-600 uppercase tracking-widest">Paid ✓</span>}
                                        </>
                                    ) : <span className="text-[10px] font-bold text-secondary-300 uppercase tracking-widest">-</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AssignmentTable;
