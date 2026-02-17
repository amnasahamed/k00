import React from 'react';
import Card from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

interface WorkloadPieChartProps {
    statusData: any[];
}

const WorkloadPieChart: React.FC<WorkloadPieChartProps> = ({ statusData }) => {
    return (
        <Card noPadding className="h-[320px] overflow-hidden">
            <div className="p-4 border-b border-secondary-100/50">
                <h3 className="font-bold text-secondary-900 text-sm tracking-tight uppercase">Status Distribution</h3>
            </div>
            <div className="h-[240px] w-full p-2">
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
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
                        <Legend
                            verticalAlign="bottom"
                            height={40}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{
                                fontSize: '9px',
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                paddingBottom: '10px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default WorkloadPieChart;
