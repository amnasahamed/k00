import React from 'react';
import { Writer } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

interface WriterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    writer: Partial<Writer>;
    onWriterChange: (writer: Partial<Writer>) => void;
    onSave: (e: React.FormEvent) => void;
    onDelete: (id: string) => void;
}

const WriterFormModal: React.FC<WriterFormModalProps> = ({ isOpen, onClose, writer, onWriterChange, onSave, onDelete }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={writer.id ? "Edit Writer" : "New Writer"}>
            <form onSubmit={onSave} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Profile</label>
                    <div className="space-y-3">
                        <Input required placeholder="Writer Name" value={writer.name || ''} onChange={e => onWriterChange({ ...writer, name: e.target.value })} />
                        <Input required placeholder="Mobile Number" type="tel" value={writer.contact || ''} onChange={e => onWriterChange({ ...writer, contact: e.target.value })} />
                        <Input placeholder="Specialty (e.g. Law, Nursing)" value={writer.specialty || ''} onChange={e => onWriterChange({ ...writer, specialty: e.target.value })} />

                        <div>
                            <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1 mb-1 block">Availability Status</label>
                            <select
                                className="w-full bg-white border border-secondary-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-sans text-sm"
                                value={writer.availabilityStatus || 'available'}
                                onChange={e => onWriterChange({ ...writer, availabilityStatus: e.target.value as any })}
                            >
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="vacation">On Vacation</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1 mb-1 block">Max Concurrent Tasks</label>
                            <Input
                                type="number" min={1} max={20}
                                value={writer.maxConcurrentTasks ?? 5}
                                onChange={e => {
                                    const value = e.target.value;
                                    onWriterChange({ ...writer, maxConcurrentTasks: value === '' ? 5 : Number(value) });
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Quality (0-5)</label>
                                <Input
                                    type="number" step="0.1" min="0" max="5"
                                    value={writer.rating?.quality ?? 5.0}
                                    onChange={e => onWriterChange({
                                        ...writer,
                                        rating: {
                                            count: writer.rating?.count || 1,
                                            punctuality: writer.rating?.punctuality || 5.0,
                                            communication: writer.rating?.communication || 5.0,
                                            reliability: writer.rating?.reliability || 5.0,
                                            quality: e.target.value === '' ? 5.0 : Number(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Punctuality (0-5)</label>
                                <Input
                                    type="number" step="0.1" min="0" max="5"
                                    value={writer.rating?.punctuality ?? 5.0}
                                    onChange={e => onWriterChange({
                                        ...writer,
                                        rating: {
                                            count: writer.rating?.count || 1,
                                            quality: writer.rating?.quality || 5.0,
                                            communication: writer.rating?.communication || 5.0,
                                            reliability: writer.rating?.reliability || 5.0,
                                            punctuality: e.target.value === '' ? 5.0 : Number(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Communication (0-5)</label>
                                <Input
                                    type="number" step="0.1" min="0" max="5"
                                    value={writer.rating?.communication ?? 5.0}
                                    onChange={e => onWriterChange({
                                        ...writer,
                                        rating: {
                                            count: writer.rating?.count || 1,
                                            quality: writer.rating?.quality || 5.0,
                                            punctuality: writer.rating?.punctuality || 5.0,
                                            reliability: writer.rating?.reliability || 5.0,
                                            communication: e.target.value === '' ? 5.0 : Number(e.target.value)
                                        }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Reliability (0-5)</label>
                                <Input
                                    type="number" step="0.1" min="0" max="5"
                                    value={writer.rating?.reliability ?? 5.0}
                                    onChange={e => {
                                        const value = e.target.value;
                                        onWriterChange({
                                            ...writer,
                                            rating: {
                                                count: writer.rating?.count || 1,
                                                quality: writer.rating?.quality || 5.0,
                                                punctuality: writer.rating?.punctuality || 5.0,
                                                communication: writer.rating?.communication || 5.0,
                                                reliability: value === '' ? 5.0 : Number(value)
                                            }
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 mt-2">
                            <input
                                type="checkbox"
                                id="flagWriter"
                                className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                                checked={writer.isFlagged || false}
                                onChange={e => onWriterChange({ ...writer, isFlagged: e.target.checked })}
                            />
                            <label htmlFor="flagWriter" className="text-sm font-bold text-red-700">Flag Writer (Ghosting/Poor Quality)</label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                    {writer.id && (
                        <Button type="button" variant="danger" size="sm" onClick={() => { onClose(); onDelete(String(writer.id!)); }}>Delete</Button>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Save Writer</Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default WriterFormModal;
