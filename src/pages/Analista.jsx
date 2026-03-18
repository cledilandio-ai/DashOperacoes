import React, { useState, useEffect } from 'react';
import { useProducao } from '../contexts/ProducaoContext';
import { Calendar, Search, TrendingUp, DollarSign, Package } from 'lucide-react';

const Analista = () => {
    const { getRelatorio, operadores, maquinas } = useProducao();
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [valorPorUnidade, setValorPorUnidade] = useState(0.50);
    const [resumo, setResumo] = useState([]);
    const [resumoProdutos, setResumoProdutos] = useState([]);

    const handleBuscar = async () => {
        setLoading(true);
        const resultado = await getRelatorio(dataInicio, dataFim);
        setLancamentos(resultado);
        processarDados(resultado);
        setLoading(false);
    };

    const processarDados = (itemsLancamentos) => {
        if (!operadores || operadores.length === 0) return;

        const dadosParaProcessar = itemsLancamentos || lancamentos;

        const relatorioFinal = operadores.map(funcionario => {
            const lancamentosValidos = dadosParaProcessar.filter(lanc => {
                const regra = funcionario.tipo_comissao || 'INDIVIDUAL';
                const alvo = funcionario.alvo_comissao;

                switch (regra) {
                    case 'MAQUINA':
                        return lanc.maquina_id && lanc.maquina_id.toString() === alvo?.toString();
                    case 'SETOR':
                        const maqDoLanc = maquinas.find(m => m.id === lanc.maquina_id);
                        return maqDoLanc && maqDoLanc.setor === alvo;
                    case 'GERAL':
                        return true;
                    case 'INDIVIDUAL':
                    default:
                        return lanc.operador_id === funcionario.id;
                }
            });

            const totalProduzido = lancamentosValidos.reduce((acc, item) => acc + item.quantidade, 0);
            const porcentagem = funcionario.produtividade_base || 0;
            const valorReceber = (totalProduzido * valorPorUnidade) * (porcentagem / 100);
            const diasTrabalhados = new Set(lancamentosValidos.map(l => l.data_registro.split('T')[0])).size || 1;

            const prodsOp = {};
            lancamentosValidos.forEach(l => {
                const pid = l.produto_id || 'manual';
                const pnome = l.produtos?.nome || 'Manual/Indefinido';
                if (!prodsOp[pid]) prodsOp[pid] = { nome: pnome, total: 0 };
                prodsOp[pid].total += l.quantidade;
            });

            return {
                id: funcionario.id,
                nome: funcionario.nome,
                funcao: funcionario.funcao,
                turno: funcionario.turno,
                percentualComissao: porcentagem,
                regra: funcionario.tipo_comissao || 'INDIVIDUAL',
                totalProduzido,
                mediaDiaria: totalProduzido / diasTrabalhados,
                valorReceber: valorReceber,
                produtos: Object.values(prodsOp).sort((a, b) => b.total - a.total)
            };
        });

        setResumo(relatorioFinal.sort((a, b) => b.valorReceber - a.valorReceber));

        const prodMap = {};
        dadosParaProcessar.forEach(lanc => {
            const pId = lanc.produto_id || 'indefinido';
            const pNome = lanc.produtos?.nome || 'Produto Indefinido';
            if (!prodMap[pId]) prodMap[pId] = { id: pId, nome: pNome, total: 0 };
            prodMap[pId].total += lanc.quantidade;
        });
        setResumoProdutos(Object.values(prodMap).sort((a, b) => b.total - a.total));
    };

    useEffect(() => {
        if (lancamentos.length > 0) processarDados(lancamentos);
    }, [valorPorUnidade, operadores, maquinas]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Relatório de Produtividade & Comissões</h1>
                <p className="text-slate-500">Cálculo de ganhos baseado nas regras de cada funcionário.</p>
            </header>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="date" className="pl-10 input-field" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="date" className="pl-10 input-field" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor Venda (R$/kg)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="number" step="0.01" className="pl-10 input-field w-32" value={valorPorUnidade} onChange={e => setValorPorUnidade(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
                <button onClick={handleBuscar} disabled={loading} className="btn-primary h-10 flex items-center gap-2 px-6">
                    {loading ? 'Calculando...' : <><Search className="w-4 h-4" /> Gerar Relatório</>}
                </button>
            </div>

            {resumo.length > 0 ? (
                <>
                    <div className="card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">Funcionário</th>
                                    <th className="px-6 py-4">Regra</th>
                                    <th className="px-6 py-4 text-right">Produtividade (KG)</th>
                                    <th className="px-6 py-4 text-right">% Com.</th>
                                    <th className="px-6 py-4 text-right text-emerald-600">Comissão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {resumo.map((op) => (
                                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-slate-800">{op.nome}</div>
                                                {op.turno && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">{op.turno}</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 mb-2">{op.funcao}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {op.produtos.map((p, idx) => (
                                                    <span key={idx} className="text-[9px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 italic">
                                                        {p.nome}: <b>{p.total}kg</b>
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                op.regra === 'GERAL' ? 'bg-purple-100 text-purple-700' :
                                                op.regra === 'MAQUINA' ? 'bg-blue-100 text-blue-700' :
                                                op.regra === 'SETOR' ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {op.regra}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {op.totalProduzido.toLocaleString('pt-BR')} kg
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-sm">
                                            {op.percentualComissao.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 text-lg">
                                            R$ {op.valorReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 font-bold text-slate-800">
                                    <td colSpan={4} className="px-6 py-4 text-right">TOTAL COMISSÕES:</td>
                                    <td className="px-6 py-4 text-right text-emerald-600">
                                        R$ {resumo.reduce((acc, curr) => acc + curr.valorReceber, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-8 space-y-4">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" /> Resumo Consolidado por Produto
                        </h2>
                        <div className="card overflow-hidden border-t-2 border-t-blue-500">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4 text-right">Volume Produzido</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {resumoProdutos.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">{p.nome}</td>
                                            <td className="px-6 py-4 text-right font-black text-blue-600">
                                                {p.total.toLocaleString('pt-BR')} kg
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Nenhum dado para o período selecionado.</p>
                </div>
            )}
        </div>
    );
};

export default Analista;
