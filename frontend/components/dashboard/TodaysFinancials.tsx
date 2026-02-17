import React from 'react';

interface TodaysFinancialsProps {
    earned: number;
    collected: number;
    formatCurrency: (amount: number) => string;
}

const TodaysFinancials: React.FC<TodaysFinancialsProps> = ({ earned, collected, formatCurrency }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earned > 0 && (
                <div className="mesh-gradient-primary rounded-apple-lg p-6 text-white shadow-ios-lg animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.05s' }}>
                    <div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-2">Potential Collection Today</p>
                            <p className="text-4xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(earned)}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-apple-lg backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                </div>
            )}
            {collected > 0 && (
                <div className="mesh-gradient-success rounded-apple-lg p-6 text-white shadow-ios-lg animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-2">Collected Today</p>
                            <p className="text-4xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(collected)}</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-apple-lg backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodaysFinancials;
