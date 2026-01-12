
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans antialiased flex flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-[1600px] mx-auto overflow-y-auto min-h-screen">
                <Outlet />
            </main>
        </div>
    );
};
