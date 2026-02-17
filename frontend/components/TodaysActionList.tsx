import React from 'react';
import { ActionItem } from '../types';
import { useNavigate } from 'react-router-dom';

interface TodaysActionListProps {
  actions: ActionItem[];
  onViewAll?: () => void;
}

const TodaysActionList: React.FC<TodaysActionListProps> = ({ actions, onViewAll }) => {
  const navigate = useNavigate();

  // Show only first 2 actions unless expanded
  const visibleActions = actions.slice(0, 2);

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-apple-lg shadow-ios p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-success/10 rounded-apple">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 tracking-tight">Today's Actions</h3>
            <p className="text-xs text-gray-500 mt-0.5">All caught up!</p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No urgent actions needed. Great work!</p>
        </div>
      </div>
    );
  }

  const getPriorityStyles = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-danger/5 border-l-danger text-danger';
      case 'medium':
        return 'bg-warning/5 border-l-warning text-warning';
      case 'low':
        return 'bg-gray-50 border-l-gray-300 text-gray-600';
    }
  };

  const getTypeIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'payment':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'assignment':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        );
      case 'follow-up':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
    }
  };

  const handleActionClick = (action: ActionItem) => {
    switch (action.type) {
      case 'payment':
        navigate('/payments');
        break;
      case 'assignment':
        navigate('/assignments');
        break;
      case 'review':
        navigate('/assignments', { state: { filterStatus: 'Under Review' } });
        break;
      case 'follow-up':
        navigate('/assignments');
        break;
    }
  };

  return (
    <div className="bg-white rounded-apple-lg shadow-ios p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-apple">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 tracking-tight">Today's Actions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Prioritized by urgency</p>
          </div>
        </div>
        <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          {actions.length} Task{actions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {visibleActions.map((action) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`flex items-start gap-4 p-4 rounded-apple border-l-4 transition-all duration-200 ease-apple cursor-pointer hover:shadow-ios-md active:scale-[0.98] ${getPriorityStyles(action.priority)}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getTypeIcon(action.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm text-gray-900 tracking-tight">{action.title}</h4>
                {action.count && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold">
                    {action.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {(actions.length > 2 || onViewAll) && (
        <button 
          onClick={onViewAll || (() => navigate('/'))}
          className="mt-4 w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center justify-center gap-1"
        >
          {actions.length > 2 ? `View all ${actions.length} actions` : 'View all'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default TodaysActionList;
