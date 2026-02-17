import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Modal from '../ui/Modal';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    onNameChange: (value: string) => void;
    onSave: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
    isOpen,
    onClose,
    templateName,
    onNameChange,
    onSave,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Save As Template" size="sm">
            <div className="space-y-4">
                <Input label="Template Name" value={templateName} onChange={e => onNameChange(e.target.value)} placeholder="e.g. Standard Dissertation" />
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={onSave}>Save</Button>
                </div>
            </div>
        </Modal>
    );
};

export default TemplateModal;
