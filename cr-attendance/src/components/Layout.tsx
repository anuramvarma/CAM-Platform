import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Menu, X, Home, BookOpen, Users, Calendar, Clock, LogOut, User, Moon, Sun, MoreHorizontal, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProfileModal } from './ProfileModal';
import { useTheme } from '../context/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const { logout, resetApp, settings } = useApp();
    const { theme, toggleTheme } = useTheme();

    const location = useLocation();

    const navItems = [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Our Subjects', path: '/subjects', icon: BookOpen },
<<<<<<< HEAD
        { label: 'Students Info', path: '/students', icon: Users },
        { label: 'Permissions', path: '/permissions', icon: Calendar },
        { label: 'History', path: '/history', icon: Clock },
        { label: 'Help', path: '/help', icon: HelpCircle },
=======
        { label: 'Students Info ', path: '/students', icon: Users },
        { label: 'Permissions', path: '/permissions', icon: Calendar },
        { label: 'History ', path: '/history', icon: Clock },
>>>>>>> 232cde9a4f21dac0d85975952f9dbfb6934f8a70
        { label: 'Misc', path: '/misc', icon: MoreHorizontal },
    ];

    const handleLogout = () => logout();

    const handleReset = () => {
        if (confirm('WARNING: This will delete ALL data permanently. Are you sure?')) {
            resetApp();
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors">

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 w-full bg-indigo-600 dark:bg-gray-900 text-white z-50 px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <h1 className="font-bold text-lg">{settings.className || 'CR Attendance'}</h1>
                </div>
                <button onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {
                                settings.className
                                    ? `VITB ${settings.className.split(' ')[0]}`
                                    : ''
                            }
                        </h2>
                        <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                            <X size={20} className="text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}
                  `}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
              text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>

                        <button
                            onClick={() => {
                                setSidebarOpen(false);
                                setShowProfile(true);
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
              text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            <User size={20} />
                            My Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
              text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>

                        <button
                            onClick={handleReset}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
              text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
                        >
                            Reset App Data
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pt-14 lg:pt-0 lg:ml-64 min-w-0">
                <div className="p-4 lg:p-8 max-w-5xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Modals */}
            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
        </div>
    );
};
