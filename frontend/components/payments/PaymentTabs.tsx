import React from 'react';

type PaymentType = 'incoming' | 'outgoing' | 'finance';

interface PaymentTabsProps {
    activeTab: PaymentType;
    onTabChange: (tab: PaymentType) => void;
}

const PaymentTabs: React.FC<PaymentTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="bg-secondary-100/50 p-1 rounded-apple-lg border border-secondary-200/50 backdrop-blur-md flex shadow-ios-sm">
            <button
                onClick={() => onTabChange('incoming')}
                className={`flex-1 py-2 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple duration-300 ${activeTab === 'incoming' ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100' : 'text-secondary-400 hover:text-secondary-600'}`}
            >
                Incoming
            </button>
            <button
                onClick={() => onTabChange('outgoing')}
                className={`flex-1 py-2 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple duration-300 ${activeTab === 'outgoing' ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100' : 'text-secondary-400 hover:text-secondary-600'}`}
            >
                Outgoing
            </button>
            <button
                onClick={() => onTabChange('finance')}
                className={`flex-1 py-2 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple duration-300 ${activeTab === 'finance' ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100' : 'text-secondary-400 hover:text-secondary-600'}`}
            >
                Reports
            </button>
        </div>
    );
};

export default PaymentTabs;
