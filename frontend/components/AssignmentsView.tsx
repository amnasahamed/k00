import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Assignment, AssignmentStatus, AssignmentType, AssignmentPriority, Student, Writer } from '../types';
import * as DataService from '../services/dataService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import Modal from './ui/Modal';
import { useToast } from './Layout';

const AssignmentsView: React.FC = () => {
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
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

    const getStatusStyles = (status: AssignmentStatus) => {
        switch (status) {
            case AssignmentStatus.COMPLETED: return { card: '!bg-emerald-50/80 border border-emerald-100 shadow-sm', row: 'bg-emerald-50/30 hover:bg-emerald-50/60', select: 'bg-emerald-100 text-emerald-800' };
            case AssignmentStatus.IN_PROGRESS: return { card: '!bg-blue-50/80 border border-blue-100 shadow-sm', row: 'bg-blue-50/30 hover:bg-blue-50/60', select: 'bg-blue-100 text-blue-700' };
            case AssignmentStatus.REVIEW: return { card: '!bg-amber-50/80 border border-amber-100 shadow-sm', row: 'bg-amber-50/30 hover:bg-amber-50/60', select: 'bg-amber-100 text-amber-800' };
            case AssignmentStatus.CANCELLED: return { card: '!bg-red-50/80 border border-red-100 shadow-sm', row: 'bg-red-50/30 hover:bg-red-50/60', select: 'bg-red-100 text-red-700' };
            default: return { card: '!bg-white border-transparent', row: 'hover:bg-slate-50', select: 'bg-slate-100 text-slate-700' };
        }
    };

    const getPriorityColor = (priority: AssignmentPriority) => {
        switch (priority) {
            case AssignmentPriority.HIGH: return 'danger';
            case AssignmentPriority.MEDIUM: return 'warning';
            case AssignmentPriority.LOW: return 'success';
            default: return 'neutral';
        }
    };

    const filteredAssignments = assignments
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

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col gap-4 sticky top-14 md:static z-20 bg-background/95 backdrop-blur-sm py-2">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        />
                    </div>
                    {/* View Toggle (Desktop Only) */}
                    <div className="hidden md:flex bg-secondary-100 p-1 rounded-apple">
                        <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-apple text-sm font-semibold transition-all ${viewMode === 'table' ? 'bg-white shadow-ios text-secondary-900' : 'text-secondary-500 hover:text-secondary-700'}`}>Table</button>
                        <button onClick={() => setViewMode('board')} className={`px-4 py-1.5 rounded-apple text-sm font-semibold transition-all ${viewMode === 'board' ? 'bg-white shadow-ios text-secondary-900' : 'text-secondary-500 hover:text-secondary-700'}`}>Board</button>
                    </div>

                    <Button onClick={() => { setEditingAssignment({}); setIsModalOpen(true); }} className="whitespace-nowrap">+ New</Button>

                    {templates.length > 0 && (
                        <div className="relative group">
                            <Button variant="secondary" className="whitespace-nowrap">Templates ({templates.length})</Button>
                            <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
                                {templates.map((template, idx) => (
                                    <button key={idx} onClick={() => loadTemplate(template)} className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0">
                                        <div className="font-medium text-sm text-slate-900">{template.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">{template.type} • {template.subject}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Bar */}
                {selectedIds.size > 0 && (
                    <div className="flex flex-col gap-2 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-bold text-blue-800">{selectedIds.size} Selected</span>
                            <div className="h-4 w-[1px] bg-blue-200"></div>
                            <button onClick={() => setBulkAction('status')} className="text-sm font-semibold text-primary-600 hover:text-primary-800">Change Status</button>
                            <button onClick={() => setBulkAction('writer')} className="text-sm font-semibold text-primary-600 hover:text-primary-800">Assign Writer</button>
                            <button onClick={handleBulkArchive} className="text-sm font-semibold text-secondary-600 hover:text-secondary-800">{showArchived ? 'Unarchive' : 'Archive'}</button>
                            <button onClick={handleBulkDelete} className="text-sm font-semibold text-danger-600 hover:text-danger-800">Delete</button>
                            <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-sm font-semibold text-secondary-500">Cancel</button>
                        </div>
                        {bulkAction === 'status' && (
                            <div className="flex items-center gap-2">
                                <select value={bulkStatusValue} onChange={(e) => setBulkStatusValue(e.target.value)} className="flex-1 bg-white border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select Status</option>
                                    {Object.values(AssignmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <Button size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatusValue}>Apply</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setBulkAction(null); setBulkStatusValue(''); }}>Cancel</Button>
                            </div>
                        )}
                        {bulkAction === 'writer' && (
                            <div className="flex items-center gap-2">
                                <Select value={bulkWriterValue} onChange={(e) => setBulkWriterValue(e.target.value)} options={[
                                    { value: '', label: 'Select Writer' },
                                    ...writers.map(w => ({ value: w.id, label: w.name }))
                                ]} className="flex-1" />
                                <Button size="sm" onClick={handleBulkWriterAssign} disabled={!bulkWriterValue}>Apply</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setBulkAction(null); setBulkWriterValue(''); }}>Cancel</Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                    {isOverdueFilter && (
                        <button onClick={() => setIsOverdueFilter(false)} className="bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 flex-shrink-0">
                            Overdue Only <span className="text-red-400">×</span>
                        </button>
                    )}
                    {showArchived ? (
                        <button onClick={() => setShowArchived(false)} className="bg-slate-600 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 flex-shrink-0">
                            📦 Archived <span className="text-slate-300">×</span>
                        </button>
                    ) : (
                        <button onClick={() => setShowArchived(true)} className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex-shrink-0">
                            📦 View Archived
                        </button>
                    )}

                    <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} options={[
                        { value: 'all', label: 'Priority: All' },
                        ...Object.values(AssignmentPriority).map(p => ({ value: p, label: p }))
                    ]} className="w-44" />
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
                        { value: 'all', label: 'Status: All' },
                        ...Object.values(AssignmentStatus).map(s => ({ value: s, label: s }))
                    ]} className="w-44" />
                    <div className="flex items-center gap-1 bg-white shadow-ios rounded-apple px-2 py-1 flex-shrink-0 border border-secondary-100/50">
                        <select className="border-none text-sm text-secondary-700 font-semibold focus:ring-0 bg-transparent pr-1 cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                            <option value="deadline">Sort: Deadline</option>
                            <option value="createdAt">Sort: Created</option>
                            <option value="title">Sort: Title</option>
                        </select>
                        <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-1 px-2 hover:bg-secondary-100 rounded-lg transition-apple font-bold text-secondary-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredAssignments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-blue-50 p-6 rounded-full mb-4">
                        <svg className="w-12 h-12 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No tasks found</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-xs">Try adjusting your filters or create a new assignment.</p>
                </div>
            )}

            {/* --- DESKTOP TABLE VIEW --- */}
            {viewMode === 'table' && filteredAssignments.length > 0 && (
                <div className="hidden md:block bg-white rounded-2xl shadow-card overflow-hidden border border-secondary-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-secondary-100 bg-secondary-50/50">
                                <th className="p-4 w-10 text-center">
                                    <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary/20" checked={filteredAssignments.length > 0 && selectedIds.size === filteredAssignments.length} onChange={(e) => handleSelectAll(e.target.checked)} />
                                </th>
                                <th className="p-4 text-xs font-bold text-secondary-400 uppercase tracking-wider">Title / Subject</th>
                                <th className="p-4 text-xs font-bold text-secondary-400 uppercase tracking-wider">People</th>
                                <th className="p-4 text-xs font-bold text-secondary-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-secondary-400 uppercase tracking-wider">Words / Rate</th>
                                <th className="p-4 text-xs font-bold text-secondary-400 uppercase tracking-wider">Due Date</th>
                                <th className="p-4 text-xs font-bold text-green-600 uppercase tracking-wider text-right border-l border-secondary-100">Student (In)</th>
                                <th className="p-4 text-xs font-bold text-red-500 uppercase tracking-wider text-right border-l border-secondary-100">Writer (Out)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredAssignments.map(assignment => {
                                const student = students.find(s => s.id === assignment.studentId);
                                const writer = writers.find(w => w.id === assignment.writerId);
                                const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== AssignmentStatus.COMPLETED;
                                const styles = getStatusStyles(assignment.status);

                                return (
                                    <tr
                                        key={assignment.id}
                                        className={`transition-colors group ${styles.row} ${selectedIds.has(assignment.id) ? 'bg-primary-50' : ''}`}
                                        onClick={() => { setEditingAssignment(assignment); setIsModalOpen(true); }}
                                    >
                                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                            <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary/20" checked={selectedIds.has(assignment.id)} onChange={(e) => handleSelectOne(assignment.id, e.target.checked)} />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-semibold text-secondary-900">{assignment.title}</div>
                                                {assignment.documentLink && (
                                                    <a href={assignment.documentLink} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700" title="Open Document" onClick={e => e.stopPropagation()}>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </a>
                                                )}
                                            </div>
                                            <div className="text-xs text-secondary-500">{assignment.type} • {assignment.subject}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-secondary-900">{student?.name}</div>
                                            {writer && <div className="text-xs text-secondary-400">Writer: {writer.name}</div>}
                                        </td>
                                        <td className="p-4" onClick={e => e.stopPropagation()}>
                                            <select
                                                className={`text-xs font-bold uppercase rounded px-2 py-1 border-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${styles.select}`}
                                                value={assignment.status}
                                                onChange={(e) => handleStatusChange(assignment, e.target.value as AssignmentStatus)}
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
                                        <td className="p-4 text-right border-l border-secondary-200/50 bg-green-50/20">
                                            <div className="text-sm font-bold text-secondary-900">{formatCurrency(assignment.price)}</div>
                                            {assignment.paidAmount < assignment.price ? (
                                                <button
                                                    onClick={(e) => handleQuickSettle(e, assignment)}
                                                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                                                >
                                                    Due: {formatCurrency(assignment.price - assignment.paidAmount)}
                                                </button>
                                            ) : <span className="text-xs font-medium text-green-500">Paid ✓</span>}
                                        </td>
                                        <td className="p-4 text-right border-l border-secondary-200/50 bg-red-50/20">
                                            {assignment.writerPrice ? (
                                                <>
                                                    <div className="text-sm font-bold text-secondary-900">{formatCurrency(assignment.writerPrice)}</div>
                                                    {(assignment.writerPaidAmount || 0) < assignment.writerPrice ? (
                                                        <span className="text-xs font-medium text-red-500">Due: {formatCurrency(assignment.writerPrice - (assignment.writerPaidAmount || 0))}</span>
                                                    ) : <span className="text-xs font-medium text-green-500">Paid ✓</span>}
                                                </>
                                            ) : <span className="text-xs text-secondary-300">-</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MOBILE/BOARD VIEW --- */}
            {(viewMode === 'board' || window.innerWidth < 768) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssignments.map(assignment => {
                        const student = students.find(s => s.id === assignment.studentId);
                        const writer = writers.find(w => w.id === assignment.writerId);
                        const styles = getStatusStyles(assignment.status);
                        const isOverdue = new Date(assignment.deadline) < new Date() && assignment.status !== AssignmentStatus.COMPLETED;

                        return (
                            <div key={assignment.id} className={`rounded-xl p-4 transition-all cursor-pointer ${styles.card}`} onClick={() => { setEditingAssignment(assignment); setIsModalOpen(true); }}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-secondary-900 text-sm line-clamp-2">{assignment.title}</h3>
                                        <p className="text-xs text-secondary-500">{student?.name}</p>
                                    </div>
                                    <Badge variant={getPriorityColor(assignment.priority) as any} size="sm">{assignment.priority}</Badge>
                                </div>
                                <div className="flex gap-2 text-xs text-secondary-500 mb-3">
                                    <span className="bg-white/50 px-1.5 py-0.5 rounded">{assignment.type}</span>
                                    <span className={isOverdue ? 'text-red-500 font-bold' : ''}>{new Date(assignment.deadline).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-black/5">
                                    <div className="text-xs font-bold text-secondary-700">
                                        {formatCurrency(assignment.price)}
                                        {assignment.paidAmount < assignment.price && <span className="text-red-500 ml-1">(Due)</span>}
                                    </div>
                                    {writer ? (
                                        <div className="text-xs text-secondary-500 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span> {writer.name}
                                        </div>
                                    ) : <span className="text-xs text-red-400 italic">Unassigned</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit/Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAssignment.id ? "Edit Assignment" : "New Assignment"} size="xl">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Core Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider border-b border-secondary-100 pb-2">Core Details</h4>
                            <Input label="Title / Topic" required value={editingAssignment.title || ''} onChange={e => setEditingAssignment({ ...editingAssignment, title: e.target.value })} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Type</label>
                                    <select className="w-full bg-secondary-50 border-secondary-200 rounded-lg text-sm" value={editingAssignment.type || AssignmentType.ESSAY} onChange={e => setEditingAssignment({ ...editingAssignment, type: e.target.value as AssignmentType })}>
                                        {Object.values(AssignmentType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Subject</label>
                                    <Input value={editingAssignment.subject || ''} onChange={e => setEditingAssignment({ ...editingAssignment, subject: e.target.value })} placeholder="e.g. History" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Level</label>
                                    <select className="w-full bg-secondary-50 border-secondary-200 rounded-lg text-sm" value={editingAssignment.level || 'Undergraduate'} onChange={e => setEditingAssignment({ ...editingAssignment, level: e.target.value })}>
                                        <option value="Undergraduate">Undergraduate</option>
                                        <option value="Master's">Master's</option>
                                        <option value="PhD">PhD</option>
                                        <option value="Diploma">Diploma</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Priority</label>
                                    <select className="w-full bg-secondary-50 border-secondary-200 rounded-lg text-sm" value={editingAssignment.priority || AssignmentPriority.MEDIUM} onChange={e => setEditingAssignment({ ...editingAssignment, priority: e.target.value as AssignmentPriority })}>
                                        {Object.values(AssignmentPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-secondary-600">Student</label>
                                {isAddingStudent ? (
                                    <div className="flex gap-2">
                                        <Input className="flex-1" placeholder="New Student Name" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                                        <Button type="button" size="sm" onClick={handleQuickAddStudent}>Save</Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingStudent(false)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select className="flex-1 bg-secondary-50 border-secondary-200 rounded-lg text-sm" value={editingAssignment.studentId || ''} onChange={e => {
                                            if (e.target.value === 'new') setIsAddingStudent(true);
                                            else setEditingAssignment({ ...editingAssignment, studentId: e.target.value });
                                        }}>
                                            <option value="">Select Student</option>
                                            <option value="new" className="font-bold text-primary-600">+ Add New Student</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <Input label="Deadline" type="date" required value={editingAssignment.deadline ? new Date(editingAssignment.deadline).toISOString().split('T')[0] : ''} onChange={e => setEditingAssignment({ ...editingAssignment, deadline: new Date(e.target.value).toISOString() })} />

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-secondary-600">Description / Instructions</label>
                                <textarea className="w-full bg-secondary-50 border-secondary-200 rounded-lg text-sm min-h-[100px]" value={editingAssignment.description || ''} onChange={e => setEditingAssignment({ ...editingAssignment, description: e.target.value })}></textarea>
                            </div>
                            <Input label="Document Link (URL)" value={editingAssignment.documentLink || ''} onChange={e => setEditingAssignment({ ...editingAssignment, documentLink: e.target.value })} placeholder="https://..." />
                        </div>

                        {/* RIGHT COLUMN: Financials & Writer */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider border-b border-secondary-100 pb-2">Financials & Assignee</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Word Count" type="number" value={editingAssignment.wordCount} onChange={e => setEditingAssignment({ ...editingAssignment, wordCount: Number(e.target.value) })} />
                                <Input label="Student Rate/Word" type="number" step="0.1" value={editingAssignment.costPerWord} onChange={e => setEditingAssignment({ ...editingAssignment, costPerWord: Number(e.target.value) })} />
                            </div>

                            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-3">
                                <h5 className="text-xs font-bold text-green-700 uppercase">Incoming (Student)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Total Price" type="number" value={editingAssignment.price} onChange={e => setEditingAssignment({ ...editingAssignment, price: Number(e.target.value) })} />
                                    <Input label="Paid Amount" type="number" value={editingAssignment.paidAmount} onChange={e => setEditingAssignment({ ...editingAssignment, paidAmount: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-secondary-600">Assign Writer</label>
                                {isAddingWriter ? (
                                    <div className="flex gap-2">
                                        <Input className="flex-1" placeholder="New Writer Name" value={newWriterName} onChange={e => setNewWriterName(e.target.value)} />
                                        <Button type="button" size="sm" onClick={handleQuickAddWriter}>Save</Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingWriter(false)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select className="flex-1 bg-secondary-50 border-secondary-200 rounded-lg text-sm" value={editingAssignment.writerId || ''} onChange={e => {
                                            if (e.target.value === 'new') setIsAddingWriter(true);
                                            else if (editingAssignment.writerId && e.target.value !== editingAssignment.writerId) {
                                                if (confirm('Reassigning will start fresh for the new writer. Move previous payments to sunk costs?')) {
                                                    handleReassignWriter();
                                                    setEditingAssignment(prev => ({ ...prev, writerId: e.target.value }));
                                                }
                                            } else {
                                                setEditingAssignment({ ...editingAssignment, writerId: e.target.value });
                                            }
                                        }}>
                                            <option value="">Unassigned</option>
                                            <option value="new" className="font-bold text-primary-600">+ Add New Writer</option>
                                            {writers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                        </select>
                                        {/* {editingAssignment.writerId && <Button type="button" size="sm" variant="secondary" onClick={() => setEditingAssignment({...editingAssignment, writerId: ''})}>Unassign</Button>} */}
                                    </div>
                                )}
                            </div>

                            {editingAssignment.writerId && (
                                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-3">
                                    <h5 className="text-xs font-bold text-red-700 uppercase">Outgoing (Writer)</h5>
                                    <Input label="Writer Rate/Word" type="number" step="0.1" value={editingAssignment.writerCostPerWord} onChange={e => setEditingAssignment({ ...editingAssignment, writerCostPerWord: Number(e.target.value) })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Writer Fee" type="number" value={editingAssignment.writerPrice} onChange={e => setEditingAssignment({ ...editingAssignment, writerPrice: Number(e.target.value) })} />
                                        <Input label="Paid to Writer" type="number" value={editingAssignment.writerPaidAmount} onChange={e => setEditingAssignment({ ...editingAssignment, writerPaidAmount: Number(e.target.value) })} />
                                    </div>
                                    {editingAssignment.sunkCosts ? (
                                        <div className="text-xs text-red-500 font-medium">Sunk Costs (Reassignments): {formatCurrency(editingAssignment.sunkCosts)}</div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-secondary-100 mt-4">
                        <div className="flex gap-2">
                            {editingAssignment.id && (
                                <>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => { setIsModalOpen(false); handleDelete(String(editingAssignment.id!)) }}>Delete</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => duplicateAssignment(editingAssignment as Assignment)}>Duplicate</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleArchive(editingAssignment as Assignment)}>{editingAssignment.isArchived ? 'Unarchive' : 'Archive'}</Button>
                                </>
                            )}
                            {!editingAssignment.id && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setTemplateName(editingAssignment.title || 'Untitled Template'); setShowTemplateModal(true); }}>Save as Template</Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Assignment</Button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Template Naming Modal */}
            <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Save As Template" size="sm">
                <div className="space-y-4">
                    <Input label="Template Name" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Standard Dissertation" />
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
                        <Button onClick={saveAsTemplate}>Save</Button>
                    </div>
                </div>
            </Modal>

            {/* Rating Modal */}
            <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Rate Writer Performance" size="sm">
                <div className="space-y-6">
                    <p className="text-sm text-secondary-600">Please rate the writer's performance on this finished task.</p>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-700">Quality</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setRatingStats({ ...ratingStats, quality: star })} className={`text-2xl ${star <= ratingStats.quality ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-secondary-700">Punctuality</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button" onClick={() => setRatingStats({ ...ratingStats, punctuality: star })} className={`text-2xl ${star <= ratingStats.punctuality ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsRatingModalOpen(false)}>Skip</Button>
                        <Button onClick={handleSubmitRating}>Submit Rating</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteConfig.isOpen} onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })} title="Confirm Delete" size="sm">
                <div className="space-y-4">
                    <p className="text-secondary-600">Are you sure you want to delete {deleteConfig.type === 'bulk' ? `these ${selectedIds.size} assignments` : 'this assignment'}? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}>Cancel</Button>
                        <Button variant="danger" onClick={executeDelete}>Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AssignmentsView;