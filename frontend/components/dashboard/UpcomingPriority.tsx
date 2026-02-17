import React from 'react';
import { Assignment, AssignmentPriority } from '../../types';
import { Card } from '../ui/Card';

interface UpcomingPriorityProps {
    assignments: Assignment[];
    onNavigate: (path: string, state?: any) => void;
    getPriorityColor: (priority: AssignmentPriority) => string;
}

const UpcomingPriority: React.FC<UpcomingPriorityProps> = ({ assignments, onNavigate, getPriorityColor }) => {
    return (
        <Card title="Upcoming Priority">
            <div className="space-y-3">
                {assignments && assignments.length > 0 ? (
                    assignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            onClick={() => onNavigate('/assignments', { state: { search: assignment.title } })}
                            className="p-3 bg-secondary-50 rounded-apple-sm border border-secondary-100/50 hover:border-primary/20 hover:bg-white transition-apple group cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h4 className="font-bold text-secondary-900 text-xs truncate max-w-[140px] group-hover:text-primary transition-apple">
                                        {assignment.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityColor(assignment.priority)}`} />
                                        <span className="text-[9px] font-bold text-secondary-400 uppercase tracking-tighter">
                                            {assignment.subject}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-secondary-900">
                                        {new Date(assignment.deadline).toLocaleDateString('en-GB')}
                                    </p>
                                    <p className={`text-[8px] font-bold uppercase tracking-tighter mt-0.5 ${assignment.priority === AssignmentPriority.HIGH ? 'text-danger' : 'text-secondary-400'}`}>
                                        {assignment.deadline.split('T')[0]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-secondary-400 py-8 text-[10px] font-bold uppercase tracking-widest bg-secondary-50/50 rounded-apple-sm border border-dashed border-secondary-200">
                        No immediate deadlines
                    </div>
                )}
            </div>
            <button
                onClick={() => onNavigate('/assignments')}
                className="w-full mt-4 py-2.5 text-[9px] font-black text-primary uppercase tracking-widest border border-primary/10 rounded-apple hover:bg-primary/5 active:scale-95 transition-apple"
            >
                View All Tasks
            </button>
        </Card>
    );
};

export default UpcomingPriority;
