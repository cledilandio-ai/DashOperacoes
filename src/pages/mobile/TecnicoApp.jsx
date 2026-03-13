import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TecnicoApp = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('minhas');

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Técnico */}
            <header className="bg-amber-500 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg">Área do Técnico</h1>
                        <p className="text-xs opacity-80">Olá, {user?.nome}</p>
                    </div>
                    <button onClick={logout} className="px-3 py-1 bg-amber-600 rounded-lg text-sm font-bold shadow-md hover:bg-amber-700">Sair</button>
                </div>
            </header>

            <div className="flex border-b border-amber-200 bg-amber-100/50">
                <button
                    onClick={() => setActiveTab('minhas')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 ${activeTab === 'minhas' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500'}`}
                >
                    Minhas OS (0)
                </button>
                <button
                    onClick={() => setActiveTab('pendentes')}
                    className={`flex-1 py-3 text-sm font-bold text-center border-b-2 ${activeTab === 'pendentes' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500'}`}
                >
                    Fila Geral (0)
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Placeholder de Lista Vazia */}
                <div className="text-center py-10 text-slate-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Nenhuma OS em andamento.</p>
                    <p className="text-xs mt-2">Pegue uma OS da fila para começar.</p>
                </div>

                {/* Exemplo de Card de OS (Não funcional ainda) */}
                {/* 
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800">#123 - Empacotadora 01</h3>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Em Andamento</span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">Máquina parou de selar pacote direito. Temperatura oscilando.</p>
                        <div className="flex gap-4 text-xs text-slate-400 mt-2">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> 2h atrás</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3"/> João Silva</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
                            <button className="btn-secondary py-2 text-xs">Apontar</button>
                            <button className="btn-primary py-2 text-xs">Finalizar</button>
                        </div>
                    </div>
                    */}
            </div>
        </div>
    );
};

export default TecnicoApp;
