import { useState } from 'react';
import { Assignment } from '../../../types';

export function useAssignmentSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (ids: string[], checked: boolean) => {
    setSelectedIds(checked ? new Set(ids) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
  };
}

export function useAssignmentModals() {
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment>>({});
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
  }>({ isOpen: false, type: 'single' });
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingWriterId, setRatingWriterId] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState({ quality: 5, punctuality: 5 });
  const [bulkAction, setBulkAction] = useState<'status' | 'writer' | null>(null);
  const [bulkStatusValue, setBulkStatusValue] = useState('');
  const [bulkWriterValue, setBulkWriterValue] = useState('');
  const [templates, setTemplates] = useState<Partial<Assignment>[]>(() => {
    try {
      const saved = localStorage.getItem('assignmentTemplates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newWriterName, setNewWriterName] = useState('');
  const [isAddingWriter, setIsAddingWriter] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const persistTemplates = (next: Partial<Assignment>[]) => {
    setTemplates(next);
    localStorage.setItem('assignmentTemplates', JSON.stringify(next));
  };

  return {
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    editingAssignment,
    setEditingAssignment,
    deleteConfig,
    setDeleteConfig,
    isRatingModalOpen,
    setIsRatingModalOpen,
    ratingWriterId,
    setRatingWriterId,
    ratingStats,
    setRatingStats,
    bulkAction,
    setBulkAction,
    bulkStatusValue,
    setBulkStatusValue,
    bulkWriterValue,
    setBulkWriterValue,
    templates,
    persistTemplates,
    showTemplateModal,
    setShowTemplateModal,
    templateName,
    setTemplateName,
    newStudentName,
    setNewStudentName,
    isAddingStudent,
    setIsAddingStudent,
    newWriterName,
    setNewWriterName,
    isAddingWriter,
    setIsAddingWriter,
    isReassigning,
    setIsReassigning,
  };
}
