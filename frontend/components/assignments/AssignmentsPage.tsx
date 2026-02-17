import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Assignment, AssignmentStatus, AssignmentType, AssignmentPriority, Student, Writer } from '../../types';
import * as DataService from '../../services/dataService';
import { useToast } from '../Layout';
import { formatCurrency } from '../../utils/format';
import { getStatusStyles, getPriorityColor } from '../../utils/statusStyles';
import AssignmentControlBar from './AssignmentControlBar';
import AssignmentTable from './AssignmentTable';
import AssignmentCards from './AssignmentCards';
import AssignmentFormModal from './AssignmentFormModal';
import AssignmentRatingModal from './AssignmentRatingModal';
import AssignmentDeleteModal from './AssignmentDeleteModal';
import TemplateModal from './TemplateModal';

const AssignmentsPage: React.FC = () => {
    const { addToast } = useToast();
    const location = useLocation();

    // Data State
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [writers, setWriters] = useState<Writer[]>([]);

    // UI State
    const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filter State
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isOverdueFilter, setIsOverdueFilter] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    // Sort State
    const [sortBy, setSortBy] = useState<'deadline' | 'createdAt' | 'title'>('deadline');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment>>({});

    // Delete Confirmation State
    const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean, type: 'single' | 'bulk', id?: string }>({ isOpen: false, type: 'single' });

    // Rating Modal State
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [ratingWriterId, setRatingWriterId] = useState<string | null>(null);
    const [ratingStats, setRatingStats] = useState({ quality: 5, punctuality: 5 });

    // Bulk action state
    const [bulkAction, setBulkAction] = useState<'status' | 'writer' | null>(null);
    const [bulkStatusValue, setBulkStatusValue] = useState('');
    const [bulkWriterValue, setBulkWriterValue] = useState('');

    // Template state
    const [templates, setTemplates] = useState<Partial<Assignment>[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // Inline Creation State
    const [newStudentName, setNewStudentName] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [newWriterName, setNewWriterName] = useState('');
    const [isAddingWriter, setIsAddingWriter] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);

    useEffect(() => {
        refreshData();
        const savedTemplates = localStorage.getItem('assignmentTemplates');
        if (savedTemplates) {
            setTemplates(JSON.parse(savedTemplates));
        }

        if (location.state) {
            const state = location.state as any;
            if (state.filterStatus) setStatusFilter(state.filterStatus);
            if (state.filterSpecial === 'overdue') setIsOverdueFilter(true);
            if (state.filterType === 'Dissertation') setSearchTerm('Dissertation');
            if (state.highlightId) {
                const element = document.getElementById(state.highlightId);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const refreshData = async () => {
        try {
            const a = await DataService.getAssignments();
            setAssignments(a);
            const s = await DataService.getStudents();
            setStudents(s);
            const w = await DataService.getWriters();
            setWriters(w);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Failed to fetch data", error);
            addToast('Failed to load data', 'error');
        }
    };

    // --- Handlers ---
    const handleQuickAddStudent = async () => {
        if (!newStudentName.trim()) return;
        const newStudent: Student = {
            id: '',
            name: newStudentName.trim(),
            email: `${newStudentName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: `9${Date.now().toString().slice(-9)}`,
            university: 'Unknown'
        };
        try {
            const saved = await DataService.saveStudent(newStudent);
            const s = await DataService.getStudents();
            setStudents(s);
            setEditingAssignment(prev => ({ ...prev, studentId: saved.id }));
            setNewStudentName('');
            setIsAddingStudent(false);
            addToast(`Created student: ${saved.name}`, 'success');
        } catch (error) {
            console.error("Failed to add student", error);
            addToast("Failed to add student: " + (error instanceof Error ? error.message : 'Unknown error'), "error");
        }
    };

    const handleQuickAddWriter = async () => {
        if (!newWriterName.trim()) return;
        const newWriter: Writer = {
            id: '',
            name: newWriterName.trim(),
            contact: `writer.${newWriterName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
            specialty: 'General'
        };
        try {
            const saved = await DataService.saveWriter(newWriter);
            const w = await DataService.getWriters();
            setWriters(w);
            setEditingAssignment(prev => ({ ...prev, writerId: saved.id }));
            setNewWriterName('');
            setIsAddingWriter(false);
            addToast(`Created writer: ${saved.name}`, 'success');
        } catch (error) {
            console.error("Failed to add writer", error);
            addToast("Failed to add writer: " + (error instanceof Error ? error.message : 'Unknown error'), "error");
        }
    };

    const handleReassignWriter = () => {
        const currentPaid = editingAssignment.writerPaidAmount || 0;
        const currentSunk = editingAssignment.sunkCosts || 0;

        setEditingAssignment(prev => ({
            ...prev,
            sunkCosts: currentSunk + currentPaid,
            writerId: '',
            writerPaidAmount: 0,
            writerPrice: 0,
            writerCostPerWord: 0
        }));
        setIsReassigning(false);
        addToast('Writer unassigned. Previous payments moved to Sunk Costs.', 'info');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAssignment.studentId || !editingAssignment.title) {
            addToast('Student and Title are required', 'error');
            return;
        }

        const payload = {
            ...editingAssignment,
            price: editingAssignment.price ? Number(editingAssignment.price) : 0,
            paidAmount: editingAssignment.paidAmount ? Number(editingAssignment.paidAmount) : 0,
            writerPrice: editingAssignment.writerPrice ? Number(editingAssignment.writerPrice) : 0,
            writerPaidAmount: editingAssignment.writerPaidAmount ? Number(editingAssignment.writerPaidAmount) : 0,
            sunkCosts: editingAssignment.sunkCosts ? Number(editingAssignment.sunkCosts) : 0,
            wordCount: editingAssignment.wordCount ? Number(editingAssignment.wordCount) : 0,
            costPerWord: editingAssignment.costPerWord ? Number(editingAssignment.costPerWord) : 0,
            writerCostPerWord: editingAssignment.writerCostPerWord ? Number(editingAssignment.writerCostPerWord) : 0,
            status: editingAssignment.status || AssignmentStatus.PENDING,
            type: editingAssignment.type || AssignmentType.ESSAY,
            level: editingAssignment.level || 'Undergraduate',
            isDissertation: editingAssignment.type === AssignmentType.DISSERTATION,
        } as Assignment;

        if (payload.isDissertation && !payload.chapters && payload.totalChapters) {
            payload.chapters = Array.from({ length: payload.totalChapters }, (_, i) => ({
                chapterNumber: i + 1,
                title: `Chapter ${i + 1}`,
                isCompleted: false,
                remarks: ''
            }));
        }

        try {
            await DataService.saveAssignment(payload);
            setIsModalOpen(false);
            setEditingAssignment({});
            await refreshData();
            addToast('Assignment saved successfully', 'success');
        } catch (error) {
            console.error("Failed to save assignment", error);
            addToast('Failed to save assignment', 'error');
        }
    };

    const handleStatusChange = async (assignment: Assignment, newStatus: AssignmentStatus) => {
        const updated = { ...assignment, status: newStatus };
        try {
            await DataService.saveAssignment(updated);
            if (newStatus === AssignmentStatus.COMPLETED && assignment.writerId && assignment.status !== AssignmentStatus.COMPLETED) {
                setRatingWriterId(String(assignment.writerId));
                setRatingStats({ quality: 5, punctuality: 5 });
                setIsRatingModalOpen(true);
            } else {
                await refreshData();
                addToast('Status updated', 'info');
            }
        } catch (error) {
            console.error("Failed to update status", error);
            addToast('Failed to update status', 'error');
        }
    };

    const handleSubmitRating = async () => {
        if (ratingWriterId) {
            try {
                await DataService.rateWriter(ratingWriterId, ratingStats.quality, ratingStats.punctuality);
                addToast('Writer rated successfully!', 'success');
                await refreshData();
                setIsRatingModalOpen(false);
                setRatingWriterId(null);
            } catch (error) {
                console.error("Failed to rate writer", error);
                addToast('Failed to rate writer', 'error');
            }
        }
    };

    const handleQuickSettle = async (e: React.MouseEvent, assignment: Assignment) => {
        e.stopPropagation();
        const due = assignment.price - assignment.paidAmount;
        if (due <= 0) return;

        if (confirm(`Mark remaining ${formatCurrency(due)} as received?`)) {
            const updated = { ...assignment, paidAmount: assignment.price };
            try {
                await DataService.saveAssignment(updated);
                await refreshData();
                addToast('Payment settled!', 'success');
            } catch (error) {
                console.error("Failed to settle payment", error);
                addToast('Failed to settle payment', 'error');
            }
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfig({ isOpen: true, type: 'single', id });
    };

    const handleBulkDelete = () => {
        if (!selectedIds.size) return;
        setDeleteConfig({ isOpen: true, type: 'bulk' });
    };

    const handleBulkStatusChange = async () => {
        if (!selectedIds.size || !bulkStatusValue) return;
        try {
            for (const id of selectedIds) {
                const assignment = assignments.find(a => a.id === id);
                if (assignment) await DataService.saveAssignment({ ...assignment, status: bulkStatusValue as any });
            }
            await refreshData();
            setSelectedIds(new Set());
            setBulkAction(null);
            setBulkStatusValue('');
            addToast(`Updated ${selectedIds.size} assignments`, 'success');
        } catch (error) {
            console.error("Bulk status change failed", error);
            addToast('Bulk update failed', 'error');
        }
    };

    const handleBulkWriterAssign = async () => {
        if (!selectedIds.size || !bulkWriterValue) return;
        try {
            for (const id of selectedIds) {
                const assignment = assignments.find(a => a.id === id);
                if (assignment) await DataService.saveAssignment({ ...assignment, writerId: bulkWriterValue });
            }
            await refreshData();
            setSelectedIds(new Set());
            setBulkAction(null);
            setBulkWriterValue('');
            addToast(`Assigned writer to ${selectedIds.size} assignments`, 'success');
        } catch (error) {
            console.error("Bulk writer assign failed", error);
            addToast('Bulk assign failed', 'error');
        }
    };

    const saveAsTemplate = () => {
        if (!editingAssignment || !templateName) return;
        const template = {
            title: templateName,
            type: editingAssignment.type,
            subject: editingAssignment.subject,
            level: editingAssignment.level,
            priority: editingAssignment.priority,
            wordCount: editingAssignment.wordCount,
            costPerWord: editingAssignment.costPerWord,
            writerCostPerWord: editingAssignment.writerCostPerWord,
            description: editingAssignment.description
        };
        const updatedTemplates = [...templates, template];
        setTemplates(updatedTemplates);
        localStorage.setItem('assignmentTemplates', JSON.stringify(updatedTemplates));
        setShowTemplateModal(false);
        setTemplateName('');
        addToast('Template saved', 'success');
    };

    const loadTemplate = (template: Partial<Assignment>) => {
        setEditingAssignment({ ...template, id: '' });
        setIsModalOpen(true);
    };

    const executeDelete = async () => {
        try {
            if (deleteConfig.type === 'single' && deleteConfig.id) {
                await DataService.deleteAssignment(deleteConfig.id);
                addToast('Assignment deleted', 'success');
            } else if (deleteConfig.type === 'bulk') {
                for (const id of selectedIds) {
                    await DataService.deleteAssignment(id);
                }
                addToast(`${selectedIds.size} assignments deleted`, 'success');
                setSelectedIds(new Set());
            }
            await refreshData();
            setDeleteConfig({ ...deleteConfig, isOpen: false });
        } catch (error) {
            console.error("Failed to delete assignment(s)", error);
            addToast('Failed to delete assignment(s)', 'error');
        }
    };

    const handleArchive = async (assignment: Assignment) => {
        try {
            const updated = { ...assignment, isArchived: !assignment.isArchived };
            await DataService.saveAssignment(updated);
            await refreshData();
            addToast(assignment.isArchived ? 'Task unarchived' : 'Task archived', 'success');
        } catch (error) {
            console.error("Failed to archive assignment", error);
            addToast('Failed to archive assignment', 'error');
        }
    };

    const handleBulkArchive = async () => {
        if (!selectedIds.size) return;
        try {
            for (const id of selectedIds) {
                const assignment = assignments.find(a => a.id === id);
                if (assignment) await DataService.saveAssignment({ ...assignment, isArchived: !showArchived });
            }
            await refreshData();
            setSelectedIds(new Set());
            addToast(`${selectedIds.size} assignments ${showArchived ? 'unarchived' : 'archived'}`, 'success');
        } catch (error) {
            console.error("Bulk archive failed", error);
            addToast('Bulk archive failed', 'error');
        }
    };

    const duplicateAssignment = (assignment: Assignment) => {
        const duplicate: Partial<Assignment> = {
            ...assignment,
            id: '',
            title: `Copy of ${assignment.title}`,
            status: AssignmentStatus.PENDING,
            paidAmount: 0,
            writerPaidAmount: 0,
            createdAt: new Date().toISOString(),
        };
        setEditingAssignment(duplicate);
        setIsModalOpen(true);
    };

    // Bulk Actions
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredAssignments.map(a => a.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) newSet.add(id);
        else newSet.delete(id);
        setSelectedIds(newSet);
    };

    // Auto-calculate price
    useEffect(() => {
        if (isModalOpen && editingAssignment) {
            if (editingAssignment.wordCount && editingAssignment.costPerWord) {
                setEditingAssignment(prev => ({
                    ...prev,
                    price: (prev.wordCount || 0) * (prev.costPerWord || 0)
                }));
            }
            if (editingAssignment.wordCount && editingAssignment.writerCostPerWord) {
                setEditingAssignment(prev => ({
                    ...prev,
                    writerPrice: (prev.wordCount || 0) * (prev.writerCostPerWord || 0)
                }));
            }
        }
    }, [editingAssignment.wordCount, editingAssignment.costPerWord, editingAssignment.writerCostPerWord]);

    const filteredAssignments = React.useMemo(() => {
        return assignments
            .filter(a => {
                const student = students.find(s => s.id === a.studentId);
                const searchMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.subject.toLowerCase().includes(searchTerm.toLowerCase()) || (student && student.name.toLowerCase().includes(searchTerm.toLowerCase()));
                const statusMatch = statusFilter === 'all' || a.status === statusFilter;
                const priorityMatch = priorityFilter === 'all' || a.priority === priorityFilter;
                const isOverdue = new Date(a.deadline) < new Date() && a.status !== AssignmentStatus.COMPLETED;
                const overdueMatch = !isOverdueFilter || isOverdue;
                const archivedMatch = showArchived ? a.isArchived : !a.isArchived;
                return statusMatch && priorityMatch && searchMatch && overdueMatch && archivedMatch;
            })
            .sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'deadline': comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); break;
                    case 'createdAt': comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
                    case 'title': comparison = a.title.localeCompare(b.title); break;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [assignments, students, searchTerm, statusFilter, priorityFilter, isOverdueFilter, showArchived, sortBy, sortOrder]);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <AssignmentControlBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
                isOverdueFilter={isOverdueFilter}
                onOverdueFilterChange={setIsOverdueFilter}
                showArchived={showArchived}
                onShowArchivedChange={setShowArchived}
                selectedCount={selectedIds.size}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkWriterAssign={handleBulkWriterAssign}
                onBulkArchive={handleBulkArchive}
                onBulkDelete={handleBulkDelete}
                onClearSelection={() => setSelectedIds(new Set())}
                bulkAction={bulkAction}
                onBulkActionChange={setBulkAction}
                bulkStatusValue={bulkStatusValue}
                onBulkStatusValueChange={setBulkStatusValue}
                bulkWriterValue={bulkWriterValue}
                onBulkWriterValueChange={setBulkWriterValue}
                writers={writers}
                templates={templates}
                onNewClick={() => { setEditingAssignment({}); setIsModalOpen(true); }}
                onTemplateLoad={loadTemplate}
                sortBy={sortBy}
                onSortByChange={(val) => setSortBy(val as 'deadline' | 'createdAt' | 'title')}
                sortOrder={sortOrder}
                onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            />

            {/* Empty State */}
            {filteredAssignments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-secondary-100/30 rounded-apple-lg border border-dashed border-secondary-200 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                    <div className="bg-primary/10 p-6 rounded-full mb-4 shadow-ios-sm">
                        <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-secondary-900 mb-1 uppercase tracking-widest leading-none">No tasks found</h3>
                    <p className="text-[10px] font-bold text-secondary-400 mb-6 text-center max-w-xs uppercase tracking-widest">Try adjusting your filters or create a new assignment.</p>
                </div>
            )}

            {/* --- DESKTOP TABLE VIEW --- */}
            {viewMode === 'table' && filteredAssignments.length > 0 && (
                <AssignmentTable
                    assignments={filteredAssignments}
                    students={students}
                    writers={writers}
                    selectedIds={selectedIds}
                    onSelect={handleSelectOne}
                    onSelectAll={handleSelectAll}
                    onStatusChange={handleStatusChange}
                    onClick={(assignment) => { setEditingAssignment(assignment); setIsModalOpen(true); }}
                    onQuickSettle={handleQuickSettle}
                    getStatusStyles={getStatusStyles}
                    getPriorityColor={getPriorityColor}
                    formatCurrency={formatCurrency}
                />
            )}

            {/* --- MOBILE/BOARD VIEW --- */}
            {(viewMode === 'board' || window.innerWidth < 768) && (
                <AssignmentCards
                    assignments={filteredAssignments}
                    students={students}
                    writers={writers}
                    onClick={(assignment) => { setEditingAssignment(assignment); setIsModalOpen(true); }}
                    getStatusStyles={getStatusStyles}
                    getPriorityColor={getPriorityColor}
                    formatCurrency={formatCurrency}
                />
            )}

            {/* Edit/Create Modal */}
            <AssignmentFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assignment={editingAssignment}
                students={students}
                writers={writers}
                onAssignmentChange={setEditingAssignment}
                onSave={handleSave}
                onDelete={(id) => { setIsModalOpen(false); handleDelete(id); }}
                onDuplicate={duplicateAssignment}
                onArchive={handleArchive}
                onSaveTemplate={() => { setTemplateName(editingAssignment.title || 'Untitled Template'); setShowTemplateModal(true); }}
                isAddingStudent={isAddingStudent}
                onIsAddingStudentChange={setIsAddingStudent}
                newStudentName={newStudentName}
                onNewStudentNameChange={setNewStudentName}
                onQuickAddStudent={handleQuickAddStudent}
                isAddingWriter={isAddingWriter}
                onIsAddingWriterChange={setIsAddingWriter}
                newWriterName={newWriterName}
                onNewWriterNameChange={setNewWriterName}
                onQuickAddWriter={handleQuickAddWriter}
                isReassigning={isReassigning}
                onIsReassigningChange={setIsReassigning}
                onReassignWriter={handleReassignWriter}
                formatCurrency={formatCurrency}
            />

            {/* Template Naming Modal */}
            <TemplateModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                templateName={templateName}
                onNameChange={setTemplateName}
                onSave={saveAsTemplate}
            />

            {/* Rating Modal */}
            <AssignmentRatingModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                ratingStats={ratingStats}
                onRatingChange={setRatingStats}
                onSubmit={handleSubmitRating}
            />

            {/* Delete Confirmation Modal */}
            <AssignmentDeleteModal
                isOpen={deleteConfig.isOpen}
                onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                onConfirm={executeDelete}
                count={deleteConfig.type === 'bulk' ? selectedIds.size : undefined}
            />
        </div>
    );
};

export default AssignmentsPage;
