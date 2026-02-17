import React from 'react';
import { Assignment, AssignmentStatus } from '../../types';
import { calculateWriterPerformance } from '../../services/alertService';

interface WriterWorkloadGridProps {
    writers: any[];
    assignments: Assignment[];
    onNavigate: (path: string, state?: any) => void;
}

const WriterWorkloadGrid: React.FC<WriterWorkloadGridProps> = ({ writers, assignments, onNavigate }) => {
    if (writers.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-apple-lg shadow-ios border border-secondary-100/50 overflow-hidden">
            <h3 className="font-bold text-secondary-900 mb-6 text-lg tracking-tight uppercase">Writer Capacity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {writers.slice(0, 8).map(writer => {
                    const writerAssignments = assignments.filter(a =>
                        a.writerId === writer.id &&
                        a.status !== AssignmentStatus.COMPLETED &&
                        a.status !== AssignmentStatus.CANCELLED
                    );
                    const activeCount = writerAssignments.length;
                    const maxTasks = writer.maxConcurrentTasks || 5;
                    const utilizationPercent = Math.min((activeCount / maxTasks) * 100, 100);
                    const status = writer.availabilityStatus || 'available';

                    // Calculate performance metrics
                    const performance = calculateWriterPerformance(writer, assignments);

                    const statusColors = {
                        available: 'bg-success/5 text-success-600 border-success-100',
                        busy: 'bg-warning/5 text-warning-600 border-warning-100',
                        vacation: 'bg-primary/5 text-primary-600 border-primary-100'
                    };

                    return (
                        <div key={writer.id} className="bg-white p-5 rounded-apple border border-secondary-100 hover:shadow-ios-md hover:border-primary/20 transition-apple cursor-pointer active:scale-95 group" onClick={() => onNavigate('/writers')}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-sm text-secondary-900 truncate flex-1 tracking-tight group-hover:text-primary transition-apple">{writer.name}</h4>
                                <div className="flex items-center gap-1.5 ml-2">
                                    {performance.isReliable && (
                                        <span className="px-2 py-0.5 bg-success/5 text-success-600 rounded-full text-[8px] font-black border border-success-100 uppercase tracking-widest" title="95%+ on-time delivery">
                                            RELIABLE
                                        </span>
                                    )}
                                    {performance.hasRedFlag && (
                                        <span className="px-2 py-0.5 bg-danger/5 text-danger-600 rounded-full text-[8px] font-black border border-danger-100 uppercase tracking-widest" title="< 80% on-time delivery">
                                            RISK
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest border ${statusColors[status as keyof typeof statusColors]} inline-block`}>
                                    {status}
                                </span>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] text-secondary-500 mb-2 font-bold uppercase tracking-widest">
                                    <span>{activeCount} / {maxTasks} tasks</span>
                                    <span>{Math.round(utilizationPercent)}%</span>
                                </div>
                                <div className="h-2 bg-secondary-50 rounded-full overflow-hidden border border-secondary-100">
                                    <div
                                        className={`h-full rounded-full transition-apple ${utilizationPercent >= 90 ? 'bg-danger-500' :
                                            utilizationPercent >= 70 ? 'bg-warning-500' :
                                                'bg-success-500'
                                            }`}
                                        style={{ width: `${utilizationPercent}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                {writer.rating && writer.rating.count > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-warning-500 font-bold">★</span>
                                        <span className="font-black text-secondary-600">{((writer.rating.quality + writer.rating.punctuality) / 2).toFixed(1)}</span>
                                    </div>
                                )}
                                {performance.onTimeDeliveryRate > 0 && (
                                    <span className={`font-black uppercase tracking-widest ${performance.onTimeDeliveryRate >= 95 ? 'text-success-600' :
                                        performance.onTimeDeliveryRate >= 80 ? 'text-warning-600' :
                                            'text-danger-600'
                                        }`}>
                                        {Math.round(performance.onTimeDeliveryRate)}% ON-TIME
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {writers.length > 8 && (
                <button onClick={() => onNavigate('/writers')} className="mt-6 text-[11px] font-black text-primary hover:text-primary-600 uppercase tracking-widest transition-apple flex items-center gap-1 active:scale-95">
                    View all writers
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
            )}
        </div>
    );
};


export default WriterWorkloadGrid;
