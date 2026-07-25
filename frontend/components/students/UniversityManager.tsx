import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Check, Edit2, Trash2, Plus } from 'lucide-react';
import {
  useUniversities,
  useCreateUniversity,
  useUpdateUniversity,
  useDeleteUniversity,
} from '../../hooks/useUniversities';

interface UniversityManagerProps {
  onClose: () => void;
}

const UniversityManager: React.FC<UniversityManagerProps> = ({ onClose }) => {
  const { data: universities = [], isLoading: loading } = useUniversities();
  const createUniversity = useCreateUniversity();
  const updateUniversity = useUpdateUniversity();
  const deleteUniversity = useDeleteUniversity();
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await createUniversity.mutateAsync(newItem.trim());
      setNewItem('');
    } catch (error) {
      console.error('Failed to add university', error);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editValue.trim()) return;
    try {
      await updateUniversity.mutateAsync({ id, name: editValue.trim() });
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update university', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This might affect student records.')) return;
    try {
      await deleteUniversity.mutateAsync(id);
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

        <div className="p-4 border-b">
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new university..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newItem.trim() || createUniversity.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
          ) : (
            <>
              {universities.map((uni) => (
                <div key={uni.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group">
                  {editingId === uni.id ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(uni.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{uni.name}</span>
                      <button
                        onClick={() => {
                          setEditingId(uni.id);
                          setEditValue(uni.name);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(uni.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {universities.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">No universities found.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversityManager;
