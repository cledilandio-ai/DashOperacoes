import React, { useState, useEffect } from 'react';
import { useManutencao } from '../contexts/ManutencaoContext';
import { useIndustria } from '../contexts/IndustriaContext';
import { useProducao } from '../contexts/ProducaoContext';
import { useConfig } from '../contexts/ConfiguracoesContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Wrench, AlertTriangle, CheckCircle, Clock, Plus,
    Activity, Calendar, User, MoreVertical, Printer, Timer, Database
} from 'lucide-react';
import SearchSelect from '../components/SearchSelect';

const Manutencao = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // ✅ TODOS os hooks devem estar no topo, ANTES de qualquer return condicional
    const { manutencoes = [], planosPreventivos = [], loading: loadingManut, abrirOS, atualizarStatusOS, addPlanoPreventivo, removePlanoPreventivo, dispararPreventiva  } = useManutencao() || {};
    const { config } = useConfig() || {};
    const { user } = useAuth() || {};
    const { maquinas = [] } = useIndustria() || {};
    const { operadores = [] } = useProducao() || {};

    const [viewAtiva, setViewAtiva] = useState('PAINEL_OS'); // PAINEL_OS | PLANOS_PREVENTIVOS
    const [modalOpen, setModalOpen] = useState(false);
    const [modalPlanoOpen, setModalPlanoOpen] = useState(false); // Para novo plano
    const [osImpressao, setOsImpressao] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [novaOS, setNovaOS] = useState({
        maquina_id: '',
        tipo: 'CORRETIVA',
        descricao: '',
        prioridade: 'MEDIA',
        tecnico_id: '',
        ajudantes: [],
        prazo_limite_horas: 48
    });
    const [novoPlano, setNovoPlano] = useState({ maquina_id: '', tarefa: '', frequencia_dias: 30 });

    const tecnicosDisponiveis = operadores.filter(op => op.perfil === 'TECNICO' || op.tipo_comissao === 'MANUTENCAO');

    // Estados do Modal de Atualização de O.S.
    const [modalUpdateOpen, setModalUpdateOpen] = useState(false);
    const [updateOSDados, setUpdateOSDados] = useState(null);
    const [justificativaAtraso, setJustificativaAtraso] = useState('');
    const [novoStatusOS, setNovoStatusOS] = useState('');
    const [anotacoesConclusao, setAnotacoesConclusao] = useState('');

    // Estado para Filtro da nova Aba de Relatórios
    const [filtroRelatorio, setFiltroRelatorio] = useState({ dataInicio: '', dataFim: '', status: 'TODOS' });

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
            maquina_id: novaOS.maquina_id,
            tipo: novaOS.tipo,
            descricao_problema: novaOS.descricao,
            prioridade: novaOS.prioridade,
            tecnico_id: novaOS.tecnico_id || null, 
            ajudantes: novaOS.ajudantes || [],
            prazo_limite_horas: novaOS.prazo_limite_horas || 24, 
            status: 'PENDENTE',
            data_abertura: new Date(),
        };

        const { data, error } = await abrirOS(payload);
        if (error) {
            alert('Erro ao abrir OS: ' + error.message);
        } else {
            setModalOpen(false);
            setNovaOS({ maquina_id: '', tipo: 'CORRETIVA', descricao: '', prioridade: 'MEDIA', tecnico_id: '', ajudantes: [], prazo_limite_horas: 48 });
            setOsImpressao(data); // Abre e preenche a OS pronta para plugar na impressora
        }
    };

    const handleSalvarPlano = async (e) => {
        e.preventDefault();
        if (!novoPlano.maquina_id || !novoPlano.tarefa) return alert("Preencha máquina e tarefa");
        const { error } = await addPlanoPreventivo(novoPlano);
        if (!error) {
            setModalPlanoOpen(false);
            setNovoPlano({ maquina_id: '', tarefa: '', frequencia_dias: 30 });
        } else {
            alert("Erro ao criar plano: " + error.message);
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

    const handleAbrirUpdateModal = (os) => {
        setUpdateOSDados(os);
        setNovoStatusOS(os.status !== 'CONCLUIDA' ? 'CONCLUIDA' : os.status);
        setJustificativaAtraso(os.justificativa_atraso || '');
        setAnotacoesConclusao(os.anotacoes_conclusao || '');
        setModalUpdateOpen(true);
    };

    useEffect(() => {
        if (location.state?.reabrirOS && manutencoes.length > 0) {
            const osId = location.state.reabrirOS;
            const osToOpen = manutencoes.find(m => m.id === osId);
            if (osToOpen) {
                // Clear state so it doesn't open again on page refresh
                navigate('/manutencao', { replace: true, state: {} });
                // We use setTimeout to ensure all initial states are processed before opening the modal
                setTimeout(() => handleAbrirUpdateModal(osToOpen), 100);
            }
        }
    }, [location.state?.reabrirOS, manutencoes.length, navigate]);

    const handleSalvarAtualizacaoOS = async (e) => {
        e.preventDefault();
        
        let payload = { 
            status: novoStatusOS,
            tecnico_id: updateOSDados.tecnico_id || null,
            ajudantes: updateOSDados.ajudantes || []
        };
        
        if (novoStatusOS === 'CONCLUIDA') {
            payload.data_conclusao = new Date().toISOString();
            payload.justificativa_atraso = justificativaAtraso;
            payload.anotacoes_conclusao = anotacoesConclusao;
        }
        
        const { error } = await atualizarStatusOS(updateOSDados.id, novoStatusOS, payload);
        
        if (!error) {
            setModalUpdateOpen(false);
        } else {
            alert("Erro ao atualizar o chamado.");
        }
    };

    const calcularCoresAtraso = (os) => {
        if (os.status === 'CONCLUIDA') return { texto: 'text-slate-500', bg: 'bg-slate-100', alerta: null };
        if (!os.prazo_limite_horas) return { texto: 'text-slate-500', bg: 'bg-slate-50', alerta: null };
        
        const tempoDecorridoMs = new Date() - new Date(os.data_abertura);
        const horasDecorridas = tempoDecorridoMs / 3600000;
        
        if (horasDecorridas > os.prazo_limite_horas) {
            return { texto: 'text-red-700 font-bold', bg: 'bg-red-50', borda: 'border-red-500', alerta: 'Estourou o SLA' };
        } else if (horasDecorridas > os.prazo_limite_horas * 0.7) {
            return { texto: 'text-amber-600', bg: 'bg-amber-50', alerta: 'Atenção ao Prazo' };
        }
        return { texto: 'text-emerald-600', bg: 'bg-emerald-50', alerta: null };
    };

    const OSCard = ({ os }) => {
        const controlePrazo = calcularCoresAtraso(os);

        return (
            <div className={`bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all relative group cursor-pointer border ${controlePrazo.borda || 'border-slate-200'}`}
                onClick={() => handleAbrirUpdateModal(os)}
            >
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
                <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2 flex-wrap">
                    <Clock className="w-3 h-3" />
                    <span>{os.data_abertura ? new Date(os.data_abertura).toLocaleDateString('pt-BR') : '-'}</span>
                    
                    {os.prazo_limite_horas && (
                        <span className={`ml-2 px-1.5 rounded ${controlePrazo.bg} ${controlePrazo.texto} font-bold flex items-center gap-1`} title="Prazo Alvo">
                            <Timer size={10} /> {os.prazo_limite_horas}H
                        </span>
                    )}

                    {os.tecnicos && (
                        <span className="flex items-center gap-1 ml-auto">
                            <User className="w-3 h-3" /> {os.tecnicos.nome?.split(' ')[0]}
                        </span>
                    )}
                </div>
            </div>
        );
    };

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
                <div className="flex bg-slate-100 p-1 rounded-lg print:hidden">
                     <button onClick={() => setViewAtiva('PAINEL_OS')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewAtiva === 'PAINEL_OS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Quadro de O.S.</button>
                     <button onClick={() => setViewAtiva('PLANOS_PREVENTIVOS')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewAtiva === 'PLANOS_PREVENTIVOS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Planos de Preventiva</button>
                     <button onClick={() => setViewAtiva('RELATORIOS')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewAtiva === 'RELATORIOS' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Relatórios</button>
                </div>
                <div className="flex gap-2 print:hidden">
                    {viewAtiva === 'PAINEL_OS' && (
                        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nova O.S.
                        </button>
                    )}
                    {viewAtiva === 'PLANOS_PREVENTIVOS' && (
                        <button onClick={() => setModalPlanoOpen(true)} className="btn-success flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 shadow-sm font-bold transition-transform active:scale-95">
                            <Plus className="w-4 h-4" /> Novo Cronograma
                        </button>
                    )}
                </div>
            </div>

            {viewAtiva === 'PLANOS_PREVENTIVOS' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {planosPreventivos.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            Nenhum Plano de Preventiva Automático configurado para a fábrica.
                        </div>
                    )}
                    {planosPreventivos.map(p => {
                        const isVencido = new Date(p.proxima_execucao) <= new Date();
                        return (
                            <div key={p.id} className={`p-5 rounded-xl border shadow-sm relative overflow-hidden bg-white ${isVencido ? 'border-red-300' : 'border-slate-200 hover:border-emerald-300 transition-colors'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${isVencido ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        A CADA {p.frequencia_dias} DIAS
                                    </span>
                                    <button onClick={() => { if(window.confirm('Excluir plano?')) removePlanoPreventivo(p.id) }} className="text-slate-300 hover:text-red-500 transition-colors" title="Excluir Plano">✕</button>
                                </div>
                                <h4 className="font-bold text-slate-800 mt-3 text-lg">{p.maquinas?.nome}</h4>
                                <div className="text-sm text-slate-500 font-medium mb-5 h-10 line-clamp-2">{p.tarefa}</div>
                                
                                <div className="bg-slate-50 p-3 rounded-lg text-xs font-bold text-slate-500 grid gap-2 mb-5 border border-slate-100">
                                    <div className="flex justify-between items-center"><span>⏱️ Última Vistoria:</span> <span className="text-slate-700 px-2 py-0.5 bg-white rounded border border-slate-200">{p.ultima_execucao ? new Date(p.ultima_execucao).toLocaleDateString() : 'NUNCA'}</span></div>
                                    <div className="flex justify-between items-center"><span>🎯 Disparar em:</span> <span className={`px-2 py-0.5 rounded border ${isVencido ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{new Date(p.proxima_execucao).toLocaleDateString()}</span></div>
                                </div>
                                
                                <button className={`w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold rounded-lg shadow-sm hover:shadow transition-colors text-white ${isVencido ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`} onClick={() => dispararPreventiva(p)}>
                                    <Activity size={16} /> {isVencido ? 'O.S. ATRASADA! Dar Start' : 'Dar Start na O.S (Gerar)'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : viewAtiva === 'RELATORIOS' ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 print:border-none print:shadow-none print:p-0">
                    <div className="flex justify-between items-center mb-6 hidden print:flex">
                         <div className="flex items-center gap-4">
                              {config?.logo_base64 && <img src={config.logo_base64} alt="Logo" className="h-10 object-contain" />}
                              <div>
                                  <h2 className="text-xl font-bold uppercase">{config?.nome_empresa || 'Gestão O.S.'}</h2>
                                  <p className="text-xs text-slate-500">Relatório Estratégico de Manutenção</p>
                              </div>
                         </div>
                         <div className="text-right text-xs text-slate-500 font-bold">
                             Puxado em: {new Date().toLocaleDateString('pt-BR')}
                         </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 print:hidden"><BarChart3 className="text-purple-600"/> Relatórios e Histórico de O.S.</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 print:hidden">
                        <div>
                            <label className="label">Data Inicial</label>
                            <input type="date" className="input-field" value={filtroRelatorio.dataInicio} onChange={e => setFiltroRelatorio({...filtroRelatorio, dataInicio: e.target.value})} />
                        </div>
                        <div>
                            <label className="label">Data Final</label>
                            <input type="date" className="input-field" value={filtroRelatorio.dataFim} onChange={e => setFiltroRelatorio({...filtroRelatorio, dataFim: e.target.value})} />
                        </div>
                        <div>
                            <label className="label">Status da O.S.</label>
                            <select className="input-field" value={filtroRelatorio.status} onChange={e => setFiltroRelatorio({...filtroRelatorio, status: e.target.value})}>
                                <option value="TODOS">Todas as O.S.</option>
                                <option value="PENDENTE">Apenas Pendentes</option>
                                <option value="EM_ANDAMENTO">Em Execução</option>
                                <option value="AGUARDANDO_PECA">Aguardando Peça / Fornecedor</option>
                                <option value="CONCLUIDA">Concluídas</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                             <button className="btn-primary w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 border-none transition-transform active:scale-95" onClick={() => window.print()}>
                                 <Printer size={18} /> Imprimir Listagem
                             </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto print-exact">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-t border-slate-300">
                                <tr>
                                    <th className="px-4 py-3">ID / Protocolo</th>
                                    <th className="px-4 py-3">Ativo (Máquina)</th>
                                    <th className="px-4 py-3 w-1/3">Descrição do Problema</th>
                                    <th className="px-4 py-3">Técnico Principal</th>
                                    <th className="px-4 py-3 text-center">Data e Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manutencoes
                                    .filter(m => {
                                        let ok = true;
                                        if (filtroRelatorio.status !== 'TODOS' && m.status !== filtroRelatorio.status) ok = false;
                                        if (filtroRelatorio.dataInicio && new Date(m.data_abertura) < new Date(filtroRelatorio.dataInicio + 'T00:00:00')) ok = false;
                                        if (filtroRelatorio.dataFim && new Date(m.data_abertura) > new Date(filtroRelatorio.dataFim + 'T23:59:59')) ok = false;
                                        return ok;
                                    })
                                    .map(m => (
                                        <tr key={m.id} className="border-b border-slate-200 hover:bg-slate-50">
                                            <td className="px-4 py-3 align-top font-bold text-slate-800">
                                                #{m.id}<br/>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border mt-1 inline-block">{m.tipo} - {m.prioridade}</span>
                                            </td>
                                            <td className="px-4 py-3 align-top font-bold text-blue-800">{maquinas.find(mq => mq.id === m.maquina_id)?.nome || 'N/D'}</td>
                                            <td className="px-4 py-3 align-top text-slate-600 whitespace-pre-wrap">{m.descricao_problema}</td>
                                            <td className="px-4 py-3 align-top uppercase font-bold text-xs text-slate-600">{operadores.find(o => o.id === m.tecnico_id)?.nome?.split(' ')[0] || 'LIVRE'}</td>
                                            <td className="px-4 py-3 align-top text-center border-l border-slate-100">
                                                <div className="text-[10px] text-slate-500 mb-1 font-bold">{new Date(m.data_abertura).toLocaleDateString('pt-BR')}</div>
                                                <span className={`text-[9px] uppercase font-black px-2 py-1.5 rounded border inline-block ${statusColor[m.status] || 'bg-slate-100'}`}>{(m.status || '').replace(/_/g, ' ')}</span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <>
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
                </>
            )}

            {/* Modal Novo Plano Preventivo */}
            {modalPlanoOpen && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSalvarPlano} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-visible">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center rounded-t-xl">
                            <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Calendar className="w-5 h-5"/> Novo Plano (Rotina de Preventiva)</h3>
                            <button type="button" onClick={() => setModalPlanoOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Equipamento Alvo</label>
                                <SearchSelect
                                    options={maquinas.map(m => ({ value: m.id, label: m.nome, tag: m.tag }))}
                                    value={novoPlano.maquina_id}
                                    onChange={val => setNovoPlano({ ...novoPlano, maquina_id: val })}
                                    placeholder="🔍 Pesquisar máquina..."
                                    required={true}
                                />
                            </div>
                            <div className="z-0">
                                <label className="label mt-4">Qual é a Tarefa / Vistoria?</label>
                                <input type="text" className="input-field" placeholder="Ex: Avaliar rolamentos e lubrificar calhas..." value={novoPlano.tarefa} onChange={e => setNovoPlano({...novoPlano, tarefa: e.target.value})} required />
                            </div>
                            <div className="z-0">
                                <label className="label text-emerald-700 mt-4">Frequência (A cada X dias)</label>
                                <div className="relative">
                                    <input type="number" min="1" className="input-field border-emerald-300 focus:ring-emerald-500 font-bold pr-12 text-lg" value={novoPlano.frequencia_dias} onChange={e => setNovoPlano({...novoPlano, frequencia_dias: parseInt(e.target.value) || 1})} />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs uppercase tracking-widest">Dias</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-100 p-4 flex justify-end gap-2 border-t border-slate-200 rounded-b-xl z-0 mt-4">
                            <button type="button" onClick={() => setModalPlanoOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-success">Cadastrar Cronograma</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Nova OS */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto z-50 p-4">
                    <form onSubmit={handleSalvarOS} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-visible mt-10 mb-10">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center rounded-t-xl">
                            <h3 className="font-bold text-slate-800">Nova Ordem de Serviço</h3>
                            <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="label">Máquina *</label>
                                    <SearchSelect
                                        options={maquinas.map(m => ({ 
                                            value: m.id, 
                                            label: m.nome, 
                                            tag: m.tag, 
                                            descricao: m.descricao 
                                        }))}
                                        value={novaOS.maquina_id}
                                        onChange={val => setNovaOS({ ...novaOS, maquina_id: val })}
                                        placeholder="🔍 Pesquisar máquina (ex: Moinho, TAG...)"
                                        required={true}
                                        emptyMessage={`Nenhuma máquina encontrada para a busca.`}
                                    />
                                    {maquinas.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">⚠ Nenhuma máquina cadastrada. Vá em "Ativos Indústria" primeiro.</p>
                                    )}
                                </div>
                                <div className="z-0">
                                    <label className="label">Tipo de Chamado</label>
                                    <select className="input-field" value={novaOS.tipo} onChange={e => setNovaOS({ ...novaOS, tipo: e.target.value })}>
                                        <option value="CORRETIVA">Corretiva (Quebrou)</option>
                                        <option value="PREVENTIVA">Preventiva</option>
                                        <option value="MELHORIA">Melhoria</option>
                                    </select>
                                </div>
                                <div className="z-0">
                                    <label className="label">Líder / Técnico Responsável</label>
                                    <select className="input-field" value={novaOS.tecnico_id} onChange={e => setNovaOS({ ...novaOS, tecnico_id: e.target.value })}>
                                        <option value="">Livre para a equipe puxar</option>
                                        {tecnicosDisponiveis.map(t => (
                                            <option key={t.id} value={t.id}>{t.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                                 <label className="label !text-[11px] uppercase text-slate-500 tracking-widest border-b border-slate-200 pb-2 flex items-center gap-1 mb-3"><User size={12}/> Equipe de Ajudantes (Múltiplos Técnicos)</label>
                                 <p className="text-[10px] text-slate-400 mb-3 leading-tight hidden">Marque os outros técnicos que atuarão em conjunto nesta O.S. para dividir a produtividade.</p>
                                 <div className="flex flex-wrap gap-2">
                                     {tecnicosDisponiveis.filter(t => t.id.toString() !== (novaOS.tecnico_id || '').toString()).map(t => {
                                         const isSelected = novaOS.ajudantes.includes(t.id);
                                         return (
                                             <button key={t.id} type="button" onClick={() => {
                                                 if (isSelected) setNovaOS({...novaOS, ajudantes: novaOS.ajudantes.filter(id => id !== t.id)});
                                                 else setNovaOS({...novaOS, ajudantes: [...novaOS.ajudantes, t.id]});
                                             }} className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 transition-all ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                 {isSelected ? <CheckCircle size={12} className="shrink-0" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-300" />}
                                                 {t.nome.split(' ')[0]}
                                             </button>
                                         );
                                     })}
                                     {tecnicosDisponiveis.length === 0 && <span className="text-xs text-slate-400">Nenhum técnico cadastrado (com perfil TECNICO).</span>}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Prioridade da O.S.</label>
                                    <div className="flex gap-2">
                                        {['BAIXA', 'MEDIA', 'ALTA'].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => {
                                                    const limiteSegerido = p === 'ALTA' ? 24 : p === 'MEDIA' ? 48 : 168;
                                                    setNovaOS({ ...novaOS, prioridade: p, prazo_limite_horas: limiteSegerido });
                                                }}
                                                className={`flex-1 py-2 rounded border text-sm font-bold transition-all
                                                    ${novaOS.prioridade === p
                                                        ? (p === 'ALTA' ? 'bg-red-50 border-red-500 text-red-600 shadow-sm' : p === 'MEDIA' ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm' : 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm')
                                                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="label text-amber-900 border-b border-amber-200 pb-1">
                                        ⏱️ Prazo Limite (Horas)
                                    </label>
                                    <div className="relative mt-1">
                                        <input 
                                            type="number" 
                                            min="1"
                                            className="input-field border-amber-300 focus:ring-amber-500 font-bold font-mono pl-10"
                                            value={novaOS.prazo_limite_horas}
                                            onChange={(e) => setNovaOS({ ...novaOS, prazo_limite_horas: parseInt(e.target.value) || 24})}
                                        />
                                        <Timer className="w-5 h-5 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-[10px] text-amber-700/80 mt-1 font-medium leading-tight">
                                        Tempo acordado (SLA) para blindar a meta do mecânico do efeito atraso.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100 rounded-b-xl z-0">
                            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Criar e Imprimir O.S.</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Atualizar/Fechar OS */}
            {modalUpdateOpen && updateOSDados && (
                <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-start overflow-y-auto z-50 p-4">
                    <form onSubmit={handleSalvarAtualizacaoOS} className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-visible mt-20 mb-10 border border-slate-200">
                        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center rounded-t-xl">
                            <h3 className="font-bold text-slate-800">Cuidar da OS #{updateOSDados.id}</h3>
                            <button type="button" onClick={() => setModalUpdateOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2 flex items-center gap-1"><User size={14}/> Equipe Técnica Atuando</label>
                                <div className="space-y-4">
                                    <div>
                                        <select className="input-field text-sm font-bold bg-white" value={updateOSDados.tecnico_id || ''} onChange={e => setUpdateOSDados({...updateOSDados, tecnico_id: e.target.value})}>
                                            <option value="">Líder não definido</option>
                                            {tecnicosDisponiveis.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tecnicosDisponiveis.filter(t => t.id.toString() !== (updateOSDados.tecnico_id || '').toString()).map(t => {
                                             const isSelected = (updateOSDados.ajudantes || []).includes(t.id);
                                             return (
                                                 <button key={t.id} type="button" onClick={() => {
                                                     const current = updateOSDados.ajudantes || [];
                                                     if (isSelected) setUpdateOSDados({...updateOSDados, ajudantes: current.filter(id => id !== t.id)});
                                                     else setUpdateOSDados({...updateOSDados, ajudantes: [...current, t.id]});
                                                 }} className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border flex items-center gap-1.5 transition-all ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                                     {isSelected ? <CheckCircle size={12} className="shrink-0" /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
                                                     {t.nome.split(' ')[0]}
                                                 </button>
                                             );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1 flex items-center gap-1"><Activity size={12}/> Etapa da OS</label>
                                <select 
                                    className="input-field text-lg font-bold"
                                    value={novoStatusOS}
                                    onChange={(e) => setNovoStatusOS(e.target.value)}
                                >
                                    <option value="PENDENTE">🟡 Retornar a Pendente</option>
                                    <option value="EM_ANDAMENTO">🔵 Em Andamento / Execução</option>
                                    <option value="AGUARDANDO_PECA">🟠 Aguardando Peça / Terceirização</option>
                                    <option value="CONCLUIDA">🟢 Marcar como Concluída!</option>
                                    <option value="CANCELADA">🔴 Cancelar O.S.</option>
                                </select>
                            </div>

                            {novoStatusOS === 'CONCLUIDA' && (
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                                    <label className="block text-xs font-bold text-orange-800 uppercase tracking-widest flex items-center gap-1">
                                        <AlertTriangle size={14} /> Houve Atraso no Prazo Limite?
                                    </label>
                                    <p className="text-[11px] text-orange-700 leading-tight">
                                        Se a OS excedeu o tempo (SLA) de <strong>{updateOSDados.prazo_limite_horas || 24}H</strong> estabelecido por culpa de fornecedores, usinagem ou demora de peças de SP, justifique abaixo.
                                    </p>
                                    <textarea
                                        className="input-field h-24 resize-none border-orange-300 focus:ring-orange-500 placeholder:text-orange-300"
                                        placeholder="Ex: Atraso dos Correios, usinagem demorou 15 dias..."
                                        value={justificativaAtraso}
                                        onChange={(e) => setJustificativaAtraso(e.target.value)}
                                    ></textarea>
                                    <p className="text-[10px] text-orange-600 font-bold">Ao preencher isto a diretoria pode perdoar a perda dos pontos na meta!</p>
                                </div>
                            )}

                            {novoStatusOS === 'CONCLUIDA' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1">
                                        <Wrench size={14} /> Anotações do Técnico / Uso de Peças
                                    </label>
                                    <textarea
                                        className="input-field h-24 resize-none"
                                        placeholder="Liste os serviços executados e as peças utilizadas..."
                                        value={anotacoesConclusao}
                                        onChange={(e) => setAnotacoesConclusao(e.target.value)}
                                    ></textarea>
                                    {user?.perfil === 'ADMIN' && (
                                         <Link to="/ativos" state={{ maquina_id: updateOSDados.maquina_id, reabrirOS: updateOSDados.id }} className="flex items-center justify-center gap-2 text-xs font-bold text-blue-700 bg-blue-100/50 p-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors mt-2">
                                             <Database size={14} /> Faltou algo? Cadastrar nova peça no Ativo
                                         </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-4 flex justify-between gap-2 border-t border-slate-100 rounded-b-xl items-center">
                            <button type="button" onClick={() => { setModalUpdateOpen(false); setTimeout(() => setOsImpressao(updateOSDados), 200); }} className="text-slate-500 hover:text-slate-700 flex items-center gap-2 text-sm font-bold bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm transition-transform active:scale-95">
                                <Printer size={16} /> Reimprimir OS
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setModalUpdateOpen(false)} className="btn-secondary">Voltar</button>
                                <button type="submit" className="btn-success">Salvar O.S.</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Impressão de OS (A4 Simplificado) */}
            {osImpressao && (
                <div className="fixed inset-0 bg-slate-900/90 flex justify-center items-start overflow-y-auto z-[100] p-4 text-slate-800">
                    <style>{`
                        @media print {
                            body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; height: auto !important; background: white !important; }
                            body * { visibility: hidden; }
                            #print-os-area, #print-os-area * { visibility: visible; }
                            #print-os-area { 
                                position: absolute; left: 0; top: 0; 
                                width: 100%; height: auto; 
                                margin: 0; padding: 1cm; 
                            }
                            .print\\:hidden { display: none !important; }
                            aside, nav { display: none !important; }
                        }
                        @page { size: portrait; margin: 0; }
                    `}</style>
                    <div className="bg-white max-w-3xl w-full mt-4 mb-10 shadow-2xl relative rounded-sm">
                        
                        <div id="print-os-area" className="p-10 font-mono text-sm leading-relaxed">
                            {/* Header Coporativo */}
                            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-widest">ORDEM DE SERVIÇO</h1>
                                    <p className="mt-1">PROTOCOLO Nº: <strong>{osImpressao.id || '...'}</strong></p>
                                    <p>ABERTURA: <strong>{new Date(osImpressao.data_abertura || new Date()).toLocaleString('pt-BR')}</strong></p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {config?.logo_base64 && <img src={config.logo_base64} alt="Company Logo" className="h-14 object-contain mb-2" />}
                                    <h2 className={`font-bold uppercase ${config?.logo_base64 ? 'text-xs text-slate-500 tracking-wider' : 'text-xl'}`}>{config?.nome_empresa || 'Empresa Padrão'}</h2>
                                    <p className="text-[10px] text-slate-400 mt-1">Uso exclusivo do time de Manutenção</p>
                                </div>
                            </div>
                            
                            {/* Dados Primários */}
                            {(() => {
                                const maq = maquinas.find(m => m.id == osImpressao.maquina_id) || {};
                                const tee = operadores.find(o => o.id == osImpressao.tecnico_id) || {};
                                return (
                                    <div className="grid grid-cols-2 gap-6 mb-8 border-b border-dashed border-slate-300 pb-8">
                                        <div>
                                            <strong className="block text-slate-500 uppercase text-xs tracking-wider">Equipamento / Máquina Alvo:</strong>
                                            <span className="text-xl font-bold block mt-1">{maq.nome || 'N/D'}</span>
                                            {maq.tag && <div className="text-slate-600 font-bold mt-1">TAG: {maq.tag}</div>}
                                            {osImpressao.ajudantes && osImpressao.ajudantes.length > 0 && (
                                                <div className="mt-4">
                                                    <strong className="block text-slate-500 uppercase text-[10px] tracking-wider mb-1">Equipe de Ajudantes:</strong>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {osImpressao.ajudantes.map(id => {
                                                            const n = operadores.find(o => o.id === id)?.nome || 'Desconhecido';
                                                            return <span key={id} className="text-[10px] uppercase font-bold text-slate-600 bg-white border border-slate-300 px-1.5 py-0.5 rounded shadow-sm">{n.split(' ')[0]}</span>
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded">
                                            <strong className="block text-slate-500 uppercase text-xs">Tipo de Chamado:</strong>
                                            <div className="font-bold mb-2 flex flex-wrap items-center gap-2">
                                                {osImpressao.tipo} - {osImpressao.prioridade}
                                                {osImpressao.prazo_limite_horas && <span className="border border-slate-300 text-slate-600 px-1 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white shadow-sm">SLA {osImpressao.prazo_limite_horas}H</span>}
                                            </div>
                                            
                                            <strong className="block text-slate-500 uppercase text-xs">Técnico Designado:</strong>
                                            <div className="font-bold">{tee.nome || 'LIVRE (A Combinar)'}</div>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            {/* Problema */}
                            <div className="mb-10">
                                <strong className="block text-slate-500 uppercase text-xs tracking-wider mb-2">Relato / Diagnóstico Inicial (Solicitante):</strong>
                                <div className="p-4 rounded min-h-[120px] whitespace-pre-wrap border border-slate-800 bg-slate-50 text-base">
                                    {osImpressao.descricao_problema}
                                </div>
                            </div>
                            
                            {/* Preenchimento em papel ou Registrado */}
                            <div className="border-2 border-slate-800 p-6 mb-12 relative print-exact">
                                <span className="absolute -top-3 left-4 bg-white px-2 uppercase font-bold text-xs tracking-wider">Anotações do Técnico / Uso de Peças</span>
                                {osImpressao.anotacoes_conclusao ? (
                                    <div className="text-sm whitespace-pre-wrap mt-2 font-medium">{osImpressao.anotacoes_conclusao}</div>
                                ) : (
                                    <>
                                        <div className="border-b border-dotted border-slate-400 mt-8"></div>
                                        <div className="border-b border-dotted border-slate-400 mt-8"></div>
                                        <div className="border-b border-dotted border-slate-400 mt-8"></div>
                                        <div className="border-b border-dotted border-slate-400 mt-8"></div>
                                    </>
                                )}
                            </div>
                            
                            {/* Assinaturas */}
                            <div className="flex justify-between pb-4 mt-16 pt-8 border-t-2 border-slate-800 px-8">
                                <div className="text-center w-64">
                                    <div className="border-b border-black mb-2"></div>
                                    <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500">Assinatura Solicitante</span>
                                </div>
                                <div className="text-center w-64">
                                    <div className="border-b border-black mb-2"></div>
                                    <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500">Assinatura Técnico</span>
                                </div>
                            </div>
                        </div>

                        {/* Botões do PDF */}
                        <div className="bg-slate-100 p-4 flex gap-4 justify-end border-t border-slate-200 print:hidden rounded-b-sm">
                            <button onClick={() => setOsImpressao(null)} className="btn-secondary">Voltar ao Sistema</button>
                            <button onClick={() => window.print()} className="bg-slate-800 text-white font-bold py-2 px-6 rounded shadow-md hover:bg-slate-900 flex gap-2 items-center transition-transform active:scale-95">
                                <Printer size={18} /> Imprimir / PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Manutencao;
