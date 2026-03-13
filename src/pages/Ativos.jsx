import React, { useState } from 'react';
import { Factory, Cog, Wrench, Clock, AlertTriangle, CheckCircle, Search, ChevronDown, ChevronRight, Plus, Calendar, Edit3 } from 'lucide-react';
import { useIndustria } from '../contexts/IndustriaContext';
import { calcularDataEstimada, getStatusPreventivaData } from '../utils/industriaLogic';

const Ativos = () => {
    // ✅ TODOS os hooks PRIMEIRO, antes de qualquer return condicional
    const context = useIndustria();
    const { setores = [], maquinas = [], equipamentos = [], addSetor, addMaquina, loading } = context || {};

    const [expandedSetor, setExpandedSetor] = useState(null);
    const [expandedMaquina, setExpandedMaquina] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalConfig, setModalConfig] = useState(false);
    const [modalNovoAtivo, setModalNovoAtivo] = useState(false);
    const [selectedMaquina, setSelectedMaquina] = useState(null);
    const [usoDiario, setUsoDiario] = useState(8);
    const [novoAtivo, setNovoAtivo] = useState({
        nome: '',
        setor_id: '',
        novo_setor: '',
        modelo: '',
        tag: '',
        horas_uso_diario: 8
    });

    // Agora sim, checagem de contexto (DEPOIS dos hooks)
    if (!context) {
        return <div className="p-8 text-red-500">Erro: Contexto de Indústria não disponível.</div>;
    }

    const handleUpdateConfig = async (e) => {
        e.preventDefault();
        // Em um cenário real, chamaria updateMaquinaConfig no contexto
        alert("Configuração salva! (Simulação)");
        setModalConfig(false);
    };

    const handleSalvarAtivo = async (e) => {
        e.preventDefault();

        let setorIdFinal = novoAtivo.setor_id;

        // Se escolheu "Criar Novo Setor"
        if (setorIdFinal === 'new' && novoAtivo.novo_setor) {
            const { data, error } = await addSetor(novoAtivo.novo_setor);
            if (error) {
                alert("Erro ao criar setor: " + error.message);
                return;
            }
            setorIdFinal = data.id;
        }

        if (!novoAtivo.nome || !setorIdFinal) {
            alert("Nome e Setor são obrigatórios!");
            return;
        }

        const { error } = await addMaquina({
            nome: novoAtivo.nome,
            setor_id: setorIdFinal,
            modelo: novoAtivo.modelo,
            tag: novoAtivo.tag,
            horas_uso_diario: novoAtivo.horas_uso_diario
        });

        if (error) {
            alert("Erro ao cadastrar máquina: " + error.message);
        } else {
            alert("Máquina cadastrada com sucesso!");
            setModalNovoAtivo(false);
            setNovoAtivo({ nome: '', setor_id: '', novo_setor: '', modelo: '', tag: '', horas_uso_diario: 8 });
        }
    };

    // Render Helpers (mantidos)
    const getStatusIcon = (status) => { /* ... */ };
    const filtrarMaquinas = (setorId) => {
        return maquinas.filter(m => m.setor_id === setorId)
            .filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando ativos industriais...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Factory className="w-6 h-6 text-amber-600" /> Ativos Industriais
                    </h1>
                    <p className="text-slate-500 text-sm">Controle de Máquinas, Equipamentos e Manutenção Preditiva.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar máquina..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setModalNovoAtivo(true)} // [ACTION]
                        className="btn-primary flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                        <Plus className="w-4 h-4" /> Novo Ativo
                    </button>
                </div>
            </header>

            {/* Árvore de Setores (mantida) */}
            <div className="space-y-4">
                {setores.map(setor => (
                    <div key={setor.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                        {/* ... Conteúdo do Setor ... */}
                        <div
                            className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => setExpandedSetor(expandedSetor === setor.id ? null : setor.id)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedSetor === setor.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                <h3 className="font-bold text-slate-700">{setor.nome}</h3>
                                <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {maquinas.filter(m => m.setor_id === setor.id).length} Máquinas
                                </span>
                            </div>
                        </div>

                        {expandedSetor === setor.id && (
                            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                                {filtrarMaquinas(setor.id).map(maq => (
                                    <div key={maq.id} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                                    <Cog className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{maq.nome}</h4>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">TAG: {maq.tag || 'N/A'}</span>
                                                        <span>{maq.modelo}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex flex-col items-end gap-1 mb-1">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Uso: {maq.horas_uso_diario || 8}h/dia</span>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMaquina(maq);
                                                                setUsoDiario(maq.horas_uso_diario || 8);
                                                                setModalConfig(true);
                                                            }}
                                                            className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded hover:bg-blue-100"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-700">
                                                            Prox. Rev: {new Date().toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detalhes Equipamentos (mantido) */}
                                        <div className="mt-4 pt-3 border-t border-slate-50">
                                            <div
                                                className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-700 w-fit"
                                                onClick={() => setExpandedMaquina(expandedMaquina === maq.id ? null : maq.id)}
                                            >
                                                {expandedMaquina === maq.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                Ver Componentes ({equipamentos.filter(e => e.maquina_id === maq.id).length})
                                            </div>

                                            {expandedMaquina === maq.id && (
                                                <div className="mt-2 pl-4 border-l-2 border-slate-100 ml-1 space-y-2">
                                                    {equipamentos.filter(e => e.maquina_id === maq.id).map(eq => (
                                                        <div key={eq.id} className="flex justify-between items-center text-sm py-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                                <span className="text-slate-600">{eq.nome}</span>
                                                            </div>
                                                            <span className="text-xs text-slate-400 italic">{eq.descricao || 'Sem descrição'}</span>
                                                        </div>
                                                    ))}
                                                    {equipamentos.filter(e => e.maquina_id === maq.id).length === 0 && (
                                                        <div className="text-xs text-slate-400 italic pl-4">Sem componentes cadastrados.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filtrarMaquinas(setor.id).length === 0 && (
                                    <div className="text-center text-slate-400 py-4 text-sm">Nenhuma máquina encontrada neste setor.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal Novo Ativo */}
            {modalNovoAtivo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSalvarAtivo} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Novo Ativo Industrial</h3>
                            <button type="button" onClick={() => setModalNovoAtivo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Nome da Máquina *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ex: Extrusora 01"
                                    value={novoAtivo.nome}
                                    onChange={e => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Setor *</label>
                                    <select
                                        className="input-field"
                                        value={novoAtivo.setor_id}
                                        onChange={e => setNovoAtivo({ ...novoAtivo, setor_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        <option value="new">+ Novo Setor</option>
                                    </select>
                                </div>
                                {novoAtivo.setor_id === 'new' && (
                                    <div className="col-span-2">
                                        <input
                                            type="text"
                                            className="input-field bg-blue-50 border-blue-200 text-blue-800 placeholder-blue-300"
                                            placeholder="Nome do Novo Setor"
                                            value={novoAtivo.novo_setor}
                                            onChange={e => setNovoAtivo({ ...novoAtivo, novo_setor: e.target.value })}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Modelo</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ex: XP-2000"
                                        value={novoAtivo.modelo}
                                        onChange={e => setNovoAtivo({ ...novoAtivo, modelo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">TAG (Patrimônio)</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ex: PAT-001"
                                        value={novoAtivo.tag}
                                        onChange={e => setNovoAtivo({ ...novoAtivo, tag: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Uso Diário (Horas)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    className="input-field"
                                    value={novoAtivo.horas_uso_diario}
                                    onChange={e => setNovoAtivo({ ...novoAtivo, horas_uso_diario: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Usado para cálculo de previsão de manutenção.</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                            <button type="button" onClick={() => setModalNovoAtivo(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Cadastrar Máquina</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Config Uso (mantido) */}
            {modalConfig && selectedMaquina && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleUpdateConfig} className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* ... Conteúdo do Modal de Configuração ... */}
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Configurar Uso Diário</h3>
                            <button type="button" onClick={() => setModalConfig(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <div className="text-sm text-slate-500 mb-1">Máquina</div>
                                <div className="text-xl font-bold text-slate-800">{selectedMaquina.nome}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Horas de Uso por Dia</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    className="w-full text-center text-2xl font-bold p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                    value={usoDiario}
                                    onChange={e => setUsoDiario(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    Valor usado para <strong>estimar a data</strong> das próximas preventivas automaticamente.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                            <button type="button" onClick={() => setModalConfig(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium">Cancelar</button>
                            <button type="submit" className="btn-primary bg-amber-600 hover:bg-amber-700"> Salvar Configuração</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Ativos;
