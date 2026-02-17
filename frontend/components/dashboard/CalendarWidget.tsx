import React, { useState } from 'react';
import { Assignment, AssignmentStatus, AssignmentPriority } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface CalendarWidgetProps {
    calendarAssignments: Assignment[];
    currentDate: Date;
    calendarFilter: 'all' | 'high' | 'overdue';
    onFilterChange: (filter: 'all' | 'high' | 'overdue') => void;
    onChangeMonth: (offset: number) => void;
    onNavigate: (path: string, state?: any) => void;
    getPriorityColor: (priority: AssignmentPriority) => string;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ calendarAssignments, currentDate, calendarFilter, onFilterChange, onChangeMonth, onNavigate, getPriorityColor }) => {
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDayAssignments, setSelectedDayAssignments] = useState<Assignment[]>([]);

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDayClick = (assignments: Assignment[], date: Date) => {
        setSelectedDayAssignments(assignments);
        setSelectedDate(date);
        setIsDayModalOpen(true);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 md:h-24 bg-gray-50 border border-gray-100 rounded-apple"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = dateObj.toDateString();
            let daysAssignments = calendarAssignments.filter(a => new Date(a.deadline).toDateString() === dateStr && a.status !== AssignmentStatus.COMPLETED);

            // Apply calendar filter
            if (calendarFilter === 'high') {
                daysAssignments = daysAssignments.filter(a => a.priority === AssignmentPriority.HIGH);
            } else if (calendarFilter === 'overdue') {
                const now = new Date();
                daysAssignments = daysAssignments.filter(a => new Date(a.deadline) < now);
            }

            const isToday = new Date().toDateString() === dateStr;

            days.push(
                <div
                    key={i}
                    onClick={() => handleDayClick(daysAssignments, dateObj)}
                    className={`h-10 md:h-24 p-1 md:p-2 border rounded-apple overflow-hidden flex flex-col gap-1 transition-apple hover:shadow-ios-md cursor-pointer active:scale-95 ${isToday ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-white border-secondary-100 hover:border-secondary-200'}`}
                >
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-secondary-400'}`}>{i}</span>
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                        {daysAssignments.map(a => (
                            <div
                                key={a.id}
                                onClick={(e) => { e.stopPropagation(); onNavigate('/assignments', { state: { highlightId: a.id } }); }}
                                className="cursor-pointer hidden md:block text-[9px] bg-danger/5 text-danger-600 px-1.5 py-0.5 rounded-[6px] truncate border-l-2 border-danger-500 font-bold uppercase tracking-widest"
                                title={a.title}
                            >
                                {a.title}
                            </div>
                        ))}
                        {daysAssignments.length > 0 && (
                            <div className="md:hidden w-1.5 h-1.5 rounded-full bg-danger-500 mx-auto mt-1"></div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <>
            <div className="bg-white p-6 rounded-apple-lg shadow-ios">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-semibold text-gray-900 text-lg tracking-tight">Deadlines Calendar</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-apple p-1">
                            <button
                                onClick={() => onFilterChange('all')}
                                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'all' ? 'bg-white shadow-ios text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => onFilterChange('high')}
                                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'high' ? 'bg-white shadow-ios text-danger' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                High Priority
                            </button>
                            <button
                                onClick={() => onFilterChange('overdue')}
                                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-200 ease-apple ${calendarFilter === 'overdue' ? 'bg-white shadow-ios text-warning' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Overdue
                            </button>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-apple p-1">
                            <button onClick={() => onChangeMonth(-1)} className="p-1.5 hover:bg-white rounded-[8px] shadow-ios transition-all duration-200 ease-apple active:scale-95 text-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-xs font-semibold w-20 text-center text-gray-900">{currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                            <button onClick={() => onChangeMonth(1)} className="p-1.5 hover:bg-white rounded-[8px] shadow-ios transition-all duration-200 ease-apple active:scale-95 text-gray-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] uppercase font-semibold text-gray-500 tracking-wider">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {renderCalendar()}
                </div>
            </div>

            {/* Calendar Day Modal */}
            <Modal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} title={`Tasks for ${selectedDate?.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`}>
                <div className="space-y-3">
                    {selectedDayAssignments.length > 0 ? (
                        selectedDayAssignments.map(a => (
                            <div
                                key={a.id}
                                onClick={() => onNavigate('/assignments', { state: { highlightId: a.id } })}
                                className="p-4 bg-gray-50 rounded-apple border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 hover:border-gray-200 transition-all duration-200 ease-apple active:scale-[0.98]"
                            >
                                <div>
                                    <h4 className="font-bold text-sm text-secondary-900 tracking-tight">{a.title}</h4>
                                    <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">{a.subject} • {a.type}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border ${getPriorityColor(a.priority)}`}>
                                    {a.priority}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-apple border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">No deadlines scheduled for this day.</p>
                        </div>
                    )}
                    <div className="pt-3">
                        <Button variant="ghost" className="w-full" onClick={() => setIsDayModalOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default CalendarWidget;
