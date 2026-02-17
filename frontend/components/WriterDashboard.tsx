import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DataService from '../services/dataService';
import { WriterPerformanceProfile, DashboardPerformance, Assignment, Achievement } from '../types';

const WriterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [writer, setWriter] = useState<WriterPerformanceProfile | null>(null);
  const [performance, setPerformance] = useState<DashboardPerformance | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [leaderboard, setLeaderboard] = useState<{ name: string; totalEarnings: number }[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await DataService.getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const storedWriterData = localStorage.getItem('writer');
    if (!storedWriterData) {
      navigate('/writer-login');
      return;
    }

    const parsedData = JSON.parse(storedWriterData);
    const writerInfo = parsedData.writer || parsedData; // Compatibility fallback

    // Interim state from local storage (might miss some fields like rating/streak until fetch completes)
    setWriter(writerInfo);
    fetchDashboardData(writerInfo.id);
  }, [navigate]);

  const fetchDashboardData = async (writerId: number) => {
    try {
      const data = await DataService.getWriterDashboardData(writerId);
      setWriter(data.writer);
      setPerformance(data.performance);
      setAssignments(data.assignments);
      setAchievements(data.achievements);
      setAvailableAssignments(data.availableAssignments);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('writer');
    navigate('/writer-login');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'bg-amber-100 text-amber-800';
      case 'Silver': return 'bg-gray-200 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!writer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Unable to load dashboard</h2>
          <button
            onClick={handleLogout}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }



  const filteredAssignments = assignments.filter((assignment) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Completed') return assignment.status.toLowerCase() === 'completed';
    if (activeTab === 'In Progress') return assignment.status.toLowerCase() === 'in progress' || assignment.status.toLowerCase() === 'in-progress';
    if (activeTab === 'Pending') return assignment.status.toLowerCase() === 'pending';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-900">WriterHub</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{writer?.name}</p>
                    <p className="text-xs text-gray-500">Writer ID: {writer?.id}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">{writer?.name.charAt(0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="mesh-gradient-primary rounded-2xl shadow-ios-lg p-8 mb-8 relative overflow-hidden group">
          <div className="absolute inset-0 shimmer opacity-20 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {writer?.name.split(' ')[0]}!</h1>
              <p className="mt-2 text-white/80 font-medium">You have {assignments.length} assignments to manage today. Keep it up!</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="text-3xl font-bold text-white">{writer?.points}</div>
                <div className="text-xs text-white/70 font-semibold uppercase tracking-wider">Points</div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getLevelColor(writer?.level || 'Bronze')}`}>
                {writer?.level} Level
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Left 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-700">{performance?.completionRate || 0}%</div>
                  <div className="text-sm text-blue-600 mt-1">Completion Rate</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-amber-700">
                    {(performance?.averageRating ?? 0).toFixed(1)}
                  </div>
                  <div className="text-sm text-amber-600 mt-1">Avg Rating</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-700">{performance?.onTimeRate || 0}%</div>
                  <div className="text-sm text-green-600 mt-1">On-Time Delivery</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-700">₹{performance?.totalEarnings || 0}</div>
                  <div className="text-sm text-purple-600 mt-1">Total Earnings</div>
                </div>
              </div>
            </div>

            {/* Your Assignments with Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Assignments</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {assignments.length} Total
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex p-1 space-x-1 bg-gray-100 rounded-xl">
                  {['All', 'Pending', 'In Progress', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab
                        ? 'bg-white text-gray-900 shadow'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredAssignments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment, index) => (
                    <div key={assignment.id || `assignment-${index}`} className="border border-gray-100 rounded-xl p-5 bg-white hover:bg-gray-50/50 hover-lift hover:shadow-premium transition-all duration-300">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">₹{assignment.writerPrice}</div>
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(assignment.status as string).toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                            (assignment.status as string).toLowerCase() === 'in progress' || (assignment.status as string).toLowerCase() === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {assignment.status}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} assignments found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'All' ? 'Your assigned tasks will appear here.' : 'Changing filters might help.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right 1/3) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Leaderboard */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Top Earners</h2>
                <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="space-y-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((earner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-200 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white border border-gray-200 text-gray-600'}
                        `}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[120px]" title={earner.name}>{earner.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-700">₹{earner.totalEarnings.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">Loading leaderboard...</div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-center text-gray-400">Updates every 24 hours</p>
              </div>
            </div>

            {/* Available Assignments (moved here from hypothetical list) or just keep minimal */}
            {/* We could add the 'Available Assignments' here if we wanted, but user didn't ask explicitly. */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default WriterDashboard;
