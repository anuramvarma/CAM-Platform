import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    School,
    Users,
    FileSignature,
    UserCog,
    LogOut,
    Menu,
    X,
    Shield,
    Moon,
    Sun
} from 'lucide-react';

export const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Theme state
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const links = [
        { to: '/', label: 'Home', icon: LayoutDashboard },
        { to: '/classes', label: 'Manage classes', icon: School },
        { to: '/students', label: 'Manage Students', icon: Users },
        { to: '/permissions', label: 'Manage Permissions', icon: FileSignature },
        { to: '/crs', label: 'Manage CRs', icon: UserCog },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 z-50 transition-colors duration-300">
                <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    HoD Portal
                </div>
                <button onClick={toggleSidebar} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
                flex flex-col transition-transform duration-300 z-40
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                pt-16 md:pt-0 shadow-xl md:shadow-none
            `}>
                <div className="hidden md:flex items-center gap-2 px-6 h-16 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">HoD Portal</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
                                }
                            `}
                        >
                            <link.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-gray-50/30 dark:bg-gray-900/30">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform" />
                                <span className="font-medium">Dark Mode</span>
                            </>
                        ) : (
                            <>
                                <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-45 transition-transform" />
                                <span className="font-medium">Light Mode</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};
