import React, { useMemo } from 'react';
import { Package, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { useProducao } from '../contexts/ProducaoContext';

const Expedicao = () => {
    const { lancamentos, operadores, loading } = useProducao();

    // --- CÁLCULO DE PRODUTIVIDADE (DASHBOARD) ---
    const dashboardData = useMemo(() => {
        if (!lancamentos || lancamentos.length === 0) return null;

        const totalProduzido = lancamentos.reduce((acc, l) => acc + (parseFloat(l.quantidade) || 0), 0);

        // Agrupamento por Operador para Produtividade
        const porOperador = {};
        lancamentos.forEach(l => {
            if (!porOperador[l.operadorNome]) {
                porOperador[l.operadorNome] = { total: 0, count: 0, meta: 0 };
            }
            porOperador[l.operadorNome].total += parseFloat(l.quantidade) || 0;
            porOperador[l.operadorNome].count += 1;

            // Tenta achar a meta do operador (Produtividade Base)
            const op = operadores.find(o => o.nome === l.operadorNome);
            if (op) porOperador[l.operadorNome].meta = op.produtividade_base || 0;
        });

        const ranking = Object.entries(porOperador)
            .map(([nome, dados]) => ({ nome, ...dados }))
            .sort((a, b) => b.total - a.total);

        return { totalProduzido, ranking };
    }, [lancamentos, operadores]);

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados da expedição...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-6 h-6 text-blue-600" /> Expedição & Recebimento
                </h1>
                <p className="text-slate-500">Controle de produção recebida e produtividade da equipe.</p>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card border-l-4 border-blue-500 flex items-center gap-4 p-6">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase">Total Recebido (Un)</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {dashboardData?.totalProduzido?.toLocaleString() || 0}
                        </h3>
                    </div>
                </div>

                <div className="card border-l-4 border-emerald-500 flex items-center gap-4 p-6">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase">Eficiência Média</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            98.5% {/* Mockado por enquanto, precisa de meta diária global */}
                        </h3>
                    </div>
                </div>

                <div className="card border-l-4 border-amber-500 flex items-center gap-4 p-6">
                    <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase">Produção Hoje</p>
                        <h3 className="text-2xl font-bold text-slate-800">
                            {/* Filtrar só hoje aqui seria ideal */}
                            {lancamentos.filter(l => new Date(l.data).toDateString() === new Date().toDateString())
                                .reduce((acc, l) => acc + (parseFloat(l.quantidade) || 0), 0)
                                .toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Ranking de Produtividade */}
                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> Produtividade por Operador
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {dashboardData?.ranking.map((op, idx) => (
                            <div key={op.nome} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {idx + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{op.nome}</p>
                                        <p className="text-xs text-slate-400">Meta Base: {op.meta}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">{op.total.toLocaleString()} un</p>
                                    <p className="text-xs text-emerald-600 font-bold">
                                        {op.meta > 0 ? Math.round((op.total / op.meta) * 100) : 0}% da Meta
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!dashboardData?.ranking || dashboardData.ranking.length === 0) && (
                            <div className="p-8 text-center text-slate-400">Sem dados de produtividade.</div>
                        )}
                    </div>
                </div>

                {/* Últimos Lançamentos (Recebimento) */}
                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" /> Recebimento de Linha
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                            Em Tempo Real
                        </span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Hora</th>
                                    <th className="px-4 py-3">Máquina</th>
                                    <th className="px-4 py-3">Operador</th>
                                    <th className="px-4 py-3 text-right">Qtd</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lancamentos.map((lanc) => (
                                    <tr key={lanc.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-500">
                                            {new Date(lanc.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{lanc.maquinaNome}</td>
                                        <td className="px-4 py-3 text-slate-600">{lanc.operadorNome}</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                            {lanc.quantidade}
                                        </td>
                                    </tr>
                                ))}
                                {lancamentos.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">
                                            Nenhum lançamento de produção registrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Expedicao;
