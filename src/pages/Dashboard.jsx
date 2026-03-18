import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Package, AlertTriangle, CheckCircle, Factory } from 'lucide-react';
import { useProducao } from '../contexts/ProducaoContext';
import { useManutencao } from '../contexts/ManutencaoContext';

const KpiCard = ({ title, value, subtext, type = 'neutral' }) => {
    const colors = {
        positive: 'text-green-600 bg-green-50 border-green-200',
        negative: 'text-red-600 bg-red-50 border-red-200',
        warning: 'text-amber-600 bg-amber-50 border-amber-200',
        neutral: 'text-slate-600 bg-white border-slate-200',
        primary: 'text-blue-600 bg-blue-50 border-blue-200'
    };

    const statusColor = colors[type] || colors.neutral;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg ${statusColor}`}>
                    <Package className="w-5 h-5" />
                </div>
            </div>
            {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
        </div>
    );
};

const Dashboard = () => {
    const { lancamentos = [], maquinas = [] } = useProducao();
    const { ordens = [] } = useManutencao();

    // Cálculos em tempo real
    const stats = useMemo(() => {
        const hoje = new Date().toISOString().split('T')[0];
        const esteMes = new Date().toISOString().slice(0, 7);

        const prodHoje = lancamentos
            .filter(l => l.data.startsWith(hoje))
            .reduce((acc, curr) => acc + curr.quantidade, 0);

        const prodMes = lancamentos
            .filter(l => l.data.startsWith(esteMes))
            .reduce((acc, curr) => acc + curr.quantidade, 0);

        const osPendentes = ordens.filter(o => o.status === 'PENDENTE').length;

        // Máquina mais produtiva hoje
        const maquinaProd = {};
        lancamentos.filter(l => l.data.startsWith(hoje)).forEach(l => {
            maquinaProd[l.maquinaNome] = (maquinaProd[l.maquinaNome] || 0) + l.quantidade;
        });
        const topMaquina = Object.entries(maquinaProd).sort((a,b) => b[1] - a[1])[0] || ['-', 0];

        return { prodHoje, prodMes, osPendentes, topMaquina };
    }, [lancamentos, ordens]);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center text-center sm:text-left">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Visão Geral da Operação</h1>
                    <p className="text-slate-500">Acompanhamento em tempo real dos indicadores.</p>
                </div>
            </header>

            {/* Grid de KPIs Dinâmicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                    title="Produção Hoje" 
                    value={`${stats.prodHoje.toLocaleString('pt-BR')} kg`} 
                    type="primary" 
                    subtext="Registrado nas últimas 24h" 
                />
                <KpiCard 
                    title="Produção Mês" 
                    value={`${stats.prodMes.toLocaleString('pt-BR')} kg`} 
                    type="positive" 
                    subtext="Acumulado mensal" 
                />
                <KpiCard 
                    title="O.S. Pendentes" 
                    value={stats.osPendentes} 
                    type={stats.osPendentes > 0 ? "warning" : "positive"} 
                    subtext="Manutenções corretivas em aberto" 
                />
                <KpiCard 
                    title="Top Máquina (Hoje)" 
                    value={stats.topMaquina[0]} 
                    type="neutral" 
                    subtext={`${stats.topMaquina[1]} kg produzidos hoje`} 
                />
            </div>

            {/* Seção principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2 h-96">
                    <h2 className="font-bold text-lg mb-4">Produção Semanal</h2>
                    <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
                        Gráfico de Produção será renderizado aqui
                    </div>
                </div>

                <div className="card h-96">
                    <h2 className="font-bold text-lg mb-4">Alertas Recentes</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700">Manutenção Necessária</p>
                                <p className="text-xs text-red-600">Moinho 3 apresentou vibração acima do normal.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <TrendingDown className="w-5 h-5 text-amber-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-700">Estoque Baixo</p>
                                <p className="text-xs text-amber-600">Embalagens de 500g abaixo do mínimo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
