import React, { useMemo } from 'react';
import { Student } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Card } from '../ui/Card';

interface StudentAnalyticsProps {
    students: Student[];
    onClose: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ students, onClose }) => {

    // 1. University Distribution
    const universityData = useMemo(() => {
        const counts: Record<string, number> = {};
        students.forEach(s => {
            // Prefer the relation name if available (from backend include), fallback to string field
            const uni = s.University?.name || s.university || 'Unknown';
            counts[uni] = (counts[uni] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [students]);

    const referralData = useMemo(() => {
        // Map referrer ID to list of referred students
        const referrals: Record<string, Student[]> = {};
        students.forEach(s => {
            if (s.referredBy) {
                if (!referrals[s.referredBy]) referrals[s.referredBy] = [];
                referrals[s.referredBy].push(s);
            }
        });

        // Calculate top referrers
        const topReferrers = Object.entries(referrals)
            .map(([referrerId, referredStudents]) => {
                const referrer = students.find(s => s.id === referrerId);
                return {
                    name: referrer ? referrer.name : 'Unknown',
                    value: referredStudents.length
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10

        return topReferrers;
    }, [students]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Student Analytics</h2>
                        <p className="text-gray-500 text-sm">Insights into university distribution and referral networks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-8 bg-gray-50/50 flex-1">
                    {/* University Distribution Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </span>
                            University Distribution
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="h-80 p-4 flex flex-col items-center justify-center">
                                <h4 className="text-sm font-medium text-gray-500 mb-4 self-start w-full text-center">Students by University (Pie)</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={universityData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {universityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                            <Card className="h-80 p-4 flex flex-col items-center justify-center">
                                <h4 className="text-sm font-medium text-gray-500 mb-4 self-start w-full text-center">count by University (Bar)</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={universityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                            {universityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>
                    </section>

                    {/* Referral Network Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="bg-green-100 text-green-600 p-1.5 rounded-lg">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </span>
                            Top Referrers
                        </h3>
                        <Card className="h-96 p-6">
                            {referralData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={referralData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#82ca9d" name="Students Referred" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No referral data available yet.
                                </div>
                            )}
                        </Card>
                    </section>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium">
                        Close Analytics
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
