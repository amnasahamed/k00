import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Student, Writer, Assignment } from '../types';
import * as DataService from '../services/dataService';

// Search Context for triggering from Layout
interface SearchContextType {
    openSearch: () => void;
}
export const SearchContext = createContext<SearchContextType>({ openSearch: () => {} });
export const useSearch = () => useContext(SearchContext);

interface SearchResult {
    id: string;
    type: 'student' | 'writer' | 'assignment';
    title: string;
    subtitle: string;
    navigateTo: string;
    navigateState?: any;
}

const RECENT_SEARCHES_KEY = 'taskmaster-recent-searches';
const MAX_RECENT = 5;

interface GlobalSearchProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onOpenChange }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Cached data
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allWriters, setAllWriters] = useState<Writer[]>([]);
    const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) setRecentSearches(JSON.parse(stored));
        } catch {}
    }, []);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onOpenChange(!isOpen);
            }
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            if (!dataLoaded) fetchData();
        } else {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [students, writers, assignments] = await Promise.all([
                DataService.getStudents(),
                DataService.getWriters(),
                DataService.getAssignments()
            ]);
            setAllStudents(students);
            setAllWriters(writers);
            setAllAssignments(assignments);
            setDataLoaded(true);
        } catch (error) {
            console.error('Failed to fetch search data', error);
        }
    };

    const search = useCallback((q: string) => {
        const term = q.toLowerCase().trim();
        if (!term) {
            setResults([]);
            return;
        }

        const searchResults: SearchResult[] = [];

        // Search students
        allStudents
            .filter(s =>
                s.name.toLowerCase().includes(term) ||
                s.email.toLowerCase().includes(term) ||
                s.university?.toLowerCase().includes(term)
            )
            .slice(0, 5)
            .forEach(s => searchResults.push({
                id: s.id,
                type: 'student',
                title: s.name,
                subtitle: s.university || s.email,
                navigateTo: '/students',
                navigateState: { selectStudent: s.id }
            }));

        // Search writers
        allWriters
            .filter(w =>
                w.name.toLowerCase().includes(term) ||
                w.specialty?.toLowerCase().includes(term)
            )
            .slice(0, 5)
            .forEach(w => searchResults.push({
                id: String(w.id),
                type: 'writer',
                title: w.name,
                subtitle: w.specialty || 'Generalist',
                navigateTo: '/writers',
                navigateState: { selectWriter: w.id }
            }));

        // Search assignments
        allAssignments
            .filter(a =>
                a.title.toLowerCase().includes(term) ||
                a.subject.toLowerCase().includes(term)
            )
            .slice(0, 5)
            .forEach(a => searchResults.push({
                id: a.id,
                type: 'assignment',
                title: a.title,
                subtitle: `${a.type} - ${a.subject}`,
                navigateTo: '/assignments',
                navigateState: { highlightId: a.id }
            }));

        setResults(searchResults);
        setSelectedIndex(0);
    }, [allStudents, allWriters, allAssignments]);

    // Search on query change
    useEffect(() => {
        search(query);
    }, [query, search]);

    const saveRecentSearch = (term: string) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    };

    const handleSelect = (result: SearchResult) => {
        saveRecentSearch(query);
        onOpenChange(false);
        navigate(result.navigateTo, { state: result.navigateState });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (resultsRef.current) {
            const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
            if (selected) selected.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const getTypeIcon = (type: 'student' | 'writer' | 'assignment') => {
        switch (type) {
            case 'student':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
            case 'writer':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
            case 'assignment':
                return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
        }
    };

    const getTypeLabel = (type: 'student' | 'writer' | 'assignment') => {
        switch (type) {
            case 'student': return 'Student';
            case 'writer': return 'Writer';
            case 'assignment': return 'Task';
        }
    };

    const getTypeColor = (type: 'student' | 'writer' | 'assignment') => {
        switch (type) {
            case 'student': return 'bg-blue-50 text-blue-600';
            case 'writer': return 'bg-emerald-50 text-emerald-600';
            case 'assignment': return 'bg-amber-50 text-amber-600';
        }
    };

    // Group results by type
    const groupedResults: { type: 'student' | 'writer' | 'assignment'; items: SearchResult[] }[] = [];
    const types: ('student' | 'writer' | 'assignment')[] = ['student', 'writer', 'assignment'];
    types.forEach(type => {
        const items = results.filter(r => r.type === type);
        if (items.length > 0) groupedResults.push({ type, items });
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => onOpenChange(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" />

            {/* Search Panel */}
            <div
                className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search students, writers, tasks..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto" ref={resultsRef}>
                    {query && results.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-400">No results for "{query}"</p>
                        </div>
                    )}

                    {query && groupedResults.map(group => {
                        let flatIndex = 0;
                        for (const g of groupedResults) {
                            if (g.type === group.type) break;
                            flatIndex += g.items.length;
                        }

                        return (
                            <div key={group.type}>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {getTypeLabel(group.type)}s
                                    </span>
                                </div>
                                {group.items.map((result, idx) => {
                                    const globalIdx = flatIndex + idx;
                                    return (
                                        <button
                                            key={result.id}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${globalIdx === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                                            onClick={() => handleSelect(result)}
                                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(result.type)}`}>
                                                {getTypeIcon(result.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                                                <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Recent Searches (when no query) */}
                    {!query && recentSearches.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent</span>
                            </div>
                            {recentSearches.map((term, idx) => (
                                <button
                                    key={idx}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                    onClick={() => setQuery(term)}
                                >
                                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-600">{term}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {!query && recentSearches.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm text-gray-400">Search across students, writers, and tasks</p>
                            <p className="text-xs text-gray-300 mt-1">Type to start searching</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-4 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
                            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↵</kbd>
                            select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200">esc</kbd>
                            close
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
