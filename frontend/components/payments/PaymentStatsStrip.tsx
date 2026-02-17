import React from 'react';
import { formatCurrency } from '../../utils/format';

interface PaymentStatsStripProps {
    stats: {
        total: number;
        paid: number;
        pending: number;
        labelTotal: string;
        labelPaid: string;
        labelPending: string;
    };
}

const PaymentStatsStrip: React.FC<PaymentStatsStripProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-apple-lg shadow-ios border border-secondary-100/50 text-center group hover:shadow-ios-md transition-apple">
                <p className="text-[9px] text-secondary-400 uppercase font-black tracking-widest mb-1 group-hover:text-primary transition-apple">{stats.labelTotal}</p>
                <p className="text-xl font-black text-secondary-900 tracking-tight">{formatCurrency(stats.total)}</p>
            </div>
            <div className="bg-success/5 p-4 rounded-apple-lg shadow-ios border border-success-100 text-center group hover:shadow-ios-md transition-apple">
                <p className="text-[9px] text-success-500 uppercase font-black tracking-widest mb-1">{stats.labelPaid}</p>
                <p className="text-xl font-black text-success-600 tracking-tight">{formatCurrency(stats.paid)}</p>
            </div>
            <div className="bg-danger/5 p-4 rounded-apple-lg shadow-ios border border-danger-100 text-center group hover:shadow-ios-md transition-apple">
                <p className="text-[9px] text-danger-500 uppercase font-black tracking-widest mb-1">{stats.labelPending}</p>
                <p className="text-xl font-black text-danger-600 tracking-tight">{formatCurrency(stats.pending)}</p>
            </div>
        </div>
    );
};

export default PaymentStatsStrip;
