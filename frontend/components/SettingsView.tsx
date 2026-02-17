// Debounce utility function
const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useToast } from './Layout';
import * as DataService from '../services/dataService';

interface UserProfile {
    businessName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
}

const SettingsView: React.FC = () => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<UserProfile>({
        businessName: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
    });

    useEffect(() => {
        // Load profile from localStorage
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            try {
                setProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error('Failed to parse saved profile', e);
            }
        }
    }, []);

    // Auto-save profile changes with debounce
    const debouncedSave = useCallback(
        debounce((profileData: UserProfile) => {
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            addToast('Profile saved automatically', 'success');
        }, 1000),
        [addToast]
    );

    // Update profile with auto-save
    const updateProfile = (updates: Partial<UserProfile>) => {
        const updatedProfile = { ...profile, ...updates };
        setProfile(updatedProfile);
        debouncedSave(updatedProfile);
    };

    // Manual save (for immediate feedback)
    const saveProfile = () => {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        addToast('Profile saved successfully', 'success');
    };

    const handleBackup = async () => {
        try {
            const data = await DataService.getExportData();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `taskmaster_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addToast('Backup downloaded successfully', 'success');
        } catch (error) {
            console.error("Backup failed", error);
            addToast('Backup failed', 'error');
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            try {
                if (await DataService.importData(content)) {
                    addToast('Data restored successfully! reloading...', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    addToast('Failed to restore data. Invalid file.', 'error');
                }
            } catch (error) {
                console.error("Restore failed", error);
                addToast('Restore failed', 'error');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleResetApp = async () => {
        if (confirm('DANGER: This will wipe all your data permanently. Are you absolutely sure?')) {
            if (confirm('Last Warning: Cannot be undone. Click OK to confirm.')) {
                await DataService.clearAllData();
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* User Profile */}
                <Card title="Business Profile">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Business Name</label>
                            <input
                                type="text"
                                className="w-full bg-gray-100 border-none rounded-apple px-4 py-3 focus:ring-2 focus:ring-primary/20"
                                placeholder="Your Business Name"
                                value={profile.businessName}
                                onChange={e => updateProfile({ businessName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Contact Email</label>
                            <input
                                type="email"
                                className="w-full bg-gray-100 border-none rounded-apple px-4 py-3 focus:ring-2 focus:ring-primary/20"
                                placeholder="business@example.com"
                                value={profile.contactEmail}
                                onChange={e => updateProfile({ contactEmail: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Contact Phone</label>
                            <input
                                type="tel"
                                className="w-full bg-gray-100 border-none rounded-apple px-4 py-3 focus:ring-2 focus:ring-primary/20"
                                placeholder="+91 XXXXX XXXXX"
                                value={profile.contactPhone}
                                onChange={e => updateProfile({ contactPhone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Address</label>
                            <textarea
                                className="w-full bg-gray-100 border-none rounded-apple px-4 py-3 focus:ring-2 focus:ring-primary/20 resize-none"
                                placeholder="Business Address"
                                rows={3}
                                value={profile.address}
                                onChange={e => updateProfile({ address: e.target.value })}
                            />
                        </div>
                        <Button onClick={saveProfile} className="w-full justify-center">Save Profile</Button>
                    </div>
                </Card>

                <Card title="Data Management">
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-apple border border-primary/10">
                            <h4 className="font-bold text-primary-900 mb-1">Backup Your Business</h4>
                            <p className="text-sm text-primary-700 mb-3">
                                Your data is currently stored only on this device. Download a backup file regularly to prevent data loss.
                            </p>
                            <Button onClick={handleBackup} className="w-full justify-center">
                                Download Backup (.json)
                            </Button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-apple border border-gray-100">
                            <h4 className="font-bold text-gray-900 mb-1">Restore Data</h4>
                            <p className="text-sm text-gray-500 mb-3">
                                Restore from a previously saved .json file. This will overwrite current data.
                            </p>
                            <input
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button variant="secondary" onClick={handleRestoreClick} className="w-full justify-center">
                                Upload Backup File
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card title="App Info">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">App Name</span>
                            <span className="font-semibold">k0nach!</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">Version</span>
                            <span className="font-semibold">1.2.0</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-500">Currency</span>
                            <span className="font-semibold">INR (₹)</span>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={handleResetApp}
                                className="w-full py-3 rounded-apple border-2 border-danger/10 text-red-600 font-bold text-sm hover:bg-danger/5 transition-colors"
                            >
                                Reset Application (Wipe Data)
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;