import React, { useState } from 'react';
import { useManutencao } from '../contexts/ManutencaoContext';
import { Package, Plus, Layers, Settings, Database, Folder, ChevronRight, PenTool } from 'lucide-react';
import { useProducao } from '../contexts/ProducaoContext'; // Para pegar maquinas existentes

const Estoque = () => {
    // const { setores, componentes, pecas, addSetor, addComponente, addPeca } = useManutencao(); // Descomentar
    const [activeTab, setActiveTab] = useState('ativos');

    // Estado local simulado (enquanto migração não roda)
    const setores = [];
    const componentes = [];
    const pecas = [];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Ativos & Almoxarifado</h1>
                <p className="text-slate-500">Gestão da Árvore de Ativos (Setor {'>'} Máquina {'>'} Componente) e Estoque de Peças.</p>
            </header>

            <div className="flex border-b border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('ativos')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'ativos' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                >
                    <Folder className="w-4 h-4" /> Árvore de Ativos
                </button>
                <button
                    onClick={() => setActiveTab('pecas')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'pecas' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`}
                >
                    <Database className="w-4 h-4" /> Almoxarifado (Peças)
                </button>
            </div>

            {activeTab === 'ativos' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coluna 1: Setores (Raiz) */}
                    <div className="card h-[600px] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4" /> Setores</h3>
                            <button className="btn-primary p-1 rounded-full w-8 h-8 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            <div className="p-8 text-center text-slate-400 border border-dashed rounded-lg">
                                <p>Nenhum setor cadastrado.</p>
                                <p className="text-xs mt-2">Rode o script SQL primeiro.</p>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2: Máquinas (Nível 2) */}
                    <div className="card h-[600px] flex flex-col opacity-50 pointer-events-none">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Settings className="w-4 h-4" /> Máquinas</h3>
                            <button className="btn-primary p-1 rounded-full w-8 h-8 flex items-center justify-center" disabled><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 text-center text-slate-400">
                            Selecione um setor...
                        </div>
                    </div>

                    {/* Coluna 3: Componentes (Nível 3) */}
                    <div className="card h-[600px] flex flex-col opacity-50 pointer-events-none">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><PenTool className="w-4 h-4" /> Componentes</h3>
                            <button className="btn-primary p-1 rounded-full w-8 h-8 flex items-center justify-center" disabled><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 text-center text-slate-400">
                            Selecione uma máquina para ver componentes (Motor, Correias, etc)...
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pecas' && (
                <div className="card min-h-[400px]">
                    <div className="text-center py-20 text-slate-400">
                        <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-bold mb-2">Controle de Peças de Reposição</h2>
                        <p>Ainda não detectamos a tabela 'pecas' no banco de dados.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estoque;
