import React, { useState, useEffect } from 'react';
import { useProducao } from '../contexts/ProducaoContext';
import { Calendar, Search, TrendingUp, DollarSign } from 'lucide-react';

const Analista = () => {
    // Agora importamos operadores e maquinas do contexto
    const { getRelatorio, operadores, maquinas } = useProducao();
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

    // Dados brutos de lançamentos
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);

    const [valorPorUnidade, setValorPorUnidade] = useState(0.50);
    const [resumo, setResumo] = useState([]);

    const handleBuscar = async () => {
        setLoading(true);
        // Busca TODOS os lançamentos do período
        const resultado = await getRelatorio(dataInicio, dataFim);
        setLancamentos(resultado);
        processarDados(resultado);
        setLoading(false);
    };

    // A mágica acontece aqui: cruzamos Funcionários (Regras) com Lançamentos (Dados)
    const processarDados = (itemsLancamentos) => {
        if (!operadores || operadores.length === 0) return;

        const dadosParaProcessar = itemsLancamentos || lancamentos;

        // Itera sobre CADA FUNCIONÁRIO cadastrado
        const relatorioFinal = operadores.map(funcionario => {

            // Filtra os lançamentos que contam para este funcionário
            const lancamentosValidos = dadosParaProcessar.filter(lanc => {
                const regra = funcionario.tipo_comissao || 'INDIVIDUAL';
                const alvo = funcionario.alvo_comissao;

                // Lógica de Regras
                switch (regra) {
                    case 'MAQUINA':
                        // Ganha se o lançamento for da máquina Alvo (independente de quem lançou)
                        return lanc.maquina_id && lanc.maquina_id.toString() === alvo?.toString();

                    case 'SETOR':
                        // Ganha se a máquina do lançamento for do setor Alvo
                        // Precisamos achar a máquina do lançamento na lista de máquinas para saber o setor
                        // (O getRelatorio já traz maquinas(nome), mas setor talvez não. 
                        //  Mas temos a lista completa 'maquinas' do contexto com setor!)
                        const maqDoLanc = maquinas.find(m => m.id === lanc.maquina_id);
                        return maqDoLanc && maqDoLanc.setor === alvo;

                    case 'GERAL':
                        // Ganha sobre TUDO
                        return true;

                    case 'INDIVIDUAL':
                    default:
                        // Ganha sobre o que ele mesmo lançou
                        return lanc.operador_id === funcionario.id;
                }
            });

            // Soma a produção
            const totalProduzido = lancamentosValidos.reduce((acc, item) => acc + item.quantidade, 0);

            // Calcula Comissão
            // produtividade_base é a Porcentagem (%)
            const porcentagem = funcionario.produtividade_base || 0;
            // Valor a Receber = (Total Produzido * Valor Unitario) * (Porcentagem / 100)
            const valorReceber = (totalProduzido * valorPorUnidade) * (porcentagem / 100);

            // Metadados para tabela
            // Set de dias trabalhados (para média) e máquinas envolvidas
            const diasTrabalhados = new Set(lancamentosValidos.map(l => l.data_registro.split('T')[0])).size || 1;

            return {
                id: funcionario.id,
                nome: funcionario.nome,
                funcao: funcionario.funcao,
                percentualComissao: porcentagem,
                regra: funcionario.tipo_comissao || 'INDIVIDUAL',
                totalProduzido,
                // Média diária só faz sentido se dividirmos pelo periodo ou dias úteis. 
                // Usaremos dias com lançamento como proxy.
                mediaDiaria: totalProduzido / diasTrabalhados,
                valorReceber: valorReceber
            };
        });

        // Filtra para mostrar apenas quem tem produção OU quem é 'GERAL'/'SETOR' (cargos de gestão),
        // ou mostra todos? Melhor mostrar todos que têm comissão > 0 ou produção > 0.
        // Vou mostrar todos para clareza, mas ordenar por valor a receber.
        setResumo(relatorioFinal.sort((a, b) => b.valorReceber - a.valorReceber));
    };

    // Recalcula se mudar o preço unitário ou vierem novos operadores
    useEffect(() => {
        if (lancamentos.length > 0) processarDados(lancamentos);
    }, [valorPorUnidade, operadores, maquinas]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Relatório de Produtividade & Comissões</h1>
                <p className="text-slate-500">Cálculo de ganhos baseado nas regras de cada funcionário.</p>
            </header>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="pl-10 input-field"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="date"
                            className="pl-10 input-field"
                            value={dataFim}
                            onChange={e => setDataFim(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor Venda (R$/kg)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            step="0.01"
                            className="pl-10 input-field w-32"
                            value={valorPorUnidade}
                            onChange={e => setValorPorUnidade(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleBuscar}
                    disabled={loading}
                    className="btn-primary h-10 flex items-center gap-2 px-6"
                >
                    {loading ? 'Calculando...' : <><Search className="w-4 h-4" /> Gerar Planilha</>}
                </button>
            </div>

            {/* Tabela de Resultados */}
            {resumo.length > 0 ? (
                <div className="card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-4">Funcionário</th>
                                <th className="px-6 py-4">Regra Aplicada</th>
                                <th className="px-6 py-4 text-right">Produtividade Base (KG)</th>
                                <th className="px-6 py-4 text-right">% Comissão</th>
                                <th className="px-6 py-4 text-right text-emerald-600">Valor a Receber</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resumo.map((op) => (
                                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{op.nome}</div>
                                        <div className="text-xs text-slate-500">{op.funcao}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${op.regra === 'GERAL' ? 'bg-purple-100 text-purple-700' :
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
                                    <td className="px-6 py-4 text-right text-slate-500">
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
                                <td colSpan={2} className="px-6 py-4 text-right">FOLHA DE PAGAMENTO TOTAL:</td>
                                <td className="px-6 py-4 text-right">
                                    {/* Total produzido aqui não faz sentido somar pois Supervisor e Operador duelam sobre o mesmo kg */}
                                    -
                                </td>
                                <td></td>
                                <td className="px-6 py-4 text-right text-emerald-600">
                                    R$ {resumo.reduce((acc, curr) => acc + curr.valorReceber, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione um período e clique em "Gerar Planilha".</p>
                </div>
            )}
        </div>
    );
};

export default Analista;
