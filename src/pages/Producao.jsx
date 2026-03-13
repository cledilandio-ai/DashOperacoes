import React, { useState } from 'react';
import { useProducao } from '../contexts/ProducaoContext';
import { Factory, CheckCircle2, AlertCircle } from 'lucide-react';

const Producao = () => {
    const {
        operadores, maquinas, produtos,
        lancarProducao, lancamentos,
        carregarMaisLancamentos, temMais
    } = useProducao();

    const [formData, setFormData] = useState({
        operadorId: '',
        maquinaId: '',
        produtoId: '',
        quantidade: ''
    });

    const [feedback, setFeedback] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.operadorId || !formData.quantidade) {
            setFeedback({ type: 'error', msg: 'Preencha o operador e a quantidade.' });
            return;
        }

        // Cria o objeto para salvar (agora enviamos os IDs brutos para o Contexto tratar)
        const dados = {
            operadorId: formData.operadorId,
            maquinaId: formData.maquinaId,
            produtoId: formData.produtoId,
            quantidade: parseFloat(formData.quantidade)
        };

        lancarProducao(dados);

        setFeedback({ type: 'success', msg: `Produção de ${formData.quantidade}kg lançada com sucesso!` });
        setFormData({ operadorId: '', maquinaId: '', produtoId: '', quantidade: '' }); // Limpa form

        setTimeout(() => setFeedback(null), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 form-container">
            <header className="flex items-center gap-3 mb-8">
                <div className="bg-blue-100 p-3 rounded-xl">
                    <Factory className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Apontamento de Produção</h1>
                    <p className="text-slate-500">Registre a produção diária por operador.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* COLUNA 1: Formulário de Lançamento */}
                <div className="card border-l-4 border-l-blue-500">
                    <h2 className="text-lg font-bold mb-6 text-slate-700">Novo Lançamento</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Seleção de Operador */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Selecione o Operador</label>
                            <select
                                className="input-field py-3 bg-slate-50"
                                value={formData.operadorId}
                                onChange={e => setFormData({ ...formData, operadorId: e.target.value })}
                            >
                                <option value="">-- Escolha um Operador --</option>
                                {operadores.map(op => (
                                    <option key={op.id} value={op.id}>{op.nome} - {op.funcao}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Seleção de Máquina */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Máquina</label>
                                <select
                                    className="input-field"
                                    value={formData.maquinaId}
                                    onChange={e => setFormData({ ...formData, maquinaId: e.target.value })}
                                >
                                    <option value="">-- Manual --</option>
                                    {maquinas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Seleção de Produto */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Produto</label>
                                <select
                                    className="input-field"
                                    value={formData.produtoId}
                                    onChange={e => setFormData({ ...formData, produtoId: e.target.value })}
                                >
                                    <option value="">-- Selecione --</option>
                                    {produtos.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Input de Quantidade */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade Produzida (KG)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="input-field text-2xl font-bold py-4 pl-4 text-blue-700"
                                    placeholder="0.00"
                                    step="0.01"
                                    value={formData.quantidade}
                                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KG</span>
                            </div>
                        </div>

                        {/* Feedback de Sucesso/Erro */}
                        {feedback && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="font-medium">{feedback.msg}</span>
                            </div>
                        )}

                        <button type="submit" className="w-full btn-primary py-4 text-lg font-bold shadow-blue-200">
                            LANÇAR PRODUÇÃO
                        </button>
                    </form>
                </div>

                {/* COLUNA 2: Histórico Recente */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700 flex justify-between items-center">
                        <span>Últimos Lançamentos</span>
                        <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded-full text-slate-500">Hoje</span>
                    </h2>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {lancamentos.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                                <p>Nenhuma produção lançada hoje.</p>
                            </div>
                        ) : (
                            lancamentos.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center animate-fadeIn">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.operadorNome}</p>
                                        <p className="text-xs text-slate-500">{item.maquinaNome} • {new Date(item.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.data).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">{item.quantidade.toLocaleString('pt-BR')} <span className="text-xs text-blue-400">kg</span></p>
                                        <span className="text-xs text-slate-400 uppercase font-medium">{item.operadorFuncao}</span>
                                    </div>
                                </div>
                            ))
                        )}

                        {temMais && (
                            <button
                                onClick={carregarMaisLancamentos}
                                className="w-full py-2 text-sm font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-200"
                            >
                                Carregar Mais Antigos...
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
export default Producao;
