import React from 'react';
import { Writer, Assignment, AssignmentStatus } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/format';
import { Select } from '../ui/Select';

interface WriterDetailsProps {
    writer: Writer;
    assignments: Assignment[];
    onEdit: (writer: Writer) => void;
    onDelete: (id: string) => void;
    onWriterChange: (writer: Writer) => void;
}

const WriterDetails: React.FC<WriterDetailsProps> = ({ writer, assignments, onEdit, onDelete, onWriterChange }) => {
    const writerAssignments = assignments.filter(a => String(a.writerId) === String(writer.id));
    const pending = writerAssignments.filter(a => a.status !== AssignmentStatus.COMPLETED && a.status !== AssignmentStatus.CANCELLED);
    const completed = writerAssignments.filter(a => a.status === AssignmentStatus.COMPLETED);

    const openWhatsApp = (number: string) => {
        const cleanNum = number.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanNum}`, '_blank');
    };

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
                <div className="flex gap-2 text-[10px] font-bold">
                    <Badge variant="neutral">{a.type}</Badge>
                    <span className="text-secondary-400 uppercase tracking-widest mt-0.5">Due: {new Date(a.deadline).toLocaleDateString()}</span>
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
                        onClick={() => onEdit(writer)}
                        className="p-2 bg-secondary-100 text-secondary-600 rounded-full hover:bg-secondary-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(String(writer.id))} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Card className="text-center border-secondary-200 bg-secondary-50" noPadding>
                    <div className="p-3">
                        <p className="text-[10px] text-secondary-400 uppercase font-bold tracking-wide mb-1">Quality</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-bold text-secondary-800">{writer.rating?.quality || 'N/A'}</span>
                            {writer.rating && renderStars(writer.rating.quality)}
                        </div>
                        <div className="space-y-1 mt-3">
                            <label className="text-[10px] text-secondary-400 font-bold uppercase ml-1 block">Availability Status</label>
                            <Select
                                value={writer.availabilityStatus || 'available'}
                                onChange={e => onWriterChange({ ...writer, availabilityStatus: e.target.value as any })}
                                options={[
                                    { value: 'available', label: 'Available' },
                                    { value: 'busy', label: 'Busy' },
                                    { value: 'vacation', label: 'On Vacation' }
                                ]}
                            />
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

            <Card className="bg-primary/5 border-primary/10" noPadding>
                <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Active Tasks</h4>
                        <Badge variant="info">{pending.length}</Badge>
                    </div>
                    {pending.length > 0 ? (
                        <div className="bg-white rounded-apple-lg shadow-ios border border-primary/10 divide-y divide-secondary-100">
                            {pending.map(a => <div key={a.id} className="p-3"><AssignmentItem a={a} /></div>)}
                        </div>
                    ) : <p className="text-xs text-primary/50 font-semibold italic">No active assignments.</p>}
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

export default WriterDetails;
