import React from 'react';
import { AssignmentStatus, AssignmentPriority, Assignment, Writer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface AssignmentControlBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    viewMode: 'table' | 'board';
    onViewModeChange: (mode: 'table' | 'board') => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    priorityFilter: string;
    onPriorityFilterChange: (value: string) => void;
    isOverdueFilter: boolean;
    onOverdueFilterChange: (value: boolean) => void;
    showArchived: boolean;
    onShowArchivedChange: (value: boolean) => void;
    selectedCount: number;
    onBulkStatusChange: () => void;
    onBulkWriterAssign: () => void;
    onBulkArchive: () => void;
    onBulkDelete: () => void;
    onClearSelection: () => void;
    bulkAction: 'status' | 'writer' | null;
    onBulkActionChange: (action: 'status' | 'writer' | null) => void;
    bulkStatusValue: string;
    onBulkStatusValueChange: (value: string) => void;
    bulkWriterValue: string;
    onBulkWriterValueChange: (value: string) => void;
    writers: Writer[];
    templates: Partial<Assignment>[];
    onNewClick: () => void;
    onTemplateLoad: (template: Partial<Assignment>) => void;
    sortBy: string;
    onSortByChange: (value: string) => void;
    sortOrder: 'asc' | 'desc';
    onSortOrderToggle: () => void;
}

const AssignmentControlBar: React.FC<AssignmentControlBarProps> = ({
    searchTerm,
    onSearchChange,
    viewMode,
    onViewModeChange,
    statusFilter,
    onStatusFilterChange,
    priorityFilter,
    onPriorityFilterChange,
    isOverdueFilter,
    onOverdueFilterChange,
    showArchived,
    onShowArchivedChange,
    selectedCount,
    onBulkStatusChange,
    onBulkWriterAssign,
    onBulkArchive,
    onBulkDelete,
    onClearSelection,
    bulkAction,
    onBulkActionChange,
    bulkStatusValue,
    onBulkStatusValueChange,
    bulkWriterValue,
    onBulkWriterValueChange,
    writers,
    templates,
    onNewClick,
    onTemplateLoad,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderToggle,
}) => {
    return (
        <div className="flex flex-col gap-4 sticky top-14 md:static z-20 bg-background/95 backdrop-blur-sm py-2">
            <div className="flex gap-3 items-center">
                <div className="relative flex-1 group">
                    <Input
                        placeholder="Search tasks, subjects, or students..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-secondary-50 border-secondary-100 focus:bg-white transition-apple"
                        leftIcon={<svg className="w-5 h-5 text-secondary-400 group-focus-within:text-primary transition-apple" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    />
                </div>
                {/* View Toggle (Desktop Only) */}
                <div className="hidden md:flex bg-secondary-100/50 p-1 rounded-apple-lg border border-secondary-200/50 backdrop-blur-md">
                    <button
                        onClick={() => onViewModeChange('table')}
                        className={`px-4 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple ${viewMode === 'table' ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100' : 'text-secondary-400 hover:text-secondary-600'}`}
                    >
                        Table
                    </button>
                    <button
                        onClick={() => onViewModeChange('board')}
                        className={`px-4 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple ${viewMode === 'board' ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100' : 'text-secondary-400 hover:text-secondary-600'}`}
                    >
                        Board
                    </button>
                </div>

                <Button onClick={onNewClick} className="whitespace-nowrap px-6 shadow-ios-primary bg-gradient-to-br from-primary to-primary-600 border-none">+ New Task</Button>

                {templates.length > 0 && (
                    <div className="relative group">
                        <Button variant="secondary" className="whitespace-nowrap bg-white border-secondary-200 shadow-ios-sm">
                            Templates ({templates.length})
                        </Button>
                        <div className="hidden group-hover:block absolute top-full right-0 mt-2 w-72 bg-white rounded-apple-lg shadow-ios-xl border border-secondary-100 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-secondary-100 bg-secondary-50/50">
                                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Saved Templates</span>
                            </div>
                            {templates.map((template, idx) => (
                                <button key={idx} onClick={() => onTemplateLoad(template)} className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-apple border-b border-secondary-50 last:border-0 group/item">
                                    <div className="font-bold text-sm text-secondary-900 group-hover/item:text-primary transition-apple">{template.title}</div>
                                    <div className="text-[10px] font-bold text-secondary-400 mt-1 uppercase tracking-widest">{template.type} • {template.subject}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && (
                <div className="flex flex-col gap-2 bg-primary/5 border border-primary/10 px-4 py-3 rounded-apple-lg animate-in fade-in slide-in-from-top-2 shadow-ios-sm">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedCount} Selected</span>
                        <div className="h-4 w-[1px] bg-primary/20"></div>
                        <button onClick={() => onBulkActionChange('status')} className="text-[10px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-apple">Change Status</button>
                        <button onClick={() => onBulkActionChange('writer')} className="text-[10px] font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-apple">Assign Writer</button>
                        <button onClick={onBulkArchive} className="text-[10px] font-black text-secondary-500 hover:text-secondary-800 uppercase tracking-widest transition-apple">{showArchived ? 'Unarchive' : 'Archive'}</button>
                        <button onClick={onBulkDelete} className="text-[10px] font-black text-danger-500 hover:text-danger-800 uppercase tracking-widest transition-apple">Delete</button>
                        <button onClick={onClearSelection} className="ml-auto text-[10px] font-black text-secondary-400 uppercase tracking-widest hover:text-secondary-600 transition-apple">Cancel</button>
                    </div>
                    {bulkAction === 'status' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <Select
                                value={bulkStatusValue}
                                onChange={(e) => onBulkStatusValueChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select Status' },
                                    ...Object.values(AssignmentStatus).map(s => ({ value: s, label: s }))
                                ]}
                                className="flex-1"
                                size="sm"
                            />
                            <Button size="sm" onClick={onBulkStatusChange} disabled={!bulkStatusValue} className="shadow-ios-sm">Apply</Button>
                            <Button size="sm" variant="ghost" onClick={() => { onBulkActionChange(null); onBulkStatusValueChange(''); }} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                        </div>
                    )}
                    {bulkAction === 'writer' && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <Select
                                value={bulkWriterValue}
                                onChange={(e) => onBulkWriterValueChange(e.target.value)}
                                options={[
                                    { value: '', label: 'Select Writer' },
                                    ...writers.map(w => ({ value: w.id, label: w.name }))
                                ]}
                                className="flex-1"
                                size="sm"
                            />
                            <Button size="sm" onClick={onBulkWriterAssign} disabled={!bulkWriterValue} className="shadow-ios-sm">Apply</Button>
                            <Button size="sm" variant="ghost" onClick={() => { onBulkActionChange(null); onBulkWriterValueChange(''); }} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                {isOverdueFilter && (
                    <button onClick={() => onOverdueFilterChange(false)} className="bg-danger/5 text-danger border border-danger/10 px-3 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0 hover:bg-danger/10 transition-apple active:scale-95 shadow-ios-sm">
                        Overdue <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
                {showArchived ? (
                    <button onClick={() => onShowArchivedChange(false)} className="bg-secondary-800 text-white px-3 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0 hover:bg-secondary-900 transition-apple active:scale-95 shadow-ios">
                        📦 Archived <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                ) : (
                    <button onClick={() => onShowArchivedChange(true)} className="bg-white text-secondary-600 border border-secondary-100 px-3 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest hover:bg-secondary-50 transition-apple active:scale-95 shadow-ios-sm flex-shrink-0">
                        📦 View Archived
                    </button>
                )}

                <Select size="sm" value={priorityFilter} onChange={(e) => onPriorityFilterChange(e.target.value)} options={[
                    { value: 'all', label: 'Priority: All' },
                    ...Object.values(AssignmentPriority).map(p => ({ value: p, label: p }))
                ]} className="w-44" />
                <Select size="sm" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} options={[
                    { value: 'all', label: 'Status: All' },
                    ...Object.values(AssignmentStatus).map(s => ({ value: s, label: s }))
                ]} className="w-44" />
                <div className="flex items-center gap-1 bg-white shadow-ios-sm rounded-apple border border-secondary-100 px-2 py-1 flex-shrink-0">
                    <select className="border-none text-[10px] text-secondary-700 font-black uppercase tracking-widest focus:ring-0 bg-transparent pr-1 cursor-pointer" value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
                        <option value="deadline">Sort: Deadline</option>
                        <option value="createdAt">Sort: Created</option>
                        <option value="title">Sort: Title</option>
                    </select>
                    <button onClick={onSortOrderToggle} className="p-1 px-2 hover:bg-secondary-50 rounded-lg transition-apple font-black text-primary text-[10px]">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentControlBar;
