import React, { useState, useEffect } from 'react';
import { Writer, Assignment, AssignmentStatus } from '../types';
import * as DataService from '../services/dataService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import Modal from './ui/Modal';
import { useToast } from './Layout';

const WritersView: React.FC = () => {
    const { addToast } = useToast();
    const [writers, setWriters] = useState<Writer[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    // Mobile Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWriter, setEditingWriter] = useState<Partial<Writer>>({});
    const [historyWriter, setHistoryWriter] = useState<Writer | null>(null);

    // Desktop Split View State
    const [selectedWriterId, setSelectedWriterId] = useState<string | number | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('name');

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        try {
            const w = await DataService.getWriters();
            setWriters(w);
            const a = await DataService.getAssignments();
            setAssignments(a);
        } catch (error) {
            console.error("Failed to fetch data", error);
            addToast('Failed to load data', 'error');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWriter.name) return;
        try {
            const saved = await DataService.saveWriter(editingWriter as Writer);
            setIsModalOpen(false);
            setEditingWriter({});
            await refreshData();
            setSelectedWriterId(saved.id);
            addToast('Writer saved', 'success');
        } catch (error) {
            console.error("Failed to save writer", error);
            addToast('Failed to save writer', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this writer?')) {
            try {
                await DataService.deleteWriter(id);
                await refreshData();
                if (selectedWriterId === id) setSelectedWriterId(null);
                addToast('Writer deleted', 'success');
            } catch (error) {
                console.error("Failed to delete writer", error);
                addToast('Failed to delete writer', 'error');
            }
        }
    };

    const getWriterAssignments = (writerId: string | number) => assignments.filter(a => String(a.writerId) === String(writerId));

    // Filter and Sort Logic
    const filteredWriters = writers.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        switch (sortOption) {
            case 'quality':
                return (b.rating?.quality || 0) - (a.rating?.quality || 0);
            case 'punctuality':
                return (b.rating?.punctuality || 0) - (a.rating?.punctuality || 0);
            case 'pending':
                const getPending = (wid: string | number) => assignments
                    .filter(ass => String(ass.writerId) === String(wid))
                    .reduce((sum, curr) => sum + ((curr.writerPrice || 0) - (curr.writerPaidAmount || 0)), 0);
                return getPending(b.id) - getPending(a.id);
            case 'active':
                const getActive = (wid: string | number) => assignments
                    .filter(ass => String(ass.writerId) === String(wid) && ass.status === AssignmentStatus.IN_PROGRESS).length;
                return getActive(b.id) - getActive(a.id);
            case 'name':
            default:
                return a.name.localeCompare(b.name);
        }
    });

    const WriterDetails: React.FC<{ writer: Writer }> = ({ writer }) => {
        const writerAssignments = getWriterAssignments(writer.id);
        const pending = writerAssignments.filter(a => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED);
        const completed = writerAssignments.filter(a => a.status === AssignmentStatus.COMPLETED);

        const openWhatsApp = (number: string) => {
            const cleanNum = number.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanNum}`, '_blank');
        };

        // Rating rendering
        const renderStars = (score: number) => {
            return (
                <div className="flex text-amber-400 text-xs">
                    {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={i <= Math.round(score) ? 'opacity-100' : 'opacity-30'}>★</span>
                    ))}
                </div>
            );
        };

        const AssignmentItem: React.FC<{ a: Assignment }> = ({ a }) => (
            <div className="border-b border-secondary-100 last:border-0 py-3 flex justify-between items-center hover:bg-secondary-50 transition-colors px-2 -mx-2 rounded-lg">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-secondary-900 text-sm truncate">{a.title}</h4>
                        {a.status === AssignmentStatus.IN_PROGRESS && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>}
                    </div>
                    <div className="flex gap-2 text-[10px] text-secondary-500">
                        <Badge variant="neutral" size="sm">{a.type}</Badge>
                        <span>Due: {new Date(a.deadline).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={(a.writerPrice || 0) - (a.writerPaidAmount || 0) > 0 ? "text-red-600 font-bold text-xs" : "text-emerald-600 font-bold text-xs"}>
                        {(a.writerPrice || 0) - (a.writerPaidAmount || 0) > 0 ? formatCurrency((a.writerPrice || 0) - (a.writerPaidAmount || 0)) : 'Settled'}
                    </span>
                    {(a.writerPrice || 0) - (a.writerPaidAmount || 0) > 0 && <p className="text-[9px] text-secondary-400 uppercase mt-0.5">Due</p>}
                </div>
            </div>
        );

        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-secondary-900">{writer.name}</h2>
                            {writer.isFlagged && <Badge variant="danger">FLAGGED</Badge>}
                        </div>
                        <p className="text-secondary-500">{writer.specialty || 'Generalist'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openWhatsApp(writer.contact)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                            title="Chat on WhatsApp"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                setHistoryWriter(null); // Close view modal to avoid mess
                                setEditingWriter(writer);
                                setIsModalOpen(true);
                            }}
                            className="p-2 bg-secondary-100 text-secondary-600 rounded-full hover:bg-secondary-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(String(writer.id))} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="text-center border-secondary-200 bg-secondary-50" noPadding>
                        <div className="p-3">
                            <p className="text-[10px] text-secondary-400 uppercase font-bold tracking-wide mb-1">Quality</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg font-bold text-secondary-800">{writer.rating?.quality || 'N/A'}</span>
                                {writer.rating && renderStars(writer.rating.quality)}
                            </div>
                        </div>
                    </Card>
                    <Card className="text-center border-secondary-200 bg-secondary-50" noPadding>
                        <div className="p-3">
                            <p className="text-[10px] text-secondary-400 uppercase font-bold tracking-wide mb-1">Punctuality</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg font-bold text-secondary-800">{writer.rating?.punctuality || 'N/A'}</span>
                                {writer.rating && renderStars(writer.rating.punctuality)}
                            </div>
                        </div>
                    </Card>
                </div>

                {writer.isFlagged && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <p className="text-sm font-bold text-red-700">Flagged Writer</p>
                            <p className="text-xs text-red-600">Marked for abandonment or quality issues.</p>
                        </div>
                    </div>
                )}

                <Card className="bg-primary-50/50 border-primary-100" noPadding>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-primary-800 uppercase tracking-wider">Active Tasks</h4>
                            <Badge variant="info">{pending.length}</Badge>
                        </div>
                        {pending.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-primary-100/50 divide-y divide-secondary-100">
                                {pending.map(a => <div key={a.id} className="p-3"><AssignmentItem a={a} /></div>)}
                            </div>
                        ) : <p className="text-xs text-primary-400 italic">No active assignments.</p>}
                    </div>
                </Card>

                <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h4 className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Assignment History</h4>
                        <Badge variant="neutral">{completed.length}</Badge>
                    </div>
                    {completed.length > 0 ? (
                        <Card className="border-secondary-100" noPadding>
                            <div className="p-5 divide-y divide-secondary-100">
                                {completed.map(a => <div key={a.id} className="py-2 first:pt-0 last:pb-0"><AssignmentItem a={a} /></div>)}
                            </div>
                        </Card>
                    ) : <p className="text-xs text-secondary-400 italic px-1">No completed assignments.</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Search writers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        className="flex-1"
                    />
                    <div className="flex gap-2">
                        <select
                            className="bg-white border border-secondary-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer flex-1 sm:flex-none text-secondary-700 font-medium"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="name">Sort: Name</option>
                            <option value="quality">Sort: Quality</option>
                            <option value="punctuality">Sort: Punctuality</option>
                            <option value="pending">Sort: Pending Pay</option>
                            <option value="active">Sort: Active Tasks</option>
                        </select>
                        <Button onClick={() => { setEditingWriter({}); setIsModalOpen(true); }} className="whitespace-nowrap">
                            New
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                {/* Writer List (Left Panel) */}
                <div className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col h-full lg:col-span-1 border border-secondary-200">
                    <div className="overflow-y-auto flex-1 no-scrollbar">
                        {filteredWriters.map((writer, index) => {
                            const writerAssignments = getWriterAssignments(writer.id);
                            const active = writerAssignments.filter(a => a.status === AssignmentStatus.IN_PROGRESS).length;
                            const totalPaid = writerAssignments.reduce((acc, curr) => acc + (curr.writerPaidAmount || 0), 0);
                            const totalFee = writerAssignments.reduce((acc, curr) => acc + (curr.writerPrice || 0), 0);
                            const pendingPay = totalFee - totalPaid;
                            const isSelected = selectedWriterId === writer.id;

                            return (
                                <div
                                    key={writer.id}
                                    className={`p-4 flex items-center justify-between transition-colors cursor-pointer border-b border-secondary-100 ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-secondary-50 border-l-4 border-l-transparent'}`}
                                    onClick={() => {
                                        setSelectedWriterId(writer.id);
                                        if (window.innerWidth < 1024) setHistoryWriter(writer);
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${isSelected ? 'bg-primary-200 text-primary-700' : 'bg-secondary-100 text-secondary-600'}`}>
                                            {writer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-semibold truncate flex items-center gap-2 ${isSelected ? 'text-primary-900' : 'text-secondary-900'}`}>
                                                {writer.name}
                                                {writer.isFlagged && <span className="text-[10px] animate-pulse">🚩</span>}
                                            </h3>
                                            <div className="flex gap-2 text-xs text-secondary-500">
                                                <span className="truncate">{writer.specialty || 'Generalist'}</span>
                                                {active > 0 && <span className="text-primary-600 font-medium whitespace-nowrap">• {active} Active</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {pendingPay > 0 && (
                                        <div className="text-right pl-2">
                                            <p className="font-semibold text-xs text-red-500">{formatCurrency(pendingPay)}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredWriters.length === 0 && (
                            <div className="p-8 text-center text-secondary-400">
                                No writers found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail View (Right Panel) */}
                <div className="hidden lg:block lg:col-span-2 bg-white rounded-2xl shadow-card p-6 h-full overflow-y-auto border border-secondary-200">
                    {selectedWriterId ? (
                        (() => {
                            const writer = writers.find(w => w.id === selectedWriterId);
                            return writer ? <WriterDetails writer={writer} /> : null;
                        })()
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-secondary-400">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            <p className="text-lg font-medium">Select a writer to view details</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={!!historyWriter} onClose={() => setHistoryWriter(null)} title={`${historyWriter?.name || 'Writer'}'s Profile`}>
                {historyWriter && <WriterDetails writer={historyWriter} />}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWriter.id ? "Edit Writer" : "New Writer"}>
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-secondary-500 uppercase mb-2 ml-1">Profile</label>
                        <div className="space-y-3">
                            <Input required placeholder="Writer Name" value={editingWriter.name || ''} onChange={e => setEditingWriter({ ...editingWriter, name: e.target.value })} />
                            <Input required placeholder="Mobile Number" type="tel" value={editingWriter.contact || ''} onChange={e => setEditingWriter({ ...editingWriter, contact: e.target.value })} />
                            <Input placeholder="Specialty (e.g. Law, Nursing)" value={editingWriter.specialty || ''} onChange={e => setEditingWriter({ ...editingWriter, specialty: e.target.value })} />

                            {/* Availability Status */}
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1 mb-1 block">Availability Status</label>
                                <select
                                    className="w-full bg-white border border-secondary-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 transition-all font-sans text-sm"
                                    value={editingWriter.availabilityStatus || 'available'}
                                    onChange={e => setEditingWriter({ ...editingWriter, availabilityStatus: e.target.value as any })}
                                >
                                    <option value="available">Available</option>
                                    <option value="busy">Busy</option>
                                    <option value="vacation">On Vacation</option>
                                </select>
                            </div>

                            {/* Max Concurrent Tasks */}
                            <div>
                                <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1 mb-1 block">Max Concurrent Tasks</label>
                                <Input
                                    type="number" min={1} max={20}
                                    value={editingWriter.maxConcurrentTasks ?? 5}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setEditingWriter({ ...editingWriter, maxConcurrentTasks: value === '' ? 5 : Number(value) });
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Quality (0-5)</label>
                                    <Input
                                        type="number" step="0.1" min="0" max="5"
                                        value={editingWriter.rating?.quality ?? 5.0}
                                        onChange={e => setEditingWriter({
                                            ...editingWriter,
                                            rating: {
                                                count: editingWriter.rating?.count || 1,
                                                punctuality: editingWriter.rating?.punctuality || 5.0,
                                                communication: editingWriter.rating?.communication || 5.0,
                                                reliability: editingWriter.rating?.reliability || 5.0,
                                                quality: e.target.value === '' ? 5.0 : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Punctuality (0-5)</label>
                                    <Input
                                        type="number" step="0.1" min="0" max="5"
                                        value={editingWriter.rating?.punctuality ?? 5.0}
                                        onChange={e => setEditingWriter({
                                            ...editingWriter,
                                            rating: {
                                                count: editingWriter.rating?.count || 1,
                                                quality: editingWriter.rating?.quality || 5.0,
                                                communication: editingWriter.rating?.communication || 5.0,
                                                reliability: editingWriter.rating?.reliability || 5.0,
                                                punctuality: e.target.value === '' ? 5.0 : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Communication (0-5)</label>
                                    <Input
                                        type="number" step="0.1" min="0" max="5"
                                        value={editingWriter.rating?.communication ?? 5.0}
                                        onChange={e => setEditingWriter({
                                            ...editingWriter,
                                            rating: {
                                                count: editingWriter.rating?.count || 1,
                                                quality: editingWriter.rating?.quality || 5.0,
                                                punctuality: editingWriter.rating?.punctuality || 5.0,
                                                reliability: editingWriter.rating?.reliability || 5.0,
                                                communication: e.target.value === '' ? 5.0 : Number(e.target.value)
                                            }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1">Reliability (0-5)</label>
                                    <Input
                                        type="number" step="0.1" min="0" max="5"
                                        value={editingWriter.rating?.reliability ?? 5.0}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setEditingWriter({
                                                ...editingWriter,
                                                rating: {
                                                    count: editingWriter.rating?.count || 1,
                                                    quality: editingWriter.rating?.quality || 5.0,
                                                    punctuality: editingWriter.rating?.punctuality || 5.0,
                                                    communication: editingWriter.rating?.communication || 5.0,
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
                                    checked={editingWriter.isFlagged || false}
                                    onChange={e => setEditingWriter({ ...editingWriter, isFlagged: e.target.checked })}
                                />
                                <label htmlFor="flagWriter" className="text-sm font-bold text-red-700">Flag Writer (Ghosting/Poor Quality)</label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        {editingWriter.id && (
                            <Button type="button" variant="danger" size="sm" onClick={() => { setIsModalOpen(false); handleDelete(String(editingWriter.id!)); }}>Delete</Button>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Writer</Button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WritersView;