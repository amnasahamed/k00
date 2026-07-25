import React from 'react';
import { Button } from '../ui/Button';
import Modal from '../ui/Modal';

interface AssignmentDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    count?: number;
}

const AssignmentDeleteModal: React.FC<AssignmentDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    count,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delete" size="sm">
            <div className="space-y-4">
                <p className="text-secondary-600">Are you sure you want to delete {count ? `these ${count} assignments` : 'this assignment'}? This action cannot be undone.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>Delete</Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignmentDeleteModal;
