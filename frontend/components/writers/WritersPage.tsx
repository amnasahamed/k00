import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Writer, Assignment, AssignmentStatus } from '../../types';
import * as DataService from '../../services/dataService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import Modal from '../ui/Modal';
import { useToast } from '../Layout';
import WriterList from './WriterList';
import WriterDetails from './WriterDetails';
import WriterFormModal from './WriterFormModal';

const WritersPage: React.FC = () => {
    const { addToast } = useToast();
    const location = useLocation();
    const [writers, setWriters] = useState<Writer[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWriter, setEditingWriter] = useState<Partial<Writer>>({});
    const [historyWriter, setHistoryWriter] = useState<Writer | null>(null);

    const [selectedWriterId, setSelectedWriterId] = useState<string | number | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('name');

    useEffect(() => {
        refreshData();
    }, []);

    // Deep linking support from GlobalSearch
    useEffect(() => {
        if (location.state) {
            const state = location.state as any;
            if (state.selectWriter) {
                setSelectedWriterId(state.selectWriter);
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state]);

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

    const handleEdit = (writer: Writer) => {
        setHistoryWriter(null);
        setEditingWriter(writer);
        setIsModalOpen(true);
    };

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
                        <Select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            options={[
                                { value: 'name', label: 'Sort: Name' },
                                { value: 'quality', label: 'Sort: Quality' },
                                { value: 'punctuality', label: 'Sort: Punctuality' },
                                { value: 'pending', label: 'Sort: Pending Pay' },
                                { value: 'active', label: 'Sort: Active Tasks' }
                            ]}
                            className="flex-1 sm:w-48"
                        />
                        <Button onClick={() => { setEditingWriter({}); setIsModalOpen(true); }} className="whitespace-nowrap px-6">
                            New
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
                <WriterList
                    writers={filteredWriters}
                    assignments={assignments}
                    selectedId={selectedWriterId}
                    onSelect={(id, writer) => {
                        setSelectedWriterId(id);
                        if (window.innerWidth < 1024) setHistoryWriter(writer);
                    }}
                />

                <div className="hidden lg:block lg:col-span-2 bg-white rounded-2xl shadow-card p-6 h-full overflow-y-auto border border-secondary-200">
                    {selectedWriterId ? (
                        (() => {
                            const writer = writers.find(w => w.id === selectedWriterId);
                            return writer ? (
                                <WriterDetails
                                    writer={writer}
                                    assignments={assignments}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ) : null;
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
                {historyWriter && (
                    <WriterDetails
                        writer={historyWriter}
                        assignments={assignments}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </Modal>

            <WriterFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                writer={editingWriter}
                onWriterChange={setEditingWriter}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default WritersPage;
