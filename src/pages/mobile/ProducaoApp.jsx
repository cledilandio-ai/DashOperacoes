import React, { useState } from 'react';
import { QrCode, ClipboardList, PenTool, LogOut, Package, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProducao } from '../../contexts/ProducaoContext';

const ProducaoApp = () => {
    const { user, logout } = useAuth();
    const { maquinas, produtos, lancarProducao } = useProducao(); // produtos (plural)

    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [maquinaId, setMaquinaId] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState('');

    const handleLancar = async (e) => {
        e.preventDefault();
        if (!maquinaId || !quantidade) {
            alert("Preencha Máquina e Quantidade!");
            return;
        }

        setLoading(true);
        const success = await lancarProducao({
            operadorId: user.id, // User logged in
            maquinaId: maquinaId,
            produtoId: produtoId || null,
            quantidade: quantidade
        });
        setLoading(false);

        if (success) {
            alert("Produção Registrada!");
            setModalOpen(false);
            setQuantidade('');
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
                <button className="w-full aspect-square bg-white rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform">
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

                    <button className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 active:bg-slate-50">
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                            <ClipboardList className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-slate-700 text-sm">Minhas OS</span>
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
                                <label className="block text-sm font-bold text-slate-700 mb-1">Máquina</label>
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
        </div>
    );
};

export default ProducaoApp;
