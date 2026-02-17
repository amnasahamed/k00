import { AssignmentStatus, AssignmentPriority } from '../types';

export const getStatusStyles = (status: AssignmentStatus) => {
    switch (status) {
        case AssignmentStatus.COMPLETED: return { card: '!bg-emerald-50/80 border border-emerald-100 shadow-sm', row: 'bg-emerald-50/30 hover:bg-emerald-50/60', select: 'bg-emerald-100 text-emerald-800' };
        case AssignmentStatus.IN_PROGRESS: return { card: '!bg-blue-50/80 border border-blue-100 shadow-sm', row: 'bg-blue-50/30 hover:bg-blue-50/60', select: 'bg-blue-100 text-blue-700' };
        case AssignmentStatus.REVIEW: return { card: '!bg-amber-50/80 border border-amber-100 shadow-sm', row: 'bg-amber-50/30 hover:bg-amber-50/60', select: 'bg-amber-100 text-amber-800' };
        case AssignmentStatus.CANCELLED: return { card: '!bg-red-50/80 border border-red-100 shadow-sm', row: 'bg-red-50/30 hover:bg-red-50/60', select: 'bg-red-100 text-red-700' };
        default: return { card: '!bg-white border-transparent', row: 'hover:bg-slate-50', select: 'bg-slate-100 text-slate-700' };
    }
};

export const getPriorityColor = (priority: AssignmentPriority) => {
    switch (priority) {
        case AssignmentPriority.HIGH: return 'danger';
        case AssignmentPriority.MEDIUM: return 'warning';
        case AssignmentPriority.LOW: return 'success';
        default: return 'neutral';
    }
};

export const getPriorityColorDashboard = (priority: AssignmentPriority) => {
    switch (priority) {
        case AssignmentPriority.HIGH: return 'text-red-600 bg-red-100';
        case AssignmentPriority.MEDIUM: return 'text-yellow-600 bg-yellow-100';
        case AssignmentPriority.LOW: return 'text-green-600 bg-green-100';
        default: return 'text-slate-600 bg-slate-100';
    }
};
