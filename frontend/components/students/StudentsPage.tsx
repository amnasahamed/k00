import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Student, Assignment } from '../../types';
import * as DataService from '../../services/dataService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import Modal from '../ui/Modal';
import { useToast } from '../Layout';
import StudentList from './StudentList';
import { Plus, X, Upload, BarChart2, School } from 'lucide-react';
import StudentDetails from './StudentDetails';
import StudentFormModal from './StudentFormModal';
import StudentAnalytics from './StudentAnalytics';
import UniversityManager from './UniversityManager';

const StudentsPage: React.FC = () => {
    const { addToast } = useToast();
    const location = useLocation();
    const [students, setStudents] = useState<Student[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const [isFormOpen, setIsFormOpen] = useState(false); // Changed from isModalOpen
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false); // New state
    const [isUniversityManagerOpen, setIsUniversityManagerOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});
    const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'pending' | 'vip'>('name');
    const [filterType, setFilterType] = useState<'all' | 'vip' | 'flagged' | 'referrer'>('all');

    useEffect(() => {
        refreshData();
    }, []);

    // Deep linking support from GlobalSearch
    useEffect(() => {
        if (location.state) {
            const state = location.state as any;
            if (state.selectStudent) {
                setSelectedStudentId(state.selectStudent);
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state]);

    const refreshData = async () => {
        try {
            const s = await DataService.getStudents();
            setStudents(s);
            const a = await DataService.getAssignments();
            setAssignments(a);
        } catch (error) {
            console.error("Failed to fetch data", error);
            addToast('Failed to load data', 'error');
        }
    };

    const handleSaveStudent = async (studentData: Partial<Student>) => {
        if (!studentData.name) return;
        try {
            const saved = await DataService.saveStudent(studentData as Student);
            setIsFormOpen(false);
            setEditingStudent({});
            await refreshData();
            setSelectedStudentId(saved.id);
            addToast('Student saved', 'success');
        } catch (error) {
            console.error("Failed to save student", error);
            addToast('Failed to save student', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this student?')) {
            try {
                await DataService.deleteStudent(id);
                await refreshData();
                if (selectedStudentId === id) setSelectedStudentId(null);
                addToast('Student deleted', 'success');
            } catch (error) {
                console.error("Failed to delete student", error);
                addToast('Failed to delete student', 'error');
            }
        }
    };

    const handleEdit = (student: Student) => {
        setHistoryStudent(null);
        setEditingStudent(student);
        setIsFormOpen(true); // Changed from setIsModalOpen
    };

    const handleAddStudent = () => { // New function
        setEditingStudent({});
        setIsFormOpen(true);
    };

    const getStudentAssignments = (studentId: string) => assignments.filter(a => a.studentId === studentId);

    const filteredStudents = React.useMemo(() => {
        return students
            .filter(s => {
                const textMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.email.toLowerCase().includes(searchTerm.toLowerCase());

                if (!textMatch) return false;

                if (filterType === 'vip') {
                    const totalProjected = getStudentAssignments(s.id).reduce((sum, a) => sum + a.price, 0);
                    return totalProjected > 20000;
                }
                if (filterType === 'flagged') return s.isFlagged;
                if (filterType === 'referrer') {
                    return students.some(st => st.referredBy === s.id);
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'revenue') {
                    const revA = getStudentAssignments(a.id).reduce((sum, asg) => sum + asg.price, 0);
                    const revB = getStudentAssignments(b.id).reduce((sum, asg) => sum + asg.price, 0);
                    return revB - revA;
                }
                if (sortBy === 'pending') {
                    const pendingA = getStudentAssignments(a.id).reduce((sum, asg) => sum + (asg.price - asg.paidAmount), 0);
                    const pendingB = getStudentAssignments(b.id).reduce((sum, asg) => sum + (asg.price - asg.paidAmount), 0);
                    return pendingB - pendingA;
                }
                if (sortBy === 'vip') {
                    const revA = getStudentAssignments(a.id).reduce((sum, asg) => sum + asg.price, 0);
                    const revB = getStudentAssignments(b.id).reduce((sum, asg) => sum + asg.price, 0);
                    return (revB > 20000 ? 1 : 0) - (revA > 20000 ? 1 : 0);
                }
                return 0;
            });
    }, [students, assignments, searchTerm, filterType, sortBy]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                        <p className="text-gray-500">Manage your student database</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsAnalyticsOpen(true)}>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analytics
                        </Button>
                        <Button variant="secondary" onClick={() => setIsUniversityManagerOpen(true)}>
                            <School className="w-4 h-4 mr-2" />
                            Universities
                        </Button>
                        <Button onClick={handleAddStudent}>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-apple-lg border border-secondary-100/50 shadow-ios-sm">
                    <div className="flex-1 min-w-[300px] group">
                        <Input
                            placeholder="Search student names, universities, or emails..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<svg className="w-5 h-5 text-secondary-400 group-focus-within:text-primary transition-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                            className="bg-secondary-50 border-secondary-100 focus:bg-white transition-apple"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            options={[
                                { value: 'name', label: 'Sort: Name' },
                                { value: 'revenue', label: 'Sort: Revenue' },
                                { value: 'pending', label: 'Sort: Pending Dues' },
                                { value: 'vip', label: 'Sort: VIP Status' }
                            ]}
                            className="w-44"
                            size="sm"
                        />
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            options={[
                                { value: 'all', label: 'Filter: All' },
                                { value: 'vip', label: 'Filter: VIP Only' },
                                { value: 'flagged', label: 'Filter: Flagged' },
                                { value: 'referrer', label: 'Filter: Referrers' }
                            ]}
                            className="w-44"
                            size="sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                <StudentList
                    students={filteredStudents}
                    assignments={assignments}
                    selectedId={selectedStudentId}
                    onSelect={(id, student) => {
                        setSelectedStudentId(id);
                        if (window.innerWidth < 1024) setHistoryStudent(student);
                    }}
                />

                <div className="hidden lg:block lg:col-span-2 bg-white rounded-apple-lg shadow-ios p-8 h-full overflow-y-auto border border-secondary-100 transition-apple">
                    {selectedStudentId ? (
                        (() => {
                            const student = students.find(s => s.id === selectedStudentId);
                            return student ? (
                                <StudentDetails
                                    student={student}
                                    students={students}
                                    assignments={assignments}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ) : null;
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-secondary-400 bg-secondary-50/30 rounded-apple-lg border border-dashed border-secondary-200">
                            <div className="bg-primary/10 p-6 rounded-full mb-4 shadow-ios-sm">
                                <svg className="w-12 h-12 text-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Select a student to view details</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={!!historyStudent} onClose={() => setHistoryStudent(null)} title={`${historyStudent?.name || 'Student'}'s Details`}>
                {historyStudent && (
                    <StudentDetails
                        student={historyStudent}
                        students={students}
                        assignments={assignments}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </Modal>

            <StudentFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                initialData={editingStudent}
                students={students}
                onSubmit={handleSaveStudent}
            />

            {isAnalyticsOpen && (
                <StudentAnalytics
                    students={students}
                    onClose={() => setIsAnalyticsOpen(false)}
                />
            )}

            {isUniversityManagerOpen && (
                <UniversityManager
                    onClose={() => setIsUniversityManagerOpen(false)}
                />
            )}
        </div>
    );
};

export default StudentsPage;
