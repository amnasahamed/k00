import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Assignment, AssignmentStatus, AssignmentType, Student, Writer } from '../../types';
import { useToast } from '../../providers/ToastProvider';
import { formatCurrency } from '../../utils/format';
import { getStatusStyles, getPriorityColor } from '../../utils/statusStyles';
import { useAssignments, useSaveAssignment, useDeleteAssignment } from '../../hooks/useAssignments';
import { useStudents, useSaveStudent } from '../../hooks/useStudents';
import { useWriters, useSaveWriter, useRateWriter } from '../../hooks/useWriters';
import { useAssignmentFilters } from './hooks/useAssignmentFilters';
import { useAssignmentModals, useAssignmentSelection } from './hooks/useAssignmentUiState';
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

  const { data: assignments = [], isError: assignmentsError } = useAssignments();
  const { data: students = [], isError: studentsError } = useStudents();
  const { data: writers = [], isError: writersError } = useWriters();

  const saveAssignment = useSaveAssignment();
  const deleteAssignment = useDeleteAssignment();
  const saveStudent = useSaveStudent();
  const saveWriter = useSaveWriter();
  const rateWriter = useRateWriter();

  const filters = useAssignmentFilters(assignments, students);
  const selection = useAssignmentSelection();
  const ui = useAssignmentModals();

  useEffect(() => {
    if (assignmentsError || studentsError || writersError) {
      addToast('Failed to load data', 'error');
    }
  }, [assignmentsError, studentsError, writersError, addToast]);

  useEffect(() => {
    if (!location.state) return;
    const state = location.state as Record<string, string>;
    if (state.filterStatus) filters.setStatusFilter(state.filterStatus);
    if (state.filterSpecial === 'overdue') filters.setIsOverdueFilter(true);
    if (state.filterType === 'Dissertation') filters.setSearchTerm('Dissertation');
    if (state.highlightId) {
      const element = document.getElementById(state.highlightId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (ui.isModalOpen && ui.editingAssignment.wordCount && ui.editingAssignment.writerCostPerWord) {
      ui.setEditingAssignment((prev) => ({
        ...prev,
        writerPrice: (prev.wordCount || 0) * (prev.writerCostPerWord || 0),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.editingAssignment.wordCount, ui.editingAssignment.writerCostPerWord, ui.isModalOpen]);

  const handleQuickAddStudent = async () => {
    if (!ui.newStudentName.trim()) return;
    const newStudent: Student = {
      id: '',
      name: ui.newStudentName.trim(),
      email: `${ui.newStudentName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: `9${Date.now().toString().slice(-9)}`,
      university: 'Unknown',
    };
    try {
      const saved = await saveStudent.mutateAsync(newStudent);
      ui.setEditingAssignment((prev) => ({ ...prev, studentId: saved.id }));
      ui.setNewStudentName('');
      ui.setIsAddingStudent(false);
      addToast(`Created student: ${saved.name}`, 'success');
    } catch (error) {
      addToast('Failed to add student: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const handleQuickAddWriter = async () => {
    if (!ui.newWriterName.trim()) return;
    const newWriter: Writer = {
      id: '',
      name: ui.newWriterName.trim(),
      contact: `writer.${ui.newWriterName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      specialty: 'General',
    };
    try {
      const saved = await saveWriter.mutateAsync(newWriter);
      ui.setEditingAssignment((prev) => ({ ...prev, writerId: saved.id }));
      ui.setNewWriterName('');
      ui.setIsAddingWriter(false);
      addToast(`Created writer: ${saved.name}`, 'success');
    } catch (error) {
      addToast('Failed to add writer: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const handleReassignWriter = () => {
    const currentPaid = ui.editingAssignment.writerPaidAmount || 0;
    const currentSunk = ui.editingAssignment.sunkCosts || 0;
    ui.setEditingAssignment((prev) => ({
      ...prev,
      sunkCosts: currentSunk + currentPaid,
      writerId: '',
      writerPaidAmount: 0,
      writerPrice: 0,
      writerCostPerWord: 0,
    }));
    ui.setIsReassigning(false);
    addToast('Writer unassigned. Previous payments moved to Sunk Costs.', 'info');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ui.editingAssignment.studentId || !ui.editingAssignment.title) {
      addToast('Student and Title are required', 'error');
      return;
    }

    const payload = {
      ...ui.editingAssignment,
      price: ui.editingAssignment.price ? Number(ui.editingAssignment.price) : 0,
      paidAmount: ui.editingAssignment.paidAmount ? Number(ui.editingAssignment.paidAmount) : 0,
      writerPrice: ui.editingAssignment.writerPrice ? Number(ui.editingAssignment.writerPrice) : 0,
      writerPaidAmount: ui.editingAssignment.writerPaidAmount ? Number(ui.editingAssignment.writerPaidAmount) : 0,
      sunkCosts: ui.editingAssignment.sunkCosts ? Number(ui.editingAssignment.sunkCosts) : 0,
      wordCount: ui.editingAssignment.wordCount ? Number(ui.editingAssignment.wordCount) : 0,
      costPerWord: ui.editingAssignment.costPerWord ? Number(ui.editingAssignment.costPerWord) : 0,
      writerCostPerWord: ui.editingAssignment.writerCostPerWord ? Number(ui.editingAssignment.writerCostPerWord) : 0,
      status: ui.editingAssignment.status || AssignmentStatus.PENDING,
      type: ui.editingAssignment.type || AssignmentType.ESSAY,
      level: ui.editingAssignment.level || 'Undergraduate',
      isDissertation: ui.editingAssignment.type === AssignmentType.DISSERTATION,
    } as Assignment;

    if (payload.isDissertation && !payload.chapters && payload.totalChapters) {
      payload.chapters = Array.from({ length: payload.totalChapters }, (_, i) => ({
        chapterNumber: i + 1,
        title: `Chapter ${i + 1}`,
        isCompleted: false,
        remarks: '',
      }));
    }

    try {
      await saveAssignment.mutateAsync(payload);
      ui.setIsModalOpen(false);
      ui.setEditingAssignment({});
      selection.clearSelection();
      addToast('Assignment saved successfully', 'success');
    } catch {
      addToast('Failed to save assignment', 'error');
    }
  };

  const handleStatusChange = async (assignment: Assignment, newStatus: AssignmentStatus) => {
    try {
      await saveAssignment.mutateAsync({ ...assignment, status: newStatus });
      if (newStatus === AssignmentStatus.COMPLETED && assignment.writerId && assignment.status !== AssignmentStatus.COMPLETED) {
        ui.setRatingWriterId(String(assignment.writerId));
        ui.setRatingStats({ quality: 5, punctuality: 5 });
        ui.setIsRatingModalOpen(true);
      } else {
        addToast('Status updated', 'info');
      }
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  const handleSubmitRating = async () => {
    if (!ui.ratingWriterId) return;
    try {
      await rateWriter.mutateAsync({
        writerId: ui.ratingWriterId,
        quality: ui.ratingStats.quality,
        punctuality: ui.ratingStats.punctuality,
      });
      addToast('Writer rated successfully!', 'success');
      ui.setIsRatingModalOpen(false);
      ui.setRatingWriterId(null);
    } catch {
      addToast('Failed to rate writer', 'error');
    }
  };

  const handleQuickSettle = async (e: React.MouseEvent, assignment: Assignment) => {
    e.stopPropagation();
    const due = assignment.price - assignment.paidAmount;
    if (due <= 0) return;
    if (!confirm(`Mark remaining ${formatCurrency(due)} as received?`)) return;
    try {
      await saveAssignment.mutateAsync({ ...assignment, paidAmount: assignment.price });
      addToast('Payment settled!', 'success');
    } catch {
      addToast('Failed to settle payment', 'error');
    }
  };

  const runBulk = async (
    updater: (assignment: Assignment) => Assignment,
    successMessage: string
  ) => {
    try {
      for (const id of selection.selectedIds) {
        const assignment = assignments.find((a) => a.id === id);
        if (assignment) await saveAssignment.mutateAsync(updater(assignment));
      }
      selection.clearSelection();
      ui.setBulkAction(null);
      ui.setBulkStatusValue('');
      ui.setBulkWriterValue('');
      addToast(successMessage, 'success');
    } catch {
      addToast('Bulk update failed', 'error');
    }
  };

  const handleBulkStatusChange = async () => {
    if (!selection.selectedIds.size || !ui.bulkStatusValue) return;
    await runBulk(
      (a) => ({ ...a, status: ui.bulkStatusValue as AssignmentStatus }),
      `Updated ${selection.selectedIds.size} assignments`
    );
  };

  const handleBulkWriterAssign = async () => {
    if (!selection.selectedIds.size || !ui.bulkWriterValue) return;
    await runBulk(
      (a) => ({ ...a, writerId: ui.bulkWriterValue }),
      `Assigned writer to ${selection.selectedIds.size} assignments`
    );
  };

  const handleBulkArchive = async () => {
    if (!selection.selectedIds.size) return;
    await runBulk(
      (a) => ({ ...a, isArchived: !filters.showArchived }),
      `${selection.selectedIds.size} assignments ${filters.showArchived ? 'unarchived' : 'archived'}`
    );
  };

  const saveAsTemplate = () => {
    if (!ui.editingAssignment || !ui.templateName) return;
    const template = {
      title: ui.templateName,
      type: ui.editingAssignment.type,
      subject: ui.editingAssignment.subject,
      level: ui.editingAssignment.level,
      priority: ui.editingAssignment.priority,
      wordCount: ui.editingAssignment.wordCount,
      costPerWord: ui.editingAssignment.costPerWord,
      writerCostPerWord: ui.editingAssignment.writerCostPerWord,
      description: ui.editingAssignment.description,
    };
    ui.persistTemplates([...ui.templates, template]);
    ui.setShowTemplateModal(false);
    ui.setTemplateName('');
    addToast('Template saved', 'success');
  };

  const executeDelete = async () => {
    try {
      if (ui.deleteConfig.type === 'single' && ui.deleteConfig.id) {
        await deleteAssignment.mutateAsync(ui.deleteConfig.id);
        addToast('Assignment deleted', 'success');
      } else if (ui.deleteConfig.type === 'bulk') {
        for (const id of selection.selectedIds) {
          await deleteAssignment.mutateAsync(id);
        }
        addToast(`${selection.selectedIds.size} assignments deleted`, 'success');
        selection.clearSelection();
      }
      ui.setDeleteConfig({ ...ui.deleteConfig, isOpen: false });
    } catch {
      addToast('Failed to delete assignment(s)', 'error');
    }
  };

  const handleArchive = async (assignment: Assignment) => {
    try {
      await saveAssignment.mutateAsync({ ...assignment, isArchived: !assignment.isArchived });
      addToast(assignment.isArchived ? 'Task unarchived' : 'Task archived', 'success');
    } catch {
      addToast('Failed to archive assignment', 'error');
    }
  };

  const duplicateAssignment = (assignment: Assignment) => {
    ui.setEditingAssignment({
      ...assignment,
      id: '',
      title: `Copy of ${assignment.title}`,
      status: AssignmentStatus.PENDING,
      paidAmount: 0,
      writerPaidAmount: 0,
      createdAt: new Date().toISOString(),
    });
    ui.setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <AssignmentControlBar
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        viewMode={ui.viewMode}
        onViewModeChange={ui.setViewMode}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        priorityFilter={filters.priorityFilter}
        onPriorityFilterChange={filters.setPriorityFilter}
        isOverdueFilter={filters.isOverdueFilter}
        onOverdueFilterChange={filters.setIsOverdueFilter}
        showArchived={filters.showArchived}
        onShowArchivedChange={filters.setShowArchived}
        selectedCount={selection.selectedIds.size}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkWriterAssign={handleBulkWriterAssign}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={() => {
          if (selection.selectedIds.size) ui.setDeleteConfig({ isOpen: true, type: 'bulk' });
        }}
        onClearSelection={selection.clearSelection}
        bulkAction={ui.bulkAction}
        onBulkActionChange={ui.setBulkAction}
        bulkStatusValue={ui.bulkStatusValue}
        onBulkStatusValueChange={ui.setBulkStatusValue}
        bulkWriterValue={ui.bulkWriterValue}
        onBulkWriterValueChange={ui.setBulkWriterValue}
        writers={writers}
        templates={ui.templates}
        onNewClick={() => {
          ui.setEditingAssignment({});
          ui.setIsModalOpen(true);
        }}
        onTemplateLoad={(template) => {
          ui.setEditingAssignment({ ...template, id: '' });
          ui.setIsModalOpen(true);
        }}
        sortBy={filters.sortBy}
        onSortByChange={(val) => filters.setSortBy(val as 'deadline' | 'createdAt' | 'title')}
        sortOrder={filters.sortOrder}
        onSortOrderToggle={() => filters.setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc')}
      />

      {filters.filteredAssignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary-100/30 rounded-apple-lg border border-dashed border-secondary-200 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
          <div className="bg-primary/10 p-6 rounded-full mb-4 shadow-ios-sm">
            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-secondary-900 mb-1 uppercase tracking-widest leading-none">No tasks found</h3>
          <p className="text-[10px] font-bold text-secondary-400 mb-6 text-center max-w-xs uppercase tracking-widest">
            Try adjusting your filters or create a new assignment.
          </p>
        </div>
      )}

      {ui.viewMode === 'table' && filters.filteredAssignments.length > 0 && (
        <AssignmentTable
          assignments={filters.filteredAssignments}
          students={students}
          writers={writers}
          selectedIds={selection.selectedIds}
          onSelect={selection.handleSelectOne}
          onSelectAll={(checked) =>
            selection.handleSelectAll(
              filters.filteredAssignments.map((a) => a.id),
              checked
            )
          }
          onStatusChange={handleStatusChange}
          onClick={(assignment) => {
            ui.setEditingAssignment(assignment);
            ui.setIsModalOpen(true);
          }}
          onQuickSettle={handleQuickSettle}
          getStatusStyles={getStatusStyles}
          getPriorityColor={getPriorityColor}
          formatCurrency={formatCurrency}
        />
      )}

      {(ui.viewMode === 'board' || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
        <AssignmentCards
          assignments={filters.filteredAssignments}
          students={students}
          writers={writers}
          onClick={(assignment) => {
            ui.setEditingAssignment(assignment);
            ui.setIsModalOpen(true);
          }}
          getStatusStyles={getStatusStyles}
          getPriorityColor={getPriorityColor}
          formatCurrency={formatCurrency}
        />
      )}

      <AssignmentFormModal
        isOpen={ui.isModalOpen}
        onClose={() => ui.setIsModalOpen(false)}
        assignment={ui.editingAssignment}
        students={students}
        writers={writers}
        onAssignmentChange={ui.setEditingAssignment}
        onSave={handleSave}
        onDelete={(id) => {
          ui.setIsModalOpen(false);
          ui.setDeleteConfig({ isOpen: true, type: 'single', id });
        }}
        onDuplicate={duplicateAssignment}
        onArchive={handleArchive}
        onSaveTemplate={() => {
          ui.setTemplateName(ui.editingAssignment.title || 'Untitled Template');
          ui.setShowTemplateModal(true);
        }}
        isAddingStudent={ui.isAddingStudent}
        onIsAddingStudentChange={ui.setIsAddingStudent}
        newStudentName={ui.newStudentName}
        onNewStudentNameChange={ui.setNewStudentName}
        onQuickAddStudent={handleQuickAddStudent}
        isAddingWriter={ui.isAddingWriter}
        onIsAddingWriterChange={ui.setIsAddingWriter}
        newWriterName={ui.newWriterName}
        onNewWriterNameChange={ui.setNewWriterName}
        onQuickAddWriter={handleQuickAddWriter}
        isReassigning={ui.isReassigning}
        onIsReassigningChange={ui.setIsReassigning}
        onReassignWriter={handleReassignWriter}
        formatCurrency={formatCurrency}
      />

      <TemplateModal
        isOpen={ui.showTemplateModal}
        onClose={() => ui.setShowTemplateModal(false)}
        templateName={ui.templateName}
        onNameChange={ui.setTemplateName}
        onSave={saveAsTemplate}
      />

      <AssignmentRatingModal
        isOpen={ui.isRatingModalOpen}
        onClose={() => ui.setIsRatingModalOpen(false)}
        ratingStats={ui.ratingStats}
        onRatingChange={ui.setRatingStats}
        onSubmit={handleSubmitRating}
      />

      <AssignmentDeleteModal
        isOpen={ui.deleteConfig.isOpen}
        onClose={() => ui.setDeleteConfig({ ...ui.deleteConfig, isOpen: false })}
        onConfirm={executeDelete}
        count={ui.deleteConfig.type === 'bulk' ? selection.selectedIds.size : undefined}
      />
    </div>
  );
};

export default AssignmentsPage;
