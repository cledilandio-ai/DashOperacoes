import React, { useState, useEffect } from 'react';
import { QrCode, ClipboardList, PenTool, LogOut, Package, CheckCircle, X, Wrench, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProducao } from '../../contexts/ProducaoContext';
import { useManutencao } from '../../contexts/ManutencaoContext';

const ProducaoApp = () => {
    const { user, logout } = useAuth();
    const { maquinas = [], produtos = [], operadores = [], lancamentos = [], lancarProducao } = useProducao();
    const { abrirOS } = useManutencao() || {};
    const [searchParams, setSearchParams] = useSearchParams();

    const [modalOpen, setModalOpen] = useState(false);
    const [modalOSOpen, setModalOSOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form Produção
    const [operadorId, setOperadorId] = useState('');
    const [maquinaId, setMaquinaId] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState('');

    // Form O.S.
    const [osForm, setOsForm] = useState({
        maquina_id: '',
        descricao: '',
        prioridade: 'MEDIA'
    });

    // Detectar parâmetro do QR Code
    useEffect(() => {
        const osMaquinaId = searchParams.get('solicitar_os');
        if (osMaquinaId) {
            setOsForm(prev => ({ ...prev, maquina_id: osMaquinaId }));
            setModalOSOpen(true);
            // Limpa o parâmetro da URL para não reabrir ao dar refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.set('solicitar_os', ''); // ou delete, mas set vazio é mais seguro em alguns roteadores
            newParams.delete('solicitar_os');
            setSearchParams(newParams);
        }
    }, [searchParams, setSearchParams]);

    // Auto-selecionar produto ao escolher máquina
    useEffect(() => {
        if (maquinaId) {
            const maq = maquinas.find(m => m.id.toString() === maquinaId.toString());
            if (maq && maq.produto_atual_id) {
                setProdutoId(maq.produto_atual_id.toString());
            } else {
                setProdutoId('');
            }
        }
    }, [maquinaId, maquinas]);

    const handleLancar = async (e) => {
        e.preventDefault();
        if (!maquinaId || !quantidade) {
            alert("Preencha Máquina e Quantidade!");
            return;
        }

        setLoading(true);
        const success = await lancarProducao({
            operadorId: operadorId || user.id, // Usa o selecionado ou o logado
            maquinaId: maquinaId,
            produtoId: produtoId || null,
            quantidade: quantidade
        });
        setLoading(false);

        if (success) {
            // Se for Supervisor (Admin), talvez queira manter a máquina mas mudar o operador
            // Por enquanto vamos apenas limpar a quantidade para o próximo lançamento
            setQuantidade('');
            // Se não for admin, fecha o modal. Se for, mantém aberto para o próximo?
            // O usuário disse "ele lança a produção de cada operador", sugerindo que ele faz vários seguidos.
            if (user.perfil !== 'ADMIN') {
                setModalOpen(false);
            }
        }
    };

    const handleAbrirOS = async (e) => {
        e.preventDefault();
        if (!osForm.maquina_id || !osForm.descricao) return alert("Preencha todos os campos!");

        setLoading(true);
        const { error } = await abrirOS({
            ...osForm,
            tipo: 'CORRETIVA',
            status: 'PENDENTE',
            data_abertura: new Date(),
            solicitante_id: user.id
        });
        setLoading(false);

        if (error) {
            alert('Erro ao abrir OS: ' + error.message);
        } else {
            alert('O.S. Aberta com Sucesso! A manutenção foi notificada.');
            setModalOSOpen(false);
            setOsForm({ maquina_id: '', descricao: '', prioridade: 'MEDIA' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Mobile */}
            <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg">Chão de Fábrica</h1>
                        <p className="text-xs opacity-80">Olá, {user?.nome || 'Operador'}</p>
                    </div>
                    <button onClick={logout} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Ação Principal: Ler QR Code */}
                <button 
                    onClick={() => alert("Dica: Use a câmera do seu celular para escanear a etiqueta da máquina.")}
                    className="w-full aspect-square bg-white rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform"
                >
                    <div className="p-6 bg-blue-50 rounded-full text-blue-600">
                        <QrCode className="w-16 h-16" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800">Ler QR Code</h2>
                        <p className="text-slate-500 text-sm">Abrir OS na Máquina</p>
                    </div>
                </button>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:bg-slate-50"
                    >
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <Package className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Lançar Produção</span>
                    </button>

                    <button
                        onClick={() => setModalOSOpen(true)}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:bg-slate-50"
                    >
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                            <Wrench className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Abrir O.S.</span>
                    </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                        <PenTool className="w-4 h-4" /> Dica Rápida
                    </h3>
                    <p className="text-sm text-blue-600">
                        Para abrir uma OS, aponte a câmera para o código QR colado na máquina.
                    </p>
                </div>

                {/* Histórico Recente (Visão Supervisor) */}
                <div className="mt-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                        Lançamentos Recentes
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase">Sincronizado</span>
                    </h3>
                    <div className="space-y-3">
                        {lancamentos.slice(0, 5).map(lanc => (
                            <div key={lanc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center animate-in fade-in slide-in-from-right-5">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{lanc.operadorNome}</div>
                                    <div className="text-[10px] text-slate-500">{lanc.maquinaNome} • {new Date(lanc.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-blue-600">{lanc.quantidade} <span className="text-[10px]">KG</span></div>
                                    <div className="text-[9px] text-slate-400 uppercase">{lanc.operadorFuncao}</div>
                                </div>
                            </div>
                        ))}
                        {lancamentos.length === 0 && (
                            <div className="text-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl text-sm italic">
                                Nenhum lançamento recente.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Lançamento */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Nova Produção</h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleLancar} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Quem está operando?</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    value={operadorId}
                                    onChange={e => setOperadorId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione o Operador...</option>
                                    {/* Adiciona o usuário logado como primeira opção se ele for operador */}
                                    <option value={user.id}>EU ({user.nome})</option>
                                    <hr />
                                    {operadores?.filter(op => op.id !== user.id).map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.nome} {op.turno ? `(${op.turno})` : ''} - {op.funcao}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Máquina / Linha</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    value={maquinaId}
                                    onChange={e => setMaquinaId(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {maquinas?.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Produto (Opcional)</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    value={produtoId}
                                    onChange={e => setProdutoId(e.target.value)}
                                >
                                    <option value="">Geral / Indefinido</option>
                                    {produtos?.map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-2xl text-center text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="000"
                                    value={quantidade}
                                    onChange={e => setQuantidade(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                {loading ? 'Salvando...' : <><CheckCircle className="w-5 h-5" /> Confirmar Lançamento</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal OS */}
            {modalOSOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Nova O.S. (Quebra)
                            </h3>
                            <button onClick={() => setModalOSOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAbrirOS} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Máquina / Equipamento</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    value={osForm.maquina_id}
                                    onChange={e => setOsForm({ ...osForm, maquina_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {maquinas?.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} {m.tag ? `[${m.tag}]` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">O que aconteceu?</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 h-24 resize-none"
                                    placeholder="Ex: Motor fazendo barulho, correia solta..."
                                    value={osForm.descricao}
                                    onChange={e => setOsForm({ ...osForm, descricao: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Urgência</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setOsForm({ ...osForm, prioridade: p })}
                                            className={`py-2 rounded-lg font-bold text-xs border-2 transition-all
                                                ${osForm.prioridade === p 
                                                    ? (p === 'ALTA' ? 'bg-red-50 border-red-500 text-red-600' : p === 'MEDIA' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-blue-50 border-blue-500 text-blue-600') 
                                                    : 'bg-white border-slate-100 text-slate-300'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                {loading ? 'Enviando...' : <><Wrench className="w-5 h-5" /> Abrir Chamado</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProducaoApp;
