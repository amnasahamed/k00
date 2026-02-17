import React from 'react';
import Card from '../ui/Card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, ScatterChart, Scatter, ZAxis,
    RadialBarChart, RadialBar, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface FinanceReportsProps {
    monthlyData: any[];
    subjectData: any[];
    seasonalityData: any[];
    topStudentsData: any[];
    writerMatrixData: any[];
    referralScatterData: any[];
    dateRangeFilter: 'all' | 'today' | 'week' | 'month' | 'year';
    onDateRangeChange: (range: 'all' | 'today' | 'week' | 'month' | 'year') => void;
    formatCurrency: (amount: number) => string;
    totalProfit: number;
    profitMargin: number;
    totalStudentDue: number;
    totalSunk: number;
}

const FinanceReports: React.FC<FinanceReportsProps> = ({
    monthlyData,
    subjectData,
    seasonalityData,
    topStudentsData,
    writerMatrixData,
    referralScatterData,
    dateRangeFilter,
    onDateRangeChange,
    formatCurrency,
    totalProfit,
    profitMargin,
    totalStudentDue,
    totalSunk,
}) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Date Range Filter */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-apple-lg border border-secondary-100/50 shadow-ios-sm">
                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Analysis Period:
                </label>
                <div className="flex items-center gap-2 bg-secondary-100/50 p-1 rounded-apple-lg border border-secondary-200/50">
                    {(['all', 'today', 'week', 'month', 'year'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => onDateRangeChange(range)}
                            className={`px-4 py-1.5 rounded-apple text-[10px] font-black uppercase tracking-widest transition-apple ${dateRangeFilter === range
                                ? 'bg-white shadow-ios text-secondary-900 border border-secondary-100'
                                : 'text-secondary-400 hover:text-secondary-600'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards (Always Visible) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary to-primary-600 text-white p-5 rounded-apple-lg shadow-ios-primary border border-primary/20 flex flex-col justify-between">
                    <p className="text-[9px] font-black opacity-80 mb-2 uppercase tracking-widest">Net Profit (After costs)</p>
                    <p className="text-2xl font-black tracking-tight">{formatCurrency(totalProfit)}</p>
                </div>
                <div className="bg-white p-5 rounded-apple-lg shadow-ios border border-secondary-100 hover:shadow-ios-md transition-apple flex flex-col justify-between">
                    <p className="text-[9px] font-black text-secondary-400 mb-2 uppercase tracking-widest">Avg. Profit Margin</p>
                    <p className="text-2xl font-black text-secondary-900 tracking-tight">{profitMargin}%</p>
                </div>
                <div className="bg-white p-5 rounded-apple-lg shadow-ios border border-secondary-100 hover:shadow-ios-md transition-apple flex flex-col justify-between">
                    <p className="text-[9px] font-black text-warning-500 mb-2 uppercase tracking-widest">Receivable (Students)</p>
                    <p className="text-2xl font-black text-warning-600 tracking-tight">{formatCurrency(totalStudentDue)}</p>
                </div>
                <div className="bg-white p-5 rounded-apple-lg shadow-ios border border-secondary-100 hover:shadow-ios-md transition-apple flex flex-col justify-between">
                    <p className="text-[9px] font-black text-danger-500 mb-2 uppercase tracking-widest">Sunk Costs (Writers)</p>
                    <p className="text-2xl font-black text-danger-600 tracking-tight">{formatCurrency(totalSunk)}</p>
                </div>
            </div>

            {/* --- ANALYTICS CONSOLE (Visible on all devices) --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                    <h3 className="text-[11px] font-black text-secondary-400 uppercase tracking-widest">Analytics Console</h3>
                    <div className="h-px bg-secondary-100 flex-1"></div>
                </div>

                {/* ROW 1: Financial & Volume Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Financial Performance Trend" className="h-[360px]">
                        <div className="h-[280px] w-full mt-2 min-h-[280px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                            padding: '8px 12px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}
                                    />
                                    <Bar dataKey="revenue" name="Revenue" fill="#007AFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="cost" name="Cost" fill="#FF3B30" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Job Volume Seasonality" className="h-[360px]">
                        <div className="h-[280px] w-full mt-2 min-h-[280px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                                <AreaChart data={seasonalityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#AF52DE" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#AF52DE" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <RechartsTooltip contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        padding: '8px 12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }} />
                                    <Area type="monotone" dataKey="jobs" stroke="#AF52DE" fillOpacity={1} fill="url(#colorJobs)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* ROW 2: Writer & Client Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Writer Performance Matrix" className="h-[360px]">
                        <p className="text-[10px] text-gray-400 mb-2">Cost/Word vs Quality Rating • Size = Volume</p>
                        <div className="h-[260px] w-full min-h-[260px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={260}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid />
                                    <XAxis type="number" dataKey="x" name="Cost/Word" unit="₹" fontSize={11} />
                                    <YAxis type="number" dataKey="y" name="Rating" domain={[0, 5]} fontSize={11} />
                                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Volume" />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        padding: '8px 12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }} />
                                    <Scatter name="Writers" data={writerMatrixData} fill="#007AFF" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Top 5 VIP Clients (Lifetime Value)" className="h-[360px]">
                        <p className="text-[10px] text-gray-400 mb-1">Rings indicate contribution relative to top earner</p>
                        <div className="h-[280px] w-full min-h-[280px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                                <RadialBarChart
                                    innerRadius="10%"
                                    outerRadius="90%"
                                    data={topStudentsData}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                        background
                                        dataKey="value"
                                        cornerRadius={10}
                                    />
                                    <Legend
                                        iconSize={10}
                                        width={120}
                                        height={140}
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                                    />
                                    <RechartsTooltip contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        padding: '8px 12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* ROW 3: Subject Profitability & Referral Network */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Business Shape (Subject Mix)" className="h-[360px]">
                        <p className="text-[10px] text-gray-400 mb-1">Profit distribution across subjects</p>
                        <div className="h-[280px] w-full min-h-[280px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={subjectData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                                    <Radar
                                        name="Profit"
                                        dataKey="A"
                                        stroke="#AF52DE"
                                        fill="#AF52DE"
                                        fillOpacity={0.6}
                                    />
                                    <RechartsTooltip contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        padding: '8px 12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="Referral Network Impact" className="h-[360px]">
                        <p className="text-[10px] text-gray-400 mb-2">Impact Analysis: Volume (X) vs Revenue (Y) vs Avg Value (Size)</p>
                        <div className="h-[280px] w-full min-h-[280px] min-w-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={280}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="x" name="Referrals Made" fontSize={11} />
                                    <YAxis type="number" dataKey="y" name="Network Revenue" unit="₹" fontSize={11} />
                                    <ZAxis type="number" dataKey="z" range={[60, 600]} name="Avg Value" unit="₹" />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                        padding: '8px 12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }} />
                                    <Scatter name="Referrers" data={referralScatterData} fill="#8B5CF6" shape="circle" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FinanceReports;
