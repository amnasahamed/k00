import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { University } from '../../types';
import { X, Check, Edit2, Trash2, Plus } from 'lucide-react';

interface UniversityManagerProps {
    onClose: () => void;
}

const UniversityManager: React.FC<UniversityManagerProps> = ({ onClose }) => {
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/universities', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setUniversities(response.data);
        } catch (error) {
            console.error('Failed to fetch universities', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:3000/api/universities', {
                name: newItem
            }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setUniversities([...universities, response.data]);
            setNewItem('');
        } catch (error) {
            console.error('Failed to add university', error);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editValue.trim()) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:3000/api/universities/${id}`, {
                name: editValue
            }, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setUniversities(universities.map(u => u.id === id ? { ...u, name: editValue } : u));
            setEditingId(null);
            setEditValue('');
        } catch (error) {
            console.error('Failed to update university', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure? This might affect student records.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/api/universities/${id}`, {
                headers: { Authorization: 'Bearer ' + token }
            });
            setUniversities(universities.filter(u => u.id !== id));
        } catch (error) {
            console.error('Failed to delete university', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-800">Manage Universities</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <p className="text-center text-gray-500">Loading...</p>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handleAdd} className="flex gap-2">
                                <Input
                                    placeholder="Add new university..."
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" size="sm">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </form>

                            <div className="space-y-2 mt-4">
                                {universities.map(uni => (
                                    <div key={uni.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                        {editingId === uni.id ? (
                                            <div className="flex gap-2 flex-1 items-center">
                                                <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                <button onClick={() => handleUpdate(uni.id)} className="text-green-600 hover:bg-green-100 p-1 rounded">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-gray-200 p-1 rounded">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-medium text-gray-700">{uni.name}</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingId(uni.id); setEditValue(uni.name); }} className="text-blue-500 hover:bg-blue-100 p-1 rounded">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(uni.id)} className="text-red-500 hover:bg-red-100 p-1 rounded">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {universities.length === 0 && (
                                    <p className="text-center text-gray-400 text-sm py-4">No universities found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UniversityManager;
