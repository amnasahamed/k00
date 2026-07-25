import React from 'react';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

interface AssignmentRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    ratingStats: { quality: number; punctuality: number };
    onRatingChange: (stats: { quality: number; punctuality: number }) => void;
    onSubmit: () => void;
}

const AssignmentRatingModal: React.FC<AssignmentRatingModalProps> = ({
    isOpen,
    onClose,
    ratingStats,
    onRatingChange,
    onSubmit,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rate Writer Performance" size="sm">
            <div className="space-y-6">
                <p className="text-sm text-secondary-600">Please rate the writer's performance on this finished task.</p>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-700">Quality</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => onRatingChange({ ...ratingStats, quality: star })} className={`text-2xl ${star <= ratingStats.quality ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-secondary-700">Punctuality</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} type="button" onClick={() => onRatingChange({ ...ratingStats, punctuality: star })} className={`text-2xl ${star <= ratingStats.punctuality ? 'text-amber-400' : 'text-slate-200'}`}>★</button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={onClose}>Skip</Button>
                    <Button onClick={onSubmit}>Submit Rating</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignmentRatingModal;
