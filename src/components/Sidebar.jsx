import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Factory, BarChart3, Settings, LogOut, Wrench, Database, Package, Users, Cog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Visão Geral',      path: '/dashboard' },
        { icon: Package,         label: 'Expedição',         path: '/expedicao' },
        { icon: Database,        label: 'Ativos Indústria',  path: '/ativos' },
        { icon: Wrench,          label: 'Manutenção (TPM)',   path: '/manutencao' },
        { icon: BarChart3,       label: 'Analista',           path: '/analista' },
        { icon: Users,           label: 'Administração',      path: '/admin' },
        { icon: Cog,             label: 'Configurações',      path: '/configuracoes' },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-2xl z-50">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/50">
                    D
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-wide">DashOperações</h1>
                    <p className="text-xs text-slate-400">Sistema Integrado</p>
                </div>
            </div>

            {/* Usuário logado */}
            {user && (
                <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {user.nome?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{user.nome}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{user.perfil}</p>
                    </div>
                </div>
            )}

            {/* Navegação */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-slate-800 text-blue-400 border-l-4 border-blue-500 pl-3'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
