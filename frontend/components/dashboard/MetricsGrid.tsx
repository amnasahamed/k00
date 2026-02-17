import React from 'react';
import Card from '../ui/Card';

interface MetricsGridProps {
    stats: { totalPending: number; totalOverdue: number; pendingAmount: number; pendingWriterPay: number; activeDissertations: number };
    netProfit: number;
    formatCurrency: (amount: number) => string;
    goToPending: () => void;
    goToOverdue: () => void;
    goToIncoming: () => void;
    goToOutgoing: () => void;
    goToPayments: () => void;
}

const MetricsGrid: React.FC<MetricsGridProps> = ({ stats, netProfit, formatCurrency, goToPending, goToOverdue, goToIncoming, goToOutgoing, goToPayments }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            <Card className="bg-white hover:shadow-ios-lg transition-apple cursor-pointer group border border-secondary-100/50" onClick={goToPending} noPadding>
                <div className="p-4 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-2">Pending Tasks</p>
                        <p className="text-3xl font-bold text-secondary-900 group-hover:text-primary transition-apple">{stats.totalPending}</p>
                    </div>
                    <div className="p-2.5 bg-primary/5 rounded-apple text-primary group-hover:bg-primary/10 transition-apple">
                        <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                </div>
            </Card>
            <Card className="bg-white hover:shadow-ios-lg transition-apple cursor-pointer group border border-secondary-100/50" onClick={goToOverdue} noPadding>
                <div className="p-4 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-danger-500 uppercase tracking-widest mb-2">Overdue</p>
                        <p className="text-3xl font-bold text-danger-600">{stats.totalOverdue}</p>
                    </div>
                    <div className="p-2.5 bg-danger/5 rounded-apple text-danger group-hover:bg-danger/10 transition-apple">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
            </Card>
            <Card className="bg-white hover:shadow-ios-lg transition-apple cursor-pointer group border border-secondary-100/50" onClick={goToIncoming} noPadding>
                <div className="p-4 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-success-500 uppercase tracking-widest mb-2">To Collect</p>
                        <p className="text-2xl md:text-3xl font-bold text-secondary-900 group-hover:text-success transition-apple">{formatCurrency(stats.pendingAmount)}</p>
                        <p className="text-[9px] text-secondary-400 font-bold uppercase mt-1">From Students</p>
                    </div>
                    <div className="p-2.5 bg-success/5 rounded-apple text-success group-hover:bg-success/10 transition-apple">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
            </Card>
            <Card className="bg-white hover:shadow-ios-lg transition-apple cursor-pointer group border border-secondary-100/50" onClick={goToOutgoing} noPadding>
                <div className="p-4 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-warning-500 uppercase tracking-widest mb-2">To Pay</p>
                        <p className="text-2xl md:text-3xl font-bold text-secondary-900 group-hover:text-warning transition-apple">{formatCurrency(stats.pendingWriterPay)}</p>
                        <p className="text-[9px] text-secondary-400 font-bold uppercase mt-1">To Writers</p>
                    </div>
                    <div className="p-2.5 bg-warning/5 rounded-apple text-warning group-hover:bg-warning/10 transition-apple">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                </div>
            </Card>
            <Card className="mesh-gradient-premium text-white hover:shadow-ios-lg transition-all duration-300 ease-apple cursor-pointer relative overflow-hidden group" onClick={goToPayments}>
                <div className="absolute inset-0 shimmer opacity-10 pointer-events-none"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1.5">Net Profit</p>
                        <p className="text-2xl md:text-3xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(netProfit)}</p>
                        <p className="text-[10px] text-white/60 font-medium mt-1">All Time</p>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-apple backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MetricsGrid;
