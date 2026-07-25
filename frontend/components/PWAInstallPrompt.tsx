import React, { useState, useEffect } from 'react';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    return (
        <>
            {/* Offline Banner */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center py-1.5 text-xs font-medium shadow-lg animate-in slide-in-from-top duration-300">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                        </svg>
                        You're offline. Some features may be limited.
                    </div>
                </div>
            )}

            {/* Install Banner */}
            {showBanner && (
                <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[60] animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Install k0nach!</p>
                            <p className="text-xs text-gray-500">Add to your home screen</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
                            >
                                Install
                            </button>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PWAInstallPrompt;
