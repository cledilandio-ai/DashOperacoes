import React, { useState } from 'react';
import { useManutencao } from '../contexts/ManutencaoContext';
import { useIndustria } from '../contexts/IndustriaContext';
import {
    Wrench, AlertTriangle, CheckCircle, Clock, Plus,
    Activity, Calendar, User, MoreVertical
} from 'lucide-react';

const Manutencao = () => {
    // ✅ TODOS os hooks devem estar no topo, ANTES de qualquer return condicional
    const { manutencoes = [], loading: loadingManut, abrirOS } = useManutencao() || {};
    const { maquinas = [] } = useIndustria() || {};

    const [modalOpen, setModalOpen] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [novaOS, setNovaOS] = useState({
        maquina_id: '',
        tipo: 'CORRETIVA',
        descricao: '',
        prioridade: 'MEDIA'
    });

    // KPIs
    const stats = {
        corretivas: manutencoes.filter(m => m.tipo === 'CORRETIVA' && m.status !== 'CONCLUIDA').length,
        preventivas: manutencoes.filter(m => m.tipo === 'PREVENTIVA' && m.status !== 'CONCLUIDA').length,
        andamento: manutencoes.filter(m => m.status === 'EM_ANDAMENTO').length,
        concluidas: manutencoes.filter(m => m.status === 'CONCLUIDA').length
    };

    const handleSalvarOS = async (e) => {
        e.preventDefault();
        if (!novaOS.maquina_id || !novaOS.descricao) return alert("Preencha todos os campos!");

        const payload = {
            ...novaOS,
            status: 'PENDENTE',
            data_abertura: new Date(),
        };

        const { error } = await abrirOS(payload);
        if (error) {
            alert('Erro ao abrir OS: ' + error.message);
        } else {
            alert('OS Aberta com Sucesso!');
            setModalOpen(false);
            setNovaOS({ maquina_id: '', tipo: 'CORRETIVA', descricao: '', prioridade: 'MEDIA' });
        }
    };

    const priorityColor = {
        ALTA: 'bg-red-100 text-red-700 border-red-200',
        MEDIA: 'bg-amber-100 text-amber-700 border-amber-200',
        BAIXA: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    const statusColor = {
        PENDENTE: 'bg-slate-100 text-slate-600',
        EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
        AGUARDANDO_PECA: 'bg-purple-100 text-purple-700',
        CONCLUIDA: 'bg-emerald-100 text-emerald-700'
    };

    const OSCard = ({ os }) => (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColor[os.prioridade] || 'bg-slate-100 text-slate-600'}`}>
                    {os.prioridade}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor[os.status] || 'bg-slate-100'}`}>
                    {(os.status || '').replace(/_/g, ' ')}
                </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{os.maquinas?.nome || 'Máquina N/D'}</h4>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">{os.descricao_problema || os.descricao}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2">
                <Clock className="w-3 h-3" />
                <span>{os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}</span>
                {os.tecnicos && (
                    <span className="flex items-center gap-1 ml-auto">
                        <User className="w-3 h-3" /> {os.tecnicos.nome?.split(' ')[0]}
                    </span>
                )}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-slate-100 rounded">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
            </div>
        </div>
    );

    const osFiltradas = (status) => manutencoes
        .filter(m => m.status === status)
        .filter(m => filtroTipo === 'TODOS' || m.tipo === filtroTipo);

    if (loadingManut) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center text-slate-500">
                    <Wrench className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
                    <p>Carregando ordens de serviço...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-amber-500" /> Gestão de Manutenção
                    </h1>
                    <p className="text-slate-500 text-sm">Monitoramento de OS e Ativos (TPM)</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Nova O.S.
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.corretivas}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">Corretivas</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.andamento}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">Em Atendimento</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.preventivas}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">Preventivas</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.concluidas}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-bold">Concluídas</div>
                    </div>
                </div>
            </div>

            {/* Filtro de Tipo */}
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
                {['TODOS', 'CORRETIVA', 'PREVENTIVA'].map(tipo => (
                    <button
                        key={tipo}
                        onClick={() => setFiltroTipo(tipo)}
                        className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors whitespace-nowrap
                            ${filtroTipo === tipo ? 'bg-white text-blue-600 border border-b-0 border-slate-200' : 'text-slate-500 hover:text-slate-700 bg-slate-50'}`}
                    >
                        {tipo === 'TODOS' ? 'Visão Geral' : tipo}
                    </button>
                ))}
            </div>

            {/* Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div> Pendentes
                        <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded-full">{osFiltradas('PENDENTE').length}</span>
                    </h3>
                    <div className="space-y-3 min-h-[200px]">
                        {osFiltradas('PENDENTE').map(os => <OSCard key={os.id} os={os} />)}
                        {osFiltradas('PENDENTE').length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-sm">
                                Sem pendências 👍
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-blue-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Em Execução
                        <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {manutencoes.filter(m => ['EM_ANDAMENTO', 'AGUARDANDO_PECA'].includes(m.status)).length}
                        </span>
                    </h3>
                    <div className="space-y-3 min-h-[200px]">
                        {manutencoes
                            .filter(m => ['EM_ANDAMENTO', 'AGUARDANDO_PECA'].includes(m.status))
                            .filter(m => filtroTipo === 'TODOS' || m.tipo === filtroTipo)
                            .map(os => <OSCard key={os.id} os={os} />)
                        }
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-emerald-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Concluídas
                        <span className="ml-auto text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{stats.concluidas}</span>
                    </h3>
                    <div className="space-y-3 min-h-[200px]">
                        {osFiltradas('CONCLUIDA').slice(0, 5).map(os => <OSCard key={os.id} os={os} />)}
                        {osFiltradas('CONCLUIDA').length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-sm">
                                Nenhuma concluída ainda
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Nova OS */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSalvarOS} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Nova Ordem de Serviço</h3>
                            <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Máquina *</label>
                                    <select
                                        className="input-field"
                                        value={novaOS.maquina_id}
                                        onChange={e => setNovaOS({ ...novaOS, maquina_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                    {maquinas.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">⚠ Nenhuma máquina cadastrada. Vá em "Ativos Indústria" primeiro.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="label">Tipo</label>
                                    <select className="input-field" value={novaOS.tipo} onChange={e => setNovaOS({ ...novaOS, tipo: e.target.value })}>
                                        <option value="CORRETIVA">Corretiva (Quebrou)</option>
                                        <option value="PREVENTIVA">Preventiva</option>
                                        <option value="MELHORIA">Melhoria</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Descrição do Problema *</label>
                                <textarea
                                    className="input-field h-24 resize-none"
                                    placeholder="Descreva o que aconteceu..."
                                    value={novaOS.descricao}
                                    onChange={e => setNovaOS({ ...novaOS, descricao: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="label">Prioridade</label>
                                <div className="flex gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNovaOS({ ...novaOS, prioridade: p })}
                                            className={`flex-1 py-2 rounded border text-sm font-bold transition-colors
                                                ${novaOS.prioridade === p
                                                    ? (p === 'ALTA' ? 'bg-red-50 border-red-500 text-red-600' : p === 'MEDIA' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-blue-50 border-blue-400 text-blue-700')
                                                    : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Abrir Chamado</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Manutencao;
