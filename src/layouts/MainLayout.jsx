import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto space-y-6">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
