import React, { useState, useEffect } from 'react';
import { QrCode, PenTool, LogOut, Package, CheckCircle, X, Wrench, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProducao } from '../../contexts/ProducaoContext';
import { useManutencao } from '../../contexts/ManutencaoContext';
import SearchSelect from '../../components/SearchSelect';

const ProducaoApp = () => {
    const authCtx = useAuth();
    const logonUser = authCtx?.user || null;
    const logout = authCtx?.logout;

    const producaoCtx = useProducao();
    const maquinas  = producaoCtx?.maquinas  || [];
    const produtos  = producaoCtx?.produtos  || [];
    const operadores = producaoCtx?.operadores || [];
    const turnos    = producaoCtx?.turnos    || [];
    const lancamentos = producaoCtx?.lancamentos || [];
    const lancarProducao = producaoCtx?.lancarProducao;

    const manutencaoCtx = useManutencao();
    const abrirOS = manutencaoCtx?.abrirOS;

    const [searchParams, setSearchParams] = useSearchParams();

    const [modalOpen,    setModalOpen]    = useState(false);
    const [modalOSOpen,  setModalOSOpen]  = useState(false);
    const [scannerOpen,  setScannerOpen]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [barcodeDetector, setBarcodeDetector] = useState(null);

    // Form Produção
    const [operadorId, setOperadorId] = useState('');
    const [maquinaId,  setMaquinaId]  = useState('');
    const [produtoId,  setProdutoId]  = useState('');
    const [turnoId,    setTurnoId]    = useState('');
    const [quantidade, setQuantidade] = useState('');

    // Form O.S.
    const [osForm, setOsForm] = useState({
        maquina_id: '',
        descricao_problema: '',
        prioridade: 'MEDIA',
        tecnico_id: null
    });

    // Iniciar BarcodeDetector
    useEffect(() => {
        if ('BarcodeDetector' in window) {
            // eslint-disable-next-line no-undef
            setBarcodeDetector(new BarcodeDetector({ formats: ['qr_code'] }));
        }
    }, []);

    // Detectar parâmetro do QR Code na URL
    useEffect(() => {
        const osMaquinaId = searchParams.get('solicitar_os');
        if (osMaquinaId) {
            setOsForm(prev => ({ ...prev, maquina_id: osMaquinaId }));
            setModalOSOpen(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('solicitar_os');
            setSearchParams(newParams);
        }
    }, [searchParams, setSearchParams]);

    // Auto-preencher Máquina, Produto e Turno ao escolher operador (por preferências do Admin)
    useEffect(() => {
        const idParaBuscar = operadorId || logonUser?.id;
        if (!idParaBuscar) return;

        const op = operadores.find(o => String(o.id) === String(idParaBuscar));
        if (!op) return;

        if (op.maquina_preferencial_id) setMaquinaId(String(op.maquina_preferencial_id));
        if (op.produto_preferencial_id) setProdutoId(String(op.produto_preferencial_id));
        if (op.turno_preferencial_id)   setTurnoId(String(op.turno_preferencial_id));
    }, [operadorId, logonUser, operadores]);

    const handleLancar = async (e) => {
        if (e) e.preventDefault();

        if (!operadorId && !logonUser?.id) {
            alert('Selecione o operador!');
            return;
        }
        if (!maquinaId) {
            alert('Selecione a Máquina!');
            return;
        }
        if (!quantidade) {
            alert('Informe a Quantidade!');
            return;
        }

        setLoading(true);
        const success = await lancarProducao({
            operadorId: operadorId || logonUser.id,
            maquinaId,
            produtoId: produtoId || null,
            turnoId:   turnoId   || null,
            quantidade
        });
        setLoading(false);

        if (success) {
            setQuantidade('');
            const ehAdmin = logonUser?.perfil === 'ADMIN' || logonUser?.perfil === 'GESTOR';
            if (!ehAdmin) setModalOpen(false);
        }
    };

    const handleAbrirOS = async (e) => {
        e.preventDefault();
        if (!osForm.maquina_id || !osForm.descricao_problema) {
            alert('Preencha todos os campos!');
            return;
        }

        setLoading(true);
        const { error } = await abrirOS({
            ...osForm,
            tipo: 'CORRETIVA',
            status: 'PENDENTE',
            data_abertura: new Date(),
            solicitante_id: logonUser?.id
        });
        setLoading(false);

        if (error) {
            alert('Erro ao abrir OS: ' + (error.message || JSON.stringify(error)));
        } else {
            alert('O.S. Aberta com Sucesso! A manutenção foi notificada.');
            setModalOSOpen(false);
            setOsForm({ maquina_id: '', descricao_problema: '', prioridade: 'MEDIA', tecnico_id: null });
        }
    };

    const ehSupervisor = logonUser?.perfil === 'ADMIN' || logonUser?.perfil === 'GESTOR';

    const opcoesOperador = operadores
        .filter(op =>
            op.funcao?.toUpperCase() !== 'TECNICO' &&
            op.perfil?.toUpperCase() !== 'TECNICO'
        )
        .map(op => ({
            value: String(op.id),
            label: op.nome,
            descricao: [op.funcao, op.turno].filter(Boolean).join(' • ')
        }));

    const maquinaAtual = maquinas.find(m => String(m.id) === String(maquinaId));
    const produtoAtual  = produtos.find(p => String(p.id) === String(produtoId));
    const turnoAtual    = turnos.find(t => String(t.id) === String(turnoId));

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Mobile */}
            <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="font-bold text-lg">Chão de Fábrica</h1>
                        <p className="text-xs opacity-80">Olá, {logonUser?.nome || 'Supervisor'}</p>
                    </div>
                    <button onClick={logout} className="p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Ação Principal: Ler QR Code */}
                <button
                    onClick={() => setScannerOpen(true)}
                    className="w-full aspect-square bg-white rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform"
                >
                    <div className="p-6 bg-blue-50 rounded-full text-blue-600">
                        <QrCode className="w-16 h-16" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800">Ler QR Code</h2>
                        <p className="text-slate-500 text-sm">Escaneie a Máquina para abrir O.S.</p>
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

                {/* Histórico Recente */}
                <div className="mt-8">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                        Lançamentos Recentes
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase">Sincronizado</span>
                    </h3>
                    <div className="space-y-3">
                        {lancamentos.slice(0, 5).map(lanc => (
                            <div key={lanc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{lanc.operadorNome}</div>
                                    <div className="text-[10px] text-slate-500">
                                        {lanc.maquinaNome} • {new Date(lanc.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
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

            {/* ====== MODAL LANÇAMENTO ====== */}
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

                            {/* Supervisor vê busca inteligente de operador */}
                            {ehSupervisor ? (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Qual operador realizou?
                                    </label>
                                    <SearchSelect
                                        options={opcoesOperador}
                                        value={operadorId}
                                        onChange={val => setOperadorId(val)}
                                        placeholder="Busque o nome do operador..."
                                    />
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-800 uppercase">Operador:</span>
                                    <span className="text-sm font-black text-blue-600">{logonUser?.nome}</span>
                                </div>
                            )}

                            {/* Campos informativos auto-preenchidos */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Máquina</span>
                                    <span className="text-xs font-bold text-slate-700 truncate block">
                                        {maquinaAtual?.nome || '—'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Produto</span>
                                    <span className="text-xs font-bold text-slate-700 truncate block">
                                        {produtoAtual?.nome || 'Geral'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Turno</span>
                                    <span className="text-xs font-bold text-slate-700 truncate block">
                                        {turnoAtual?.nome || '—'}
                                    </span>
                                </div>
                            </div>

                            {/* Troca manual se necessário */}
                            <details className="group">
                                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 font-bold text-center py-1 list-none">
                                    ▼ Ajuste manual (se necessário)
                                </summary>
                                <div className="mt-3 space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                                        value={maquinaId} onChange={e => setMaquinaId(e.target.value)}>
                                        <option value="">Trocar Máquina...</option>
                                        {maquinas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                                        value={produtoId} onChange={e => setProdutoId(e.target.value)}>
                                        <option value="">Trocar Produto...</option>
                                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                    <select className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                                        value={turnoId} onChange={e => setTurnoId(e.target.value)}>
                                        <option value="">Trocar Turno...</option>
                                        {turnos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                    </select>
                                </div>
                            </details>

                            {/* Quantidade */}
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

            {/* ====== MODAL O.S. ====== */}
            {modalOSOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> Abrir Chamado (Quebra)
                            </h3>
                            <button onClick={() => setModalOSOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAbrirOS} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Mecânico Líder (Opcional)</label>
                                <select
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    value={osForm.tecnico_id || ''}
                                    onChange={e => setOsForm({ ...osForm, tecnico_id: e.target.value ? parseInt(e.target.value) : null })}
                                >
                                    <option value="">Selecione o Mecânico Responsável...</option>
                                    {operadores?.filter(op =>
                                        op.funcao?.toUpperCase() === 'TECNICO' ||
                                        op.perfil?.toUpperCase() === 'TECNICO'
                                    ).map(op => (
                                        <option key={op.id} value={op.id}>{op.nome}</option>
                                    ))}
                                </select>
                            </div>
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
                                    value={osForm.descricao_problema}
                                    onChange={e => setOsForm({ ...osForm, descricao_problema: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Urgência</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['BAIXA', 'MEDIA', 'ALTA'].map(p => (
                                        <button key={p} type="button"
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

            {/* ====== MODAL SCANNER QR ====== */}
            {scannerOpen && (
                <ModalScanner
                    onScan={(id) => {
                        setOsForm(prev => ({ ...prev, maquina_id: id }));
                        setModalOSOpen(true);
                        setScannerOpen(false);
                    }}
                    onClose={() => setScannerOpen(false)}
                    detector={barcodeDetector}
                />
            )}
        </div>
    );
};

const ModalScanner = ({ onScan, onClose, detector }) => {
    const videoRef = React.useRef(null);
    const [status, setStatus] = useState('Iniciando câmera...');
    const [hasPermission, setHasPermission] = useState(true);

    React.useEffect(() => {
        let stream = null;
        let interval = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setStatus('Buscando QR Code...');
                }

                if (detector) {
                    interval = setInterval(async () => {
                        if (videoRef.current && videoRef.current.readyState === 4) {
                            try {
                                const barcodes = await detector.detect(videoRef.current);
                                if (barcodes.length > 0) {
                                    const rawValue = barcodes[0].rawValue;
                                    try {
                                        const url = new URL(rawValue);
                                        const machineId = url.searchParams.get('solicitar_os');
                                        onScan(machineId || rawValue);
                                    } catch {
                                        onScan(rawValue);
                                    }
                                }
                            } catch (e) {
                                console.error('Erro detecção:', e);
                            }
                        }
                    }, 500);
                }
            } catch (err) {
                console.error('Erro câmera:', err);
                setHasPermission(false);
                setStatus('Erro ao acessar câmera. Verifique as permissões.');
            }
        };

        startCamera();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (interval) clearInterval(interval);
        };
    }, [detector, onScan]);

    return (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-between p-6">
            <div className="w-full flex justify-between items-center text-white">
                <h3 className="font-bold">Scanner QR Code</h3>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden border-4 border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                    <div className="w-full h-full border-2 border-white/50 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-scan-line"></div>
                    </div>
                </div>
                {!hasPermission && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-8 text-center text-white gap-4">
                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                        <p className="font-bold">Acesso à câmera negado.</p>
                        <p className="text-xs opacity-70">Por favor, permita o acesso à câmera nas configurações do navegador.</p>
                    </div>
                )}
            </div>

            <div className="text-center w-full max-w-sm space-y-4">
                <p className="text-blue-400 font-bold animate-pulse">{status}</p>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                    <p className="text-[10px] text-white/60 mb-2 uppercase font-bold">Ou digite o ID / TAG da máquina:</p>
                    <div className="flex gap-2">
                        <input type="text" id="manual-id" placeholder="Ex: 10 ou MAQ-01"
                            className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={() => { const val = document.getElementById('manual-id').value; if (val) onScan(val); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
                            OK
                        </button>
                    </div>
                </div>
                <p className="text-[10px] text-white/40">Aponte para a etiqueta QR na lateral da máquina.</p>
            </div>

            <style>{`
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line { animation: scan-line 2.5s infinite linear; }
            `}</style>
        </div>
    );
};

export default ProducaoApp;
