import React from 'react';
import { Assignment, AssignmentStatus, AssignmentPriority, Student, Writer } from '../../types';
import { Badge } from '../ui/Badge';

interface AssignmentCardsProps {
    assignments: Assignment[];
    students: Student[];
    writers: Writer[];
    onClick: (assignment: Assignment) => void;
    getStatusStyles: (status: AssignmentStatus) => { card: string; row: string; select: string };
    getPriorityColor: (priority: AssignmentPriority) => string;
    formatCurrency: (amount: number) => string;
}

const AssignmentCards: React.FC<AssignmentCardsProps> = ({
    assignments,
    students,
    writers,
    onClick,
    getStatusStyles,
    getPriorityColor,
    formatCurrency,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(assignment => {
                const student = students.find(s => s.id === assignment.studentId);
                const writer = writers.find(w => w.id === assignment.writerId);
                const styles = getStatusStyles(assignment.status);
                const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== AssignmentStatus.COMPLETED;

                return (
                    <div key={assignment.id} className={`rounded-apple-lg p-5 transition-apple cursor-pointer shadow-ios border border-secondary-100 hover:shadow-ios-md hover:border-primary/30 active:scale-[0.98] group ${styles.card}`} onClick={() => onClick(assignment)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 mr-3">
                                <h3 className="font-bold text-secondary-900 text-sm line-clamp-2 leading-tight group-hover:text-primary transition-apple">{assignment.title}</h3>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1.5">{student?.name || 'Unknown'}</p>
                            </div>
                            <Badge variant={getPriorityColor(assignment.priority) as any} size="sm" className="font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">{assignment.priority}</Badge>
                        </div>
                        <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest mb-5">
                            <span className="bg-white/50 px-2 py-1 rounded-apple border border-secondary-100/30 backdrop-blur-sm text-secondary-600">{assignment.type}</span>
                            <span className={`px-2 py-1 rounded-apple border ${isOverdue ? 'bg-danger/5 text-danger border-danger-100 shadow-ios-sm' : 'bg-white/50 text-secondary-500 border-secondary-100/30'}`}>
                                {new Date(assignment.deadline).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-secondary-100/50">
                            <div className="text-[10px] font-black text-secondary-900 uppercase tracking-widest">
                                {formatCurrency(assignment.price)}
                                {assignment.paidAmount < assignment.price && <span className="text-danger ml-1.5 font-black">! DUE</span>}
                            </div>
                            {writer ? (
                                <div className="text-[9px] font-black text-secondary-500 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                    <span className="max-w-[80px] truncate">{writer.name}</span>
                                </div>
                            ) : <span className="text-[9px] font-black text-danger-400 uppercase tracking-widest opacity-60">Unassigned</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AssignmentCards;
