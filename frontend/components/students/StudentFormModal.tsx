import React, { useState, useEffect } from 'react';
import { Student } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import Modal from '../ui/Modal';
import { useUniversities } from '../../hooks/useUniversities';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (student: Partial<Student>) => void;
    initialData?: Partial<Student>;
    students: Student[]; // Keep this for "Referred By" select
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, students }) => {
    const [student, setStudent] = useState<Partial<Student>>(initialData || {});
    const { data: universities = [] } = useUniversities();

    useEffect(() => {
        if (isOpen) {
            setStudent(initialData || {});
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(student);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={student.id ? 'Edit Student' : 'Add New Student'}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Personal Info</label>
                    <div className="space-y-3">
                        <Input required placeholder="Full Name" label="Full Name" value={student.name || ''} onChange={e => setStudent({ ...student, name: e.target.value })} />
                        <Input required placeholder="Email Address" label="Email" type="email" value={student.email || ''} onChange={e => setStudent({ ...student, email: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input required placeholder="Phone Number" label="Phone" type="tel" value={student.phone || ''} onChange={e => setStudent({ ...student, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">University</label>
                                <select
                                    className="block w-full px-4 py-3 bg-secondary-100 border-none rounded-apple text-secondary-900 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200 ease-apple"
                                    value={student.universityId || ''}
                                    onChange={(e) => {
                                        // parseInt('') returns NaN, which would be
                                        // persisted as the student's universityId.
                                        // Treat the empty placeholder as "no
                                        // university" and keep the typed value as
                                        // undefined so the backend can clear it.
                                        const raw = e.target.value;
                                        if (raw === '') {
                                            setStudent({ ...student, universityId: undefined, university: '' });
                                            return;
                                        }
                                        const id = parseInt(raw, 10);
                                        const uni = universities.find(u => u.id === id);
                                        setStudent({ ...student, universityId: id, university: uni ? uni.name : '' });
                                    }}
                                >
                                    <option value="">Select University...</option>
                                    {universities.map(uni => (
                                        <option key={uni.id} value={uni.id}>{uni.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Additional Info</label>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Referred By</label>
                            <select
                                className="block w-full px-4 py-3 bg-secondary-100 border-none rounded-apple text-secondary-900 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200 ease-apple"
                                value={student.referredBy || ''}
                                onChange={e => setStudent({ ...student, referredBy: e.target.value || undefined })}
                            >
                                <option value="">None</option>
                                {students
                                    .filter(s => s.id && s.id !== student.id)
                                    .map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</label>
                            <textarea
                                className="block w-full px-4 py-3 bg-secondary-100 border-none rounded-apple text-secondary-900 placeholder-secondary-400 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all duration-200 ease-apple min-h-[80px]"
                                placeholder="Any additional notes..."
                                value={student.remarks || ''}
                                onChange={e => setStudent({ ...student, remarks: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="isFlagged"
                                checked={student.isFlagged || false}
                                onChange={e => setStudent({ ...student, isFlagged: e.target.checked })}
                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor="isFlagged" className="text-sm text-gray-700">Flag this student (bad payment history, etc.)</label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit">Save Student</Button>
                </div>
            </form>
        </Modal>
    );
};

export default StudentFormModal;
