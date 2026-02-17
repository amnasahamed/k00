import React, { useState } from 'react';
import { Assignment, AssignmentType, AssignmentPriority, Student, Writer } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import Modal from '../ui/Modal';

interface AssignmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: Partial<Assignment>;
    students: Student[];
    writers: Writer[];
    onAssignmentChange: (assignment: Partial<Assignment> | ((prev: Partial<Assignment>) => Partial<Assignment>)) => void;
    onSave: (e: React.FormEvent) => void;
    onDelete: (id: string) => void;
    onDuplicate: (assignment: Assignment) => void;
    onArchive: (assignment: Assignment) => void;
    onSaveTemplate: () => void;
    isAddingStudent: boolean;
    onIsAddingStudentChange: (value: boolean) => void;
    newStudentName: string;
    onNewStudentNameChange: (value: string) => void;
    onQuickAddStudent: () => void;
    isAddingWriter: boolean;
    onIsAddingWriterChange: (value: boolean) => void;
    newWriterName: string;
    onNewWriterNameChange: (value: string) => void;
    onQuickAddWriter: () => void;
    isReassigning: boolean;
    onIsReassigningChange: (value: boolean) => void;
    onReassignWriter: () => void;
    formatCurrency: (amount: number) => string;
}

const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
    isOpen,
    onClose,
    assignment,
    students,
    writers,
    onAssignmentChange,
    onSave,
    onDelete,
    onDuplicate,
    onArchive,
    onSaveTemplate,
    isAddingStudent,
    onIsAddingStudentChange,
    newStudentName,
    onNewStudentNameChange,
    onQuickAddStudent,
    isAddingWriter,
    onIsAddingWriterChange,
    newWriterName,
    onNewWriterNameChange,
    onQuickAddWriter,
    isReassigning,
    onIsReassigningChange,
    onReassignWriter,
    formatCurrency,
}) => {
    const [activeTab, setActiveTab] = useState('details');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={assignment.id ? "Edit Assignment" : "New Assignment"} size="xl">
            <form onSubmit={onSave} className="space-y-6">

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="details">Details & Requirements</TabsTrigger>
                        <TabsTrigger value="financials">Financials & People</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                        <div className="space-y-4">
                            <Input label="Title / Topic" required value={assignment.title || ''} onChange={e => onAssignmentChange({ ...assignment, title: e.target.value })} placeholder="e.g. History of Rome" />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Type</label>
                                    <Select value={assignment.type || AssignmentType.ESSAY} onChange={e => onAssignmentChange({ ...assignment, type: e.target.value as AssignmentType })} options={Object.values(AssignmentType).map(t => ({ value: t, label: t }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Subject</label>
                                    <Input value={assignment.subject || ''} onChange={e => onAssignmentChange({ ...assignment, subject: e.target.value })} placeholder="e.g. History" className="bg-secondary-50 border-secondary-100 focus:bg-white transition-apple" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Academic Level</label>
                                    <Select value={assignment.level || 'Undergraduate'} onChange={e => onAssignmentChange({ ...assignment, level: e.target.value })} options={[
                                        { value: 'Undergraduate', label: 'Undergraduate' },
                                        { value: "Master's", label: "Master's" },
                                        { value: 'PhD', label: 'PhD' },
                                        { value: 'Diploma', label: 'Diploma' }
                                    ]} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Priority Status</label>
                                    <Select value={assignment.priority || AssignmentPriority.MEDIUM} onChange={e => onAssignmentChange({ ...assignment, priority: e.target.value as AssignmentPriority })} options={Object.values(AssignmentPriority).map(p => ({ value: p, label: p }))} />
                                </div>
                            </div>

                            <Input label="Deadline" type="date" required value={assignment.deadline ? new Date(assignment.deadline).toISOString().split('T')[0] : ''} onChange={e => onAssignmentChange({ ...assignment, deadline: new Date(e.target.value).toISOString() })} />

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-secondary-600">Description / Instructions</label>
                                <textarea className="w-full bg-secondary-50 border border-secondary-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-apple-lg text-sm min-h-[100px] p-3 transition-apple" value={assignment.description || ''} onChange={e => onAssignmentChange({ ...assignment, description: e.target.value })}></textarea>
                            </div>
                            <Input label="Document Link (URL)" value={assignment.documentLink || ''} onChange={e => onAssignmentChange({ ...assignment, documentLink: e.target.value })} placeholder="https://..." />
                        </div>
                    </TabsContent>

                    <TabsContent value="financials" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Student Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-success"></span> Student
                                </h4>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Select Student</label>
                                    {isAddingStudent ? (
                                        <div className="flex gap-2">
                                            <Input className="flex-1" placeholder="New Student Name" value={newStudentName} onChange={e => onNewStudentNameChange(e.target.value)} />
                                            <Button type="button" size="sm" onClick={onQuickAddStudent}>Save</Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => onIsAddingStudentChange(false)}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Select value={assignment.studentId || ''} onChange={e => {
                                                if (e.target.value === 'new') onIsAddingStudentChange(true);
                                                else onAssignmentChange({ ...assignment, studentId: e.target.value });
                                            }} options={[
                                                { value: '', label: 'Select Student' },
                                                { value: 'new', label: '+ Add New Student', className: 'font-bold text-primary-600' },
                                                ...students.map(s => ({ value: s.id, label: s.name }))
                                            ]} className="flex-1" />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-success/5 p-4 rounded-apple border border-success/10 space-y-3">
                                    <Input label="Word Count" type="number" value={assignment.wordCount} onChange={e => onAssignmentChange({ ...assignment, wordCount: Number(e.target.value) })} className="bg-white border-success-100/30" />
                                    <Input label="Student Rate/Word" type="number" step="0.1" value={assignment.costPerWord} onChange={e => onAssignmentChange({ ...assignment, costPerWord: Number(e.target.value) })} className="bg-white border-success-100/30" />
                                    <div className="pt-2 border-t border-success/10">
                                        <Input label="Total Price" type="number" value={assignment.price} onChange={e => onAssignmentChange({ ...assignment, price: Number(e.target.value) })} className="bg-white border-success-100/50 font-bold" />
                                        <Input label="Paid Amount" type="number" value={assignment.paidAmount} onChange={e => onAssignmentChange({ ...assignment, paidAmount: Number(e.target.value) })} className="mt-2 bg-white border-success-100/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Writer Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-danger"></span> Writer
                                </h4>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary-600">Assign Writer</label>
                                    {isAddingWriter ? (
                                        <div className="flex gap-2">
                                            <Input className="flex-1" placeholder="New Writer Name" value={newWriterName} onChange={e => onNewWriterNameChange(e.target.value)} />
                                            <Button type="button" size="sm" onClick={onQuickAddWriter}>Save</Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={() => onIsAddingWriterChange(false)}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Select value={assignment.writerId || ''} onChange={e => {
                                                if (e.target.value === 'new') onIsAddingWriterChange(true);
                                                else if (assignment.writerId && e.target.value !== assignment.writerId) {
                                                    if (confirm('Reassigning will start fresh for the new writer. Move previous payments to sunk costs?')) {
                                                        onReassignWriter();
                                                        onAssignmentChange(prev => ({ ...prev, writerId: e.target.value }));
                                                    }
                                                } else {
                                                    onAssignmentChange({ ...assignment, writerId: e.target.value });
                                                }
                                            }} options={[
                                                { value: '', label: 'Unassigned' },
                                                { value: 'new', label: '+ Add New Writer', className: 'font-bold text-primary-600' },
                                                ...writers.map(w => ({ value: w.id, label: w.name }))
                                            ]} className="flex-1" />
                                        </div>
                                    )}
                                </div>

                                {assignment.writerId && (
                                    <div className="bg-danger/5 p-4 rounded-apple border border-danger/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <Input label="Writer Rate/Word" type="number" step="0.1" value={assignment.writerCostPerWord} onChange={e => onAssignmentChange({ ...assignment, writerCostPerWord: Number(e.target.value) })} className="bg-white border-danger-100/30" />
                                        <div className="pt-2 border-t border-danger/10">
                                            <Input label="Writer Fee" type="number" value={assignment.writerPrice} onChange={e => onAssignmentChange({ ...assignment, writerPrice: Number(e.target.value) })} className="bg-white border-danger-100/30 font-bold" />
                                            <Input label="Paid to Writer" type="number" value={assignment.writerPaidAmount} onChange={e => onAssignmentChange({ ...assignment, writerPaidAmount: Number(e.target.value) })} className="mt-2 bg-white border-danger-100/30" />
                                        </div>
                                        {assignment.sunkCosts ? (
                                            <div className="text-[9px] text-danger-500 font-black uppercase tracking-widest pt-1 border-t border-danger-100/50">Sunk Costs: {formatCurrency(assignment.sunkCosts)}</div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-between items-center pt-4 border-t border-secondary-100 mt-4">
                    <div className="flex gap-2">
                        {assignment.id && (
                            <>
                                <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => onDelete(String(assignment.id!))}>Delete</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => onDuplicate(assignment as Assignment)}>Duplicate</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(assignment as Assignment)}>{assignment.isArchived ? 'Unarchive' : 'Archive'}</Button>
                            </>
                        )}
                        {!assignment.id && (
                            <Button type="button" variant="ghost" size="sm" onClick={onSaveTemplate}>Save as Template</Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Assignment</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AssignmentFormModal;
