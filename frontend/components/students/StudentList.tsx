import React from 'react';
import { Student, Assignment } from '../../types';
import { formatCurrency } from '../../utils/format';

interface StudentListProps {
    students: Student[];
    assignments: Assignment[];
    selectedId: string | null;
    onSelect: (id: string, student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, assignments, selectedId, onSelect }) => {
    const getStudentDue = (studentId: string) => {
        return assignments
            .filter(a => a.studentId === studentId)
            .reduce((acc, curr) => acc + (curr.price - curr.paidAmount), 0);
    };

    return (
        <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col h-full lg:col-span-1 border border-secondary-200">
            <div className="overflow-y-auto flex-1 no-scrollbar">
                {students.map((student) => {
                    const totalDue = getStudentDue(student.id);
                    const isSelected = selectedId === student.id;

                    return (
                        <div
                            key={student.id}
                            className={`p-4 flex items-center justify-between transition-all cursor-pointer border-b border-secondary-100 ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-secondary-50 border-l-4 border-l-transparent'}`}
                            onClick={() => onSelect(student.id, student)}
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
                {students.length === 0 && (
                    <div className="p-8 text-center text-secondary-400">
                        No students found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentList;
