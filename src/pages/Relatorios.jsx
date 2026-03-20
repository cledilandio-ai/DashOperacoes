import React, { useState, useMemo } from 'react';
import { FileText, Printer, Calendar, Filter, Wrench, BarChart3, TrendingUp, CheckCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { useManutencao } from '../contexts/ManutencaoContext';
import { useIndustria } from '../contexts/IndustriaContext';
import { useProducao } from '../contexts/ProducaoContext';
import { useConfig } from '../contexts/ConfiguracoesContext';

const STATUS_LABEL = { PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em Andamento', AGUARDANDO_PECA: 'Ag. Peça', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' };
const STATUS_BADGE = {
    PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800 border-blue-300',
    AGUARDANDO_PECA: 'bg-orange-100 text-orange-800 border-orange-300',
    CONCLUIDA: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    CANCELADA: 'bg-red-100 text-red-800 border-red-300',
};

// ── Cabeçalho corporativo (igual ao da OS) ──
const CabecalhoRelatorio = ({ titulo, subtitulo, filtros, config }) => {
    const hoje = new Date().toLocaleString('pt-BR');
    return (
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-widest">{titulo}</h1>
                {subtitulo && <p className="text-sm text-slate-600 mt-0.5">{subtitulo}</p>}
                <p className="text-xs text-slate-500 mt-1">Emitido em: <strong>{hoje}</strong></p>
                {filtros && <p className="text-xs text-slate-400 mt-0.5">Filtros: {filtros}</p>}
            </div>
            <div className="text-right flex flex-col items-end">
                {config?.logo_base64 && <img src={config.logo_base64} alt="Logo" className="h-14 object-contain mb-2" />}
                <h2 className={`font-bold uppercase ${config?.logo_base64 ? 'text-xs text-slate-500 tracking-wider' : 'text-xl'}`}>
                    {config?.nome_empresa || 'Empresa Padrão'}
                </h2>
                {config?.cnpj && <p className="text-[10px] text-slate-400">CNPJ: {config.cnpj}</p>}
                {config?.cidade && <p className="text-[10px] text-slate-400">{config.cidade}{config?.estado ? ` - ${config.estado}` : ''}</p>}
            </div>
        </div>
    );
};

const Relatorios = () => {
    const { manutencoes = [] } = useManutencao() || {};
    const { maquinas = [] } = useIndustria() || {};
    const { operadores = [] } = useProducao() || {};
    const { config } = useConfig() || {};

    const [tipo, setTipo] = useState('OS');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('TODOS');
    const [tipoOSFiltro, setTipoOSFiltro] = useState('TODOS');
    const [maquinaFiltro, setMaquinaFiltro] = useState('');
    const [tecnicoFiltro, setTecnicoFiltro] = useState('');

    const tecnicos = operadores.filter(op => op.perfil === 'TECNICO' || op.tipo_comissao === 'MANUTENCAO');

    // ── Filtros de OS ──
    const osFiltradas = useMemo(() => {
        return manutencoes
            .filter(m => {
                if (statusFiltro !== 'TODOS' && m.status !== statusFiltro) return false;
                if (tipoOSFiltro !== 'TODOS' && m.tipo !== tipoOSFiltro) return false;
                if (maquinaFiltro && m.maquina_id !== parseInt(maquinaFiltro)) return false;
                if (tecnicoFiltro && m.tecnico_id !== parseInt(tecnicoFiltro)) return false;
                if (dataInicio && new Date(m.data_abertura) < new Date(dataInicio + 'T00:00:00')) return false;
                if (dataFim && new Date(m.data_abertura) > new Date(dataFim + 'T23:59:59')) return false;
                return true;
            })
            .sort((a, b) => b.id - a.id);
    }, [manutencoes, statusFiltro, tipoOSFiltro, maquinaFiltro, tecnicoFiltro, dataInicio, dataFim]);

    // ── Produtividade de Técnicos (baseado em OS) ──
    const osFiltradaProdut = useMemo(() => {
        return manutencoes.filter(m => {
            if (dataInicio && new Date(m.data_abertura) < new Date(dataInicio + 'T00:00:00')) return false;
            if (dataFim && new Date(m.data_abertura) > new Date(dataFim + 'T23:59:59')) return false;
            if (tecnicoFiltro) {
                const isMain = m.tecnico_id === parseInt(tecnicoFiltro);
                const isHelper = m.ajudantes && m.ajudantes.includes(parseInt(tecnicoFiltro));
                if (!isMain && !isHelper) return false;
            }
            return true;
        });
    }, [manutencoes, dataInicio, dataFim, tecnicoFiltro]);

    const produtividade = useMemo(() => {
        const map = {};
        osFiltradaProdut.forEach(m => {
            // Conta tanto o técnico principal quanto os ajudantes
            const ids = [m.tecnico_id, ...(m.ajudantes || [])].filter(Boolean);
            ids.forEach(tid => {
                if (tecnicoFiltro && tid !== parseInt(tecnicoFiltro)) return; // <-- Filtro rígido para não mostrar ajudantes cruzados ou o titular

                if (!map[tid]) {
                    const op = operadores.find(o => o.id === tid);
                    map[tid] = { 
                        id: tid, nome: op?.nome || 'N/D', total: 0, concluidas: 0, corretivas: 0, preventivas: 0, 
                        tempoTotal: 0, comSLA: 0, dentroPrazo: 0, 
                        maxPontos: 0, pontosGanhos: 0, 
                        tetoBonus: parseFloat(op?.produtividade_base) || 0 
                    };
                }
                map[tid].total += 1;

                // Regras I.E.M de Manutenção (Pesos de Prioridade)
                let pts = 1; // BAIXA ou padrão
                if (m.prioridade === 'ALTA') pts = 3;
                if (m.prioridade === 'MEDIA') pts = 2;
                
                map[tid].maxPontos += pts; // O limite máximo inclui todas as OS atribuídas a ele

                if (m.status === 'CONCLUIDA') {
                    map[tid].concluidas += 1;
                    if (m.data_abertura && m.data_conclusao) {
                        map[tid].tempoTotal += (new Date(m.data_conclusao) - new Date(m.data_abertura)) / 3600000;
                    }
                    if (m.prazo_limite_horas) {
                        map[tid].comSLA += 1;
                        const horasDemoradas = m.data_conclusao
                            ? (new Date(m.data_conclusao) - new Date(m.data_abertura)) / 3600000
                            : (new Date() - new Date(m.data_abertura)) / 3600000;
                        if (horasDemoradas <= m.prazo_limite_horas) {
                            map[tid].dentroPrazo += 1;
                            map[tid].pontosGanhos += pts; // Ganhou os pontos pois fechou no prazo
                        } else {
                            // Atrasou a OS? Zera os pontos! Apenas BAIXA (sem punição) ganha ponto independente se houver SLA?
                            // Segundo a regra: ALTA e MEDIA zera se atrasar. BAIXA não pune.
                            if (m.prioridade === 'BAIXA') map[tid].pontosGanhos += 1;
                        }
                    } else {
                        map[tid].pontosGanhos += pts; // Sem SLA = ganha os pontos automaticamente
                    }
                }
                
                if (m.tipo === 'CORRETIVA') map[tid].corretivas += 1;
                if (m.tipo === 'PREVENTIVA') map[tid].preventivas += 1;
            });
        });
        return Object.values(map).sort((a, b) => b.concluidas - a.concluidas);
    }, [osFiltradaProdut, operadores]);

    const totaisOS = useMemo(() => ({
        total: osFiltradas.length,
        concluidas: osFiltradas.filter(m => m.status === 'CONCLUIDA').length,
        pendentes: osFiltradas.filter(m => m.status === 'PENDENTE').length,
        emAndamento: osFiltradas.filter(m => m.status === 'EM_ANDAMENTO').length,
    }), [osFiltradas]);

    const filtroTexto = [
        dataInicio && `De: ${new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        dataFim && `Até: ${new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}`,
        statusFiltro !== 'TODOS' && `Status: ${STATUS_LABEL[statusFiltro] || statusFiltro}`,
        tipoOSFiltro !== 'TODOS' && `Tipo: ${tipoOSFiltro}`,
        maquinaFiltro && `Máquina: ${maquinas.find(m => m.id === parseInt(maquinaFiltro))?.nome || ''}`,
        tecnicoFiltro && `Técnico: ${operadores.find(o => o.id === parseInt(tecnicoFiltro))?.nome || ''}`,
    ].filter(Boolean).join(' | ');

    return (
        <div className="space-y-6">

            {/* ── Cabeçalho da Página (tela) ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-500" /> Relatórios
                    </h1>
                    <p className="text-slate-500 text-sm">Gere e imprima relatórios de OS e produtividade dos técnicos.</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-500/30 transition-all active:scale-95 print:hidden"
                >
                    <Printer size={16} /> Imprimir Relatório
                </button>
            </div>

            {/* ── Filtros ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
                <div className="p-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
                        <Filter size={16} className="text-purple-500" /> Configurar Relatório
                    </h2>

                    {/* Tipo */}
                    <div className="flex gap-2 mb-5">
                        <button onClick={() => setTipo('OS')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${tipo === 'OS' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                            <Wrench size={15} /> Ordens de Serviço
                        </button>
                        <button onClick={() => setTipo('PRODUTIVIDADE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all ${tipo === 'PRODUTIVIDADE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                            <TrendingUp size={15} /> Produtividade dos Técnicos
                        </button>
                    </div>

                    {/* Campos comuns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="label flex items-center gap-1"><Calendar size={12} /> Data Inicial</label>
                            <input type="date" className="input-field" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                        </div>
                        <div>
                            <label className="label flex items-center gap-1"><Calendar size={12} /> Data Final</label>
                            <input type="date" className="input-field" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Técnico</label>
                            <select className="input-field" value={tecnicoFiltro} onChange={e => setTecnicoFiltro(e.target.value)}>
                                <option value="">Todos os Técnicos</option>
                                {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        </div>

                        {tipo === 'OS' && (
                            <>
                                <div>
                                    <label className="label">Status da O.S.</label>
                                    <select className="input-field" value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
                                        <option value="TODOS">Todos os Status</option>
                                        <option value="PENDENTE">Pendente</option>
                                        <option value="EM_ANDAMENTO">Em Andamento</option>
                                        <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                                        <option value="CONCLUIDA">Concluída</option>
                                        <option value="CANCELADA">Cancelada</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Tipo de O.S.</label>
                                    <select className="input-field" value={tipoOSFiltro} onChange={e => setTipoOSFiltro(e.target.value)}>
                                        <option value="TODOS">Todos os Tipos</option>
                                        <option value="CORRETIVA">Corretiva</option>
                                        <option value="PREVENTIVA">Preventiva</option>
                                        <option value="PREDITIVA">Preditiva</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Máquina</label>
                                    <select className="input-field" value={maquinaFiltro} onChange={e => setMaquinaFiltro(e.target.value)}>
                                        <option value="">Todas as Máquinas</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Totalizadores (tela) */}
                {tipo === 'OS' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                        {[
                            { label: 'Total de O.S.', valor: totaisOS.total, cor: 'text-slate-800' },
                            { label: 'Concluídas', valor: totaisOS.concluidas, cor: 'text-emerald-600' },
                            { label: 'Pendentes', valor: totaisOS.pendentes, cor: 'text-yellow-600' },
                            { label: 'Em Andamento', valor: totaisOS.emAndamento, cor: 'text-blue-600' },
                        ].map(({ label, valor, cor }) => (
                            <div key={label} className="px-5 py-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                                <p className={`text-3xl font-black ${cor}`}>{valor}</p>
                            </div>
                        ))}
                    </div>
                )}
                {tipo === 'PRODUTIVIDADE' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-slate-100">
                        {[
                            { label: 'Total de OS no período', valor: osFiltradaProdut.length, cor: 'text-slate-800' },
                            { label: 'OS Concluídas', valor: osFiltradaProdut.filter(m => m.status === 'CONCLUIDA').length, cor: 'text-emerald-600' },
                            { label: 'Técnicos Ativos', valor: produtividade.length, cor: 'text-blue-600' },
                        ].map(({ label, valor, cor }) => (
                            <div key={label} className="px-5 py-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                                <p className={`text-3xl font-black ${cor}`}>{valor}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  ÁREA IMPRIMÍVEL                                               */}
            {/* ══════════════════════════════════════════════════════════════ */}

            {/* Cabeçalho corporativo — igual ao da OS — só aparece impresso */}
            <div className="hidden print:block bg-white p-8 font-mono text-sm">
                <CabecalhoRelatorio
                    titulo={tipo === 'OS' ? 'RELATÓRIO DE ORDENS DE SERVIÇO' : 'RELATÓRIO DE PRODUTIVIDADE — TÉCNICOS'}
                    subtitulo={tipo === 'OS' ? `${osFiltradas.length} OS listadas` : `${produtividade.length} técnico(s) no período`}
                    filtros={filtroTexto || 'Sem filtros — exibindo todos os registros'}
                    config={config}
                />
            </div>

            {/* ── Tabela de OS ── */}
            {tipo === 'OS' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-amber-50 print:bg-white print:border-none">
                        <Wrench size={16} className="text-amber-500" />
                        <span className="font-bold text-slate-700">Ordens de Serviço</span>
                        <span className="ml-auto text-sm text-slate-500">{osFiltradas.length} registro(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Máquina</th>
                                    <th className="px-4 py-3 w-1/3">Descrição do Problema</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Técnico Principal</th>
                                    <th className="px-4 py-3 text-center">Abertura</th>
                                    <th className="px-4 py-3 text-center">SLA</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {osFiltradas.length === 0 ? (
                                    <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">Nenhuma OS encontrada com os filtros selecionados.</td></tr>
                                ) : osFiltradas.map(m => (
                                    <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-black text-slate-700">#{m.id}</td>
                                        <td className="px-4 py-3 font-bold text-blue-700">{maquinas.find(mq => mq.id === m.maquina_id)?.nome || 'N/D'}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs leading-snug">{m.descricao_problema || m.descricao || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700">{m.tipo}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold uppercase text-slate-600">
                                            {operadores.find(o => o.id === m.tecnico_id)?.nome?.split(' ').slice(0, 2).join(' ') || 'LIVRE'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                                            {m.data_abertura ? new Date(m.data_abertura).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs font-bold text-slate-500">
                                            {m.prazo_limite_horas ? `${m.prazo_limite_horas}H` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[m.status] || 'bg-slate-100'}`}>
                                                {STATUS_LABEL[m.status] || m.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {osFiltradas.length > 0 && (
                                <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-700">
                                    <tr>
                                        <td className="px-4 py-2" colSpan={2}>TOTAIS DO PERÍODO</td>
                                        <td className="px-4 py-2" colSpan={6}>
                                            {totaisOS.total} OS &nbsp;|&nbsp;
                                            <span className="text-emerald-700">{totaisOS.concluidas} concluídas</span>&nbsp;|&nbsp;
                                            <span className="text-yellow-700">{totaisOS.pendentes} pendentes</span>&nbsp;|&nbsp;
                                            <span className="text-blue-700">{totaisOS.emAndamento} em andamento</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ── Tabela de Produtividade dos Técnicos ── */}
            {tipo === 'PRODUTIVIDADE' && (
                <>
                    {/* Ranking por técnico */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-emerald-50 print:bg-white print:border-none">
                            <TrendingUp size={16} className="text-emerald-600" />
                            <span className="font-bold text-slate-700">Desempenho dos Técnicos — OS no Período</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Técnico</th>
                                        <th className="px-4 py-3 text-center">OS Atribuídas</th>
                                        <th className="px-4 py-3 text-center">Concluídas</th>
                                        <th className="px-4 py-3 text-center">% Conclusão Geral</th>
                                        <th className="px-4 py-3 text-center">I.E.M (Eficiência)</th>
                                        <th className="px-4 py-3 text-right">Bônus Projetado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtividade.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                                            Nenhuma OS encontrada para o filtro selecionado. Verifique o período ou selecione outro técnico.
                                        </td></tr>
                                    ) : produtividade.map((tec, i) => {
                                        const pct = tec.total > 0 ? Math.round((tec.concluidas / tec.total) * 100) : 0;
                                        const iemPct = tec.maxPontos > 0 ? (tec.pontosGanhos / tec.maxPontos) : 0;
                                        const iemFormatado = Math.round(iemPct * 100);
                                        const bonusAReceber = tec.tetoBonus * iemPct;
                                        
                                        return (
                                            <tr key={tec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-black text-slate-400 text-xs">{i + 1}º</td>
                                                <td className="px-4 py-3 font-bold text-slate-800">{tec.nome}</td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-700">{tec.total}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="font-black text-slate-700 text-lg">{tec.concluidas}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-2 rounded-full ${pct >= 80 ? 'bg-slate-500' : pct >= 50 ? 'bg-slate-400' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-500">{pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span className={`text-lg font-black ${iemFormatado >= 80 ? 'text-emerald-600' : iemFormatado >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                                            {iemFormatado}%
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">{tec.pontosGanhos} / {tec.maxPontos} pts</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {tec.tetoBonus > 0 ? (
                                                        <>
                                                            <span className="font-black text-emerald-700 text-lg">
                                                                R$ {bonusAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold block pt-0.5">Teto: R$ {tec.tetoBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400 italic">Sem Teto (R$ 0)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-emerald-50 border-t border-emerald-100 p-4 print:p-2 text-xs text-emerald-800 flex items-start gap-2">
                            <CheckCircle size={14} className="mt-0.5 shrink-0" />
                            <span>
                                <strong>Modelo I.E.M de Manutenção Ativado:</strong> O cálculo de Eficiência avalia se o técnico cumpriu o SLA por prioridade. 
                                O valor (R$) a receber será o <strong>Teto de Bônus</strong> × a <strong>% de Eficiência</strong>. <br className="hidden md:block"/>
                                <em>Pontos possíveis: Alta = 3 pts | Média = 2 pts | Baixa = 1 pts. OS de Alta/Média zeram a pontuação se atrasarem.</em>
                            </span>
                        </div>
                    </div>

                    {/* Detalhamento das OS no período */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <span className="font-bold text-slate-700 text-sm">Detalhamento das OS no Período</span>
                            <span className="ml-3 text-xs text-slate-400">{osFiltradaProdut.length} registro(s)</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2">ID</th>
                                        <th className="px-4 py-2">Máquina</th>
                                        <th className="px-4 py-2">Tipo</th>
                                        <th className="px-4 py-2">Técnico</th>
                                        <th className="px-4 py-2 text-center">Abertura</th>
                                        <th className="px-4 py-2 text-center">Prazo SLA</th>
                                        <th className="px-4 py-2 text-center">Status</th>
                                        <th className="px-4 py-2 text-center">Ganho I.E.M</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {osFiltradaProdut.sort((a, b) => b.id - a.id).map(m => {
                                        let ptsMax = 1;
                                        if (m.prioridade === 'ALTA') ptsMax = 3;
                                        else if (m.prioridade === 'MEDIA') ptsMax = 2;

                                        let ptsGanhos = 0;
                                        let justificativa = 'Em aberto';
                                        
                                        if (m.status === 'CONCLUIDA') {
                                            if (m.prazo_limite_horas) {
                                                const horas = m.data_conclusao
                                                    ? (new Date(m.data_conclusao) - new Date(m.data_abertura)) / 3600000
                                                    : 0;
                                                if (horas <= m.prazo_limite_horas) {
                                                    ptsGanhos = ptsMax;
                                                    justificativa = `<span class="text-emerald-600 font-bold">+${ptsGanhos} pts</span> (No Prazo)`;
                                                } else {
                                                    ptsGanhos = m.prioridade === 'BAIXA' ? 1 : 0;
                                                    justificativa = m.prioridade === 'BAIXA' 
                                                        ? `<span class="text-emerald-600 font-bold">+1 pt</span> (Sem perda)` 
                                                        : `<span class="text-red-500 font-bold">0 pts</span> (Atrasou SLA)`;
                                                }
                                            } else {
                                                ptsGanhos = ptsMax;
                                                justificativa = `<span class="text-emerald-600 font-bold">+${ptsGanhos} pts</span> (Prazo Livre)`;
                                            }
                                        }

                                        return (
                                            <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="px-4 py-2 font-bold text-slate-600">#{m.id}</td>
                                                <td className="px-4 py-2 font-bold text-blue-700 text-xs">{maquinas.find(mq => mq.id === m.maquina_id)?.nome || 'N/D'}</td>
                                                <td className="px-4 py-2">
                                                    <div className="flex flex-col gap-0.5 items-start">
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">{m.tipo}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-wider ${m.prioridade === 'ALTA' ? 'text-red-500' : m.prioridade === 'MEDIA' ? 'text-amber-500' : 'text-blue-500'}`}>{m.prioridade || 'BAIXA'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-xs font-bold uppercase">{operadores.find(o => o.id === m.tecnico_id)?.nome?.split(' ')[0] || 'LIVRE'}</td>
                                                <td className="px-4 py-2 text-center text-xs text-slate-500">{m.data_abertura ? new Date(m.data_abertura).toLocaleDateString('pt-BR') : '-'}</td>
                                                <td className="px-4 py-2 text-center text-xs text-slate-500">{m.prazo_limite_horas ? `${m.prazo_limite_horas}H` : '-'}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[m.status] || 'bg-slate-100'}`}>
                                                        {STATUS_LABEL[m.status] || m.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center text-xs">
                                                    <span dangerouslySetInnerHTML={{ __html: justificativa }}></span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Estilos de Impressão */}
            <style>{`
                @media print {
                    aside, nav, .print\\:hidden { display: none !important; }
                    main { margin: 0 !important; padding: 0.5cm !important; }
                    .print\\:block { display: block !important; }
                    .bg-white { box-shadow: none !important; border: none !important; }
                    table { font-size: 10px; page-break-inside: auto; }
                    tr { page-break-inside: avoid; }
                    th, td { padding: 5px 8px !important; }
                    thead { display: table-header-group; }
                    .rounded-xl { border-radius: 0 !important; }
                }
                @page { size: A4 portrait; margin: 1cm; }
            `}</style>
        </div>
    );
};

export default Relatorios;
