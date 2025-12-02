import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Table, CheckSquare, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

const Layout = ({ children }) => {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            {/* Sidebar */}
            <div className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col">
                <div className="p-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-accent to-pink-500 bg-clip-text text-transparent">
                        Project Brain
                    </h1>
                    <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide uppercase">AI Construction Assistant</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <NavItem to="/" icon={MessageSquare} label="Chat" />
                    <NavItem to="/extract" icon={Table} label="Extraction" />
                    <NavItem to="/eval" icon={CheckSquare} label="Evaluation" />
                </nav>

                <div className="p-6 space-y-4">
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-xs font-medium text-gray-300">System Online</span>
                        </div>
                        <p className="text-[10px] text-gray-500">v1.0.0 • Gemini 2.5</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Glow Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
                </div>

                {children}
            </div>
        </div>
    );
};

export default Layout;
