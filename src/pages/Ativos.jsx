import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Factory, Layers, FolderOpen, Cog, Wrench, Search,
    ChevronDown, ChevronRight, Plus, Edit3, Trash2, X,
    Clock, AlertTriangle, CheckCircle, Printer, Layers as LayersIcon
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useIndustria } from '../contexts/IndustriaContext';
import { useProducao } from '../contexts/ProducaoContext';
import SearchSelect from '../components/SearchSelect';

// ─── Utilitários ────────────────────────────────────────────────────────────

/** Constrói árvore de setores a partir de lista plana */
function buildTree(setores) {
    const map = {};
    const roots = [];
    setores.forEach(s => { map[s.id] = { ...s, filhos: [] }; });
    setores.forEach(s => {
        if (s.pai_id && map[s.pai_id]) {
            map[s.pai_id].filhos.push(map[s.id]);
        } else {
            roots.push(map[s.id]);
        }
    });
    return roots;
}

/** Retorna todos os IDs de descendentes de um nó (incluindo o próprio) */
function getDescendantIds(no) {
    const ids = [no.id];
    (no.filhos || []).forEach(f => ids.push(...getDescendantIds(f)));
    return ids;
}

// ─── Configuração visual por tipo ────────────────────────────────────────────

const TIPO_CONFIG = {
    GALPAO:   { label: 'Galpão',    icon: Factory,    bg: 'bg-slate-800', text: 'text-white',         badge: 'bg-amber-500 text-white' },
    SETOR:    { label: 'Setor',     icon: Layers,     bg: 'bg-slate-100', text: 'text-slate-700',     badge: 'bg-blue-100 text-blue-700' },
    SUBSETOR: { label: 'Sub-setor', icon: FolderOpen, bg: 'bg-white',     text: 'text-slate-600',     badge: 'bg-green-100 text-green-700' },
};

const TIPO_FILHO = {
    GALPAO:   'SETOR',
    SETOR:    'SUBSETOR',
    SUBSETOR: 'SUBSETOR',
};

// ─── MODAIS ──────────────────────────────────────────────────────────────────

const ModalSetor = ({ modo, pai, setorEdit, onSalvar, onFechar }) => {
    const isEdicao = modo === 'editar';
    const tipoFilho = pai ? (TIPO_FILHO[pai.tipo] || 'SUBSETOR') : 'GALPAO';
    const tipoConfig = TIPO_CONFIG[isEdicao ? setorEdit.tipo : tipoFilho] || TIPO_CONFIG.SETOR;

    const [form, setForm] = useState({
        nome: isEdicao ? setorEdit.nome : '',
        descricao: isEdicao ? (setorEdit.descricao || '') : '',
        tipo: isEdicao ? setorEdit.tipo : tipoFilho,
    });
    const [salvando, setSalvando] = useState(false);
    const up = (e) => e.target.value.toUpperCase(); // helper UI maiúsculo

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSalvando(true);
        await onSalvar(form);
        setSalvando(false);
    };

    const IconeTipo = tipoConfig.icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className={`${tipoConfig.bg} ${tipoConfig.text} p-4 flex justify-between items-center`}>
                    <h3 className="font-bold flex items-center gap-2">
                        <IconeTipo className="w-5 h-5" />
                        {isEdicao ? `Editar ${tipoConfig.label}` : `Novo ${tipoConfig.label}`}
                        {pai && !isEdicao && <span className="text-sm font-normal opacity-75">em "{pai.nome}"</span>}
                    </h3>
                    <button type="button" onClick={onFechar}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {/* Seletor de tipo só aparece na raiz ou edição */}
                    {(!pai || isEdicao) && (
                        <div>
                            <label className="label">Tipo</label>
                            <select className="input-field" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                                <option value="GALPAO">🏭 Galpão Industrial</option>
                                <option value="SETOR">🏗️ Setor</option>
                                <option value="SUBSETOR">📂 Sub-setor</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="label">Nome *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={
                                form.tipo === 'GALPAO' ? 'Ex: Café, Serramil...' :
                                form.tipo === 'SETOR' ? 'Ex: Torra, Moagem...' :
                                'Ex: Pré-limpeza, Empacotamento...'
                            }
                            value={form.nome}
                            onChange={e => setForm({ ...form, nome: up(e) })}
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Descrição (opcional)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Breve descrição do setor..."
                            value={form.descricao}
                            onChange={e => setForm({ ...form, descricao: up(e) })}
                        />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={salvando} className="btn-primary bg-amber-600 hover:bg-amber-700">
                        {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : `Criar ${tipoConfig.label}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ModalMaquina = ({ modo, maquinaEdit, setorIdInicial, setores, onSalvar, onFechar }) => {
    const isEdicao = modo === 'editar';
    const [form, setForm] = useState({
        nome: isEdicao ? maquinaEdit.nome : '',
        setor_id: isEdicao ? maquinaEdit.setor_id : (setorIdInicial || ''),
        modelo: isEdicao ? (maquinaEdit.modelo || '') : '',
        tag: isEdicao ? (maquinaEdit.tag || '') : '',
        fabricante: isEdicao ? (maquinaEdit.fabricante || '') : '',
        horas_uso_diario: isEdicao ? (maquinaEdit.horas_uso_diario || 8) : 8,
        descricao: isEdicao ? (maquinaEdit.descricao || '') : '',
    });
    const [salvando, setSalvando] = useState(false);
    const up = (e) => e.target.value.toUpperCase();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim() || !form.setor_id) return;
        setSalvando(true);
        await onSalvar(form);
        setSalvando(false);
    };

    /** Prepara opções hierárquicas para o SearchSelect */
    const getOpcoesSetor = (nos, nivel = 0) =>
        nos.flatMap(no => [
            { 
                value: no.id, 
                label: `${'— '.repeat(nivel)}${TIPO_CONFIG[no.tipo]?.label?.slice(0,1) || ''} ${no.nome}`,
                nome: no.nome // para busca limpa sem os traços
            },
            ...getOpcoesSetor(no.filhos || [], nivel + 1)
        ]);

    // Monta árvore para o select
    const arvore = buildTree(setores);
    const opcoesLocal = getOpcoesSetor(arvore);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-amber-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Cog className="w-5 h-5" />
                        {isEdicao ? 'Editar Máquina' : 'Nova Máquina'}
                    </h3>
                    <button type="button" onClick={onFechar}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Local (Setor / Sub-setor) *</label>
                        <SearchSelect
                            options={opcoesLocal}
                            value={form.setor_id}
                            onChange={val => setForm({ ...form, setor_id: val })}
                            placeholder="🔍 Pesquisar local..."
                            required={true}
                            emptyMessage="Nenhum local encontrado."
                        />
                    </div>
                    <div>
                        <label className="label">Nome da Máquina *</label>
                        <input type="text" className="input-field" placeholder="Ex: Torrador 01" value={form.nome} onChange={e => setForm({ ...form, nome: up(e) })} required autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">TAG (Patrimônio)</label>
                            <input type="text" className="input-field" placeholder="PAT-001" value={form.tag} onChange={e => setForm({ ...form, tag: up(e) })} />
                        </div>
                        <div>
                            <label className="label">Modelo</label>
                            <input type="text" className="input-field" placeholder="Ex: XP-2000" value={form.modelo} onChange={e => setForm({ ...form, modelo: up(e) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Fabricante</label>
                            <input type="text" className="input-field" placeholder="Ex: Siemens" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Uso Diário (h)</label>
                            <input type="number" step="0.5" min="0.5" max="24" className="input-field" value={form.horas_uso_diario} onChange={e => setForm({ ...form, horas_uso_diario: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Descrição</label>
                        <input type="text" className="input-field" placeholder="Função da máquina..." value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={salvando} className="btn-primary bg-amber-600 hover:bg-amber-700">
                        {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Máquina'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ModalEquipamento = ({ modo, equipEdit, maquinaId, maquinas, onSalvar, onFechar }) => {
    const isEdicao = modo === 'editar';
    const [form, setForm] = useState({
        nome: isEdicao ? equipEdit.nome : '',
        maquina_id: isEdicao ? equipEdit.maquina_id : (maquinaId || ''),
        descricao: isEdicao ? (equipEdit.descricao || '') : '',
        tag: isEdicao ? (equipEdit.tag || '') : '',
        fabricante: isEdicao ? (equipEdit.fabricante || '') : '',
        modelo: isEdicao ? (equipEdit.modelo || '') : '',
    });
    const [salvando, setSalvando] = useState(false);
    const up = (e) => e.target.value.toUpperCase();


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        setSalvando(true);
        await onSalvar(form);
        setSalvando(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onFechar}>
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        {isEdicao ? 'Editar Equipamento' : 'Novo Equipamento / Componente'}
                    </h3>
                    <button type="button" onClick={onFechar}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>
                <div className="p-6 space-y-4">
                    {(!maquinaId || isEdicao) && (
                        <div>
                            <label className="label">Máquina *</label>
                            <SearchSelect
                                options={maquinas.map(m => ({ 
                                    value: m.id, 
                                    label: m.nome, 
                                    tag: m.tag, 
                                    descricao: m.descricao 
                                }))}
                                value={form.maquina_id}
                                onChange={val => setForm({ ...form, maquina_id: val })}
                                placeholder="🔍 Pesquisar máquina..."
                                required={true}
                                emptyMessage="Nenhuma máquina encontrada."
                            />
                        </div>
                    )}
                    <div>
                        <label className="label">Nome do Equipamento *</label>
                        <input type="text" className="input-field" placeholder="Ex: Motor Principal, Painel Elétrico" value={form.nome} onChange={e => setForm({ ...form, nome: up(e) })} required autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">TAG</label>
                            <input type="text" className="input-field" placeholder="EQ-001" value={form.tag} onChange={e => setForm({ ...form, tag: up(e) })} />
                        </div>
                        <div>
                            <label className="label">Fabricante</label>
                            <input type="text" className="input-field" placeholder="Ex: WEG" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: up(e) })} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Descrição</label>
                        <input type="text" className="input-field" placeholder="Função do componente..." value={form.descricao} onChange={e => setForm({ ...form, descricao: up(e) })} />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={salvando} className="btn-primary bg-blue-600 hover:bg-blue-700">
                        {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Modal de Etiqueta (Impressão) ──────────────────────────────────────────

const ModalEtiqueta = ({ maquina, onFechar }) => {
    const handlePrint = () => {
        window.print();
    };

    // URL para a qual o QR Code vai apontar
    const qrUrl = `${window.location.origin}/producao?solicitar_os=${maquina.id}`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4" onClick={onFechar}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Printer className="w-4 h-4 text-amber-500" /> Prévia da Etiqueta
                    </h3>
                    <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center gap-6">
                    {/* A Etiqueta real (selecionada para impressão) */}
                    <div id="etiqueta-print" className="bg-white p-6 border-2 border-slate-200 rounded-lg flex flex-col items-center gap-4 shadow-sm">
                        <div className="text-center">
                            <h4 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-widest">{maquina.tag || 'SEM TAG'}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{maquina.nome}</p>
                        </div>
                        
                        <div className="p-2 border border-slate-100 rounded-xl bg-white">
                            <QRCodeCanvas 
                                value={qrUrl} 
                                size={160} 
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-medium italic">Escaneie para abrir O.S.</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 text-center px-4 italic">
                        Dica: Use papel adesivo térmico para melhor resultado.
                    </p>
                </div>

                <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-100">
                    <button onClick={onFechar} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                        Sair
                    </button>
                    <button onClick={handlePrint} className="flex-1 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    /* Oculta tudo na tela */
                    body * {
                        visibility: hidden !important;
                    }
                    
                    /* Mostra apenas a etiqueta e seus conteúdos */
                    #etiqueta-print, #etiqueta-print * {
                        visibility: visible !important;
                    }

                    /* Posiciona a etiqueta no topo da página de impressão */
                    #etiqueta-print {
                        position: absolute !important;
                        left: 50% !important;
                        top: 0 !important;
                        transform: translateX(-50%) !important;
                        width: 100mm !important;
                        border: 1px solid #000 !important;
                        padding: 20px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        background: white !important;
                    }

                    /* Forçar exibição de cores e imagens (QR Code) */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        margin: 10mm;
                        size: portrait;
                    }
                }
            `}</style>
        </div>
    );
};

// ─── Componente de estado de confirmação de exclusão inline ──────────────────

const BotaoExcluir = ({ onConfirmar, label = 'Remover' }) => {
    const [confirmando, setConfirmando] = useState(false);
    if (confirmando) {
        return (
            <span className="flex items-center gap-1">
                <span className="text-xs text-red-600 font-semibold">Confirmar?</span>
                <button onClick={onConfirmar} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-0.5 rounded font-semibold">Sim</button>
                <button onClick={() => setConfirmando(false)} className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-0.5 rounded">Não</button>
            </span>
        );
    }
    return (
        <button
            onClick={() => setConfirmando(true)}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
            title={label}
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
    );
};

// ─── Componente Máquina ────────────────────────────────────────────────────────

const CardMaquina = ({ 
    maquina, equipamentos, produtos = [], onNovoEquipamento, onEditarMaquina, onDeleteMaquina, onEditarEquipamento, onDesmontarEquipamento,
    onImprimirEtiqueta, onUpdateMaquina 
}) => {
    const [expandido, setExpandido] = useState(false);
    const equips = equipamentos.filter(e => e.maquina_id === maquina.id);

    const statusColor = {
        DISPONIVEL: 'bg-green-100 text-green-700',
        MANUTENCAO: 'bg-yellow-100 text-yellow-700',
        PARADA: 'bg-red-100 text-red-700',
    }[maquina.status_atual] || 'bg-slate-100 text-slate-600';

    return (
        <div className="border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow group">
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Cog className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-semibold text-slate-800 text-sm">{maquina.nome}</h5>
                            {maquina.tag && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{maquina.tag}</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${statusColor}`}>
                                {maquina.status_atual || 'DISPONÍVEL'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            {maquina.modelo && <span>{maquina.modelo}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{maquina.horas_uso_diario || 8}h/dia</span>
                        </p>
                        
                        {/* Seletor de Produto Ativo */}
                        <div className="mt-2 flex items-center gap-2 no-print">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Produto Ativo:</span>
                            <select 
                                className="text-[10px] bg-blue-50 text-blue-700 font-bold py-0.5 px-1 rounded border-none outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
                                value={maquina.produto_atual_id || ''}
                                onChange={(e) => onUpdateMaquina(maquina.id, { produto_atual_id: e.target.value ? parseInt(e.target.value) : null })}
                            >
                                <option value="">NÃO DEFINIDO</option>
                                {produtos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                        onClick={() => onImprimirEtiqueta(maquina)}
                        className="p-1.5 hover:bg-amber-50 rounded text-slate-400 hover:text-amber-600 transition-colors"
                        title="Imprimir Etiqueta QR"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onNovoEquipamento(maquina.id)}
                        className="text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                        title="Adicionar equipamento"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEditarMaquina(maquina)}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded transition-colors"
                        title="Editar máquina"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <BotaoExcluir onConfirmar={() => onDeleteMaquina(maquina.id)} label="Remover máquina" />
                    <button
                        onClick={() => setExpandido(!expandido)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                    >
                        {expandido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
                <button
                    onClick={() => setExpandido(!expandido)}
                    className="text-xs text-slate-400 hover:text-slate-600 ml-2 flex items-center gap-1 shrink-0 opacity-100 group-hover:opacity-0 transition-opacity"
                >
                    <Wrench className="w-3 h-3" />
                    {equips.length} componente{equips.length !== 1 ? 's' : ''}
                    {expandido ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
            </div>

            {expandido && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-3 pl-14 space-y-1.5">
                    {equips.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Sem componentes cadastrados.</p>
                    ) : equips.map(eq => (
                        <div key={eq.id} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                                <span className="text-slate-700 font-medium">{eq.nome}</span>
                                {eq.tag && <span className="text-xs font-mono text-slate-400">{eq.tag}</span>}
                                {eq.maquina_id && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDesmontarEquipamento(eq.id); }}
                                        className="text-[10px] bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 px-1.5 py-0.5 rounded transition-colors"
                                        title="Levar para o estoque"
                                    >
                                        DESMONTAR
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 italic truncate max-w-[180px]">{eq.descricao || eq.fabricante || '—'}</span>
                                <button
                                    onClick={() => onEditarEquipamento(eq)}
                                    className="text-slate-300 hover:text-blue-500 p-1 rounded transition-colors"
                                    title="Editar componente"
                                >
                                    <Edit3 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => onNovoEquipamento(maquina.id)}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-semibold mt-1"
                    >
                        <Plus className="w-3 h-3" /> Adicionar componente
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Componente Nó da Árvore (recursivo) ─────────────────────────────────────

const NoArvore = ({
    no, nivel, maquinas, equipamentos, produtos, searchTerm,
    onAddFilho, onEditarNo, onDeleteNo, onNovaMaquina, onEditarMaquina, onNovoEquipamento, onEditarEquipamento, onDeleteMaquina,
    onDesmontarEquipamento, onImprimirEtiqueta, onUpdateMaquina
}) => {
    const [expandido, setExpandido] = useState(nivel < 2); // Abre automaticamente até nível 1

    const config = TIPO_CONFIG[no.tipo] || TIPO_CONFIG.SETOR;
    const IconeNo = config.icon;

    // Máquinas deste nó exato
    const maqsDoNo = maquinas.filter(m =>
        m.setor_id === no.id &&
        (searchTerm === '' || m.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Verifica se algum descendente tem máquinas correspondentes ao search
    const todosDescendantIds = getDescendantIds(no);
    const temConteudoFiltrado = searchTerm === '' ||
        maqsDoNo.length > 0 ||
        maquinas.some(m => todosDescendantIds.includes(m.setor_id) && m.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    if (searchTerm && !temConteudoFiltrado) return null;

    const totalMaquinas = maquinas.filter(m => todosDescendantIds.includes(m.setor_id)).length;

    const indentPl = nivel === 0 ? '' : nivel === 1 ? 'ml-4' : 'ml-8';

    return (
        <div className={indentPl}>
            {/* Cabeçalho do nó */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${config.bg} ${config.text} group cursor-pointer select-none`}
                onClick={() => setExpandido(!expandido)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {expandido ? <ChevronDown className="w-4 h-4 shrink-0 opacity-70" /> : <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />}
                    <IconeNo className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-sm truncate">{no.nome}</span>
                    {no.descricao && <span className="text-xs opacity-60 truncate hidden sm:block">{no.descricao}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${config.badge}`}>
                        {totalMaquinas} máq.
                    </span>
                </div>

                {/* Ações (aparecem no hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onAddFilho(no)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-semibold transition-colors
                            ${nivel === 0 ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}`}
                        title="Adicionar sub-setor"
                    >
                        <Plus className="w-3 h-3" /> Sub-setor
                    </button>
                    <button
                        onClick={() => onNovaMaquina(no.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded font-semibold transition-colors
                            ${nivel === 0 ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}`}
                        title="Adicionar máquina"
                    >
                        <Cog className="w-3 h-3" /> Máquina
                    </button>
                    <button
                        onClick={() => onEditarNo(no)}
                        className={`p-1 rounded transition-colors ${nivel === 0 ? 'hover:bg-white/20 text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                        title="Editar"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <BotaoExcluir onConfirmar={() => onDeleteNo(no.id)} label={`Remover ${config.label}`} />
                </div>
            </div>

            {/* Filhos (sub-setores + máquinas) */}
            {expandido && (
                <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-200 ml-4">
                    {/* Sub-setores filhos (recursão) */}
                    {(no.filhos || []).map(filho => (
                        <NoArvore
                            key={filho.id}
                            no={filho}
                            nivel={nivel + 1}
                            maquinas={maquinas}
                            equipamentos={equipamentos}
                            produtos={produtos}
                            searchTerm={searchTerm}
                            onAddFilho={onAddFilho}
                            onEditarNo={onEditarNo}
                            onDeleteNo={onDeleteNo}
                            onNovaMaquina={onNovaMaquina}
                            onEditarMaquina={onEditarMaquina}
                            onNovoEquipamento={onNovoEquipamento}
                            onEditarEquipamento={onEditarEquipamento}
                            onDeleteMaquina={onDeleteMaquina}
                            onDesmontarEquipamento={onDesmontarEquipamento}
                            onImprimirEtiqueta={onImprimirEtiqueta}
                            onUpdateMaquina={onUpdateMaquina}
                        />
                    ))}

                    {/* Máquinas deste nó */}
                    {maqsDoNo.map(maq => (
                        <CardMaquina
                            key={maq.id}
                            maquina={maq}
                            equipamentos={equipamentos}
                            produtos={produtos}
                            onNovoEquipamento={onNovoEquipamento}
                            onEditarMaquina={onEditarMaquina}
                            onEditarEquipamento={onEditarEquipamento}
                            onDeleteMaquina={onDeleteMaquina}
                            onDesmontarEquipamento={onDesmontarEquipamento}
                            onImprimirEtiqueta={onImprimirEtiqueta}
                            onUpdateMaquina={onUpdateMaquina}
                        />
                    ))}

                    {/* Placeholder quando vazio */}
                    {(no.filhos || []).length === 0 && maqsDoNo.length === 0 && (
                        <div className="text-xs text-slate-400 italic py-2 pl-2">
                            Vazio — use os botões acima para adicionar sub-setores ou máquinas.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Página Principal ─────────────────────────────────────────────────────────

const Ativos = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const context = useIndustria();
    const {
        setores = [], maquinas = [], equipamentos = [], loading,
        addSetor, updateSetor, deleteSetor,
        addMaquina, updateMaquina, deleteMaquina,
        addEquipamento, updateEquipamento, desmontarEquipamento,
    } = context || {};
    const { produtos = [], updateMaquina: updateMaquinaProd } = useProducao();

    const [searchTerm, setSearchTerm] = useState('');

    // ── Estado dos modais ──
    const [modalSetor, setModalSetor]     = useState(null); // { modo: 'novo'|'editar', pai?, setorEdit? }
    const [modalMaquina, setModalMaquina] = useState(null); // { modo: 'novo'|'editar', setorIdInicial?, maquinaEdit? }
    const [modalEquip, setModalEquip]     = useState(null); // { modo: 'novo'|'editar', maquinaId?, equipEdit? }
    const [modalEtiqueta, setModalEtiqueta] = useState(null);

    // Auto-open modal se vier da Manutenção
    useEffect(() => {
        if (location.state?.maquina_id && maquinas.length > 0 && !modalEquip) {
            const maq = maquinas.find(m => m.id === location.state.maquina_id);
            if (maq) {
                setSearchTerm(maq.nome);
                setModalEquip({ modo: 'novo', maquinaId: maq.id });
                // Limpar state de maquina_id para não reabrir em re-renders,
                // mas manter reabrirOS para poder voltar
                navigate('/ativos', { replace: true, state: { reabrirOS: location.state.reabrirOS } });
            }
        }
    }, [location.state?.maquina_id, maquinas.length, navigate]);

    // Monta a árvore de setores (obrigatoriamente ANTES dos early returns)
    const arvore = useMemo(() => buildTree(setores), [setores]);

    if (!context) return <div className="p-8 text-red-500">Erro: Contexto de Indústria não disponível.</div>;
    if (loading)  return <div className="p-8 text-center text-slate-500 animate-pulse">Carregando ativos industriais...</div>;

    // ── Handlers Setores ──
    const handleSalvarSetor = async (form) => {
        if (modalSetor.modo === 'editar') {
            const { error } = await updateSetor(modalSetor.setorEdit.id, form);
            if (error) alert('Erro ao editar: ' + error.message);
        } else {
            const { error } = await addSetor({ ...form, pai_id: modalSetor.pai?.id || null });
            if (error) alert('Erro ao criar: ' + error.message);
        }
        setModalSetor(null);
    };

    const handleDeleteSetor = async (id) => {
        const { error } = await deleteSetor(id);
        if (error) alert('Erro ao remover: ' + error.message);
    };

    // ── Handlers Máquinas ──
    const handleSalvarMaquina = async (form) => {
        if (modalMaquina.modo === 'editar') {
            const { error } = await updateMaquina(modalMaquina.maquinaEdit.id, form);
            if (error) alert('Erro ao editar máquina: ' + error.message);
        } else {
            const { error } = await addMaquina(form);
            if (error) alert('Erro ao cadastrar máquina: ' + error.message);
        }
        setModalMaquina(null);
    };

    const handleDeleteMaquina = async (id) => {
        const { error } = await deleteMaquina(id);
        if (error) alert('Erro ao remover máquina: ' + error.message);
    };

    // ── Handlers Equipamentos ──
    const handleSalvarEquipamento = async (form) => {
        if (modalEquip.modo === 'editar') {
            const { error } = await updateEquipamento(modalEquip.equipEdit.id, form);
            if (error) alert('Erro ao editar equipamento: ' + error.message);
        } else {
            const { error } = await addEquipamento(form);
            if (error) alert('Erro ao cadastrar equipamento: ' + error.message);
        }
        setModalEquip(null);

        // Voltar para manutenção caso tenha vindo de lá
        if (location.state?.reabrirOS) {
            navigate('/manutencao', { state: { reabrirOS: location.state.reabrirOS } });
        }
    };

    const handleDesmontar = async (id) => {
        if (!confirm('Deseja realmente desmontar este componente e enviá-lo para o estoque?')) return;
        const { error } = await desmontarEquipamento(id);
        if (error) alert('Erro ao desmontar: ' + error.message);
    };

    const equipsNoEstoque = equipamentos.filter(e => !e.maquina_id);

    return (
        <div className="space-y-6">
            {location.state?.reabrirOS && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex justify-between items-center text-sm shadow-sm top-0 sticky z-10">
                    <span className="text-blue-800 font-bold flex items-center gap-2">
                        <Wrench size={16} /> Assistente de O.S. #{location.state.reabrirOS} ativo (Você pode fechar a OS após adicionar as peças)
                    </span>
                    <button 
                        onClick={() => navigate('/manutencao', { state: { reabrirOS: location.state.reabrirOS } })}
                        className="bg-white px-3 py-1.5 rounded-lg shadow-sm text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                    >
                        Voltar à OS e Concluir
                    </button>
                </div>
            )}
            {/* Header */}
            <header className="flex flex-wrap justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Factory className="w-6 h-6 text-amber-600" /> Ativos Industriais
                    </h1>
                    <p className="text-slate-500 text-sm">Hierarquia: Galpão → Setor → Sub-setor → Máquina → Equipamento</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar máquina ou componente..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setModalMaquina({ modo: 'novo' })}
                        className="btn-primary flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                        <Cog className="w-4 h-4" /> Nova Máquina
                    </button>
                    <button
                        onClick={() => setModalSetor({ modo: 'novo', pai: null })}
                        className="btn-primary flex items-center gap-2 bg-slate-700 hover:bg-slate-800"
                    >
                        <Plus className="w-4 h-4" /> Novo Galpão / Setor
                    </button>
                </div>
            </header>

            {/* Árvore de Ativos */}
            <div className="space-y-3">
                {arvore.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-slate-500">Nenhum galpão ou setor cadastrado ainda.</p>
                        <p className="text-sm mt-1">Clique em <strong>"+ Novo Galpão / Setor"</strong> para começar.</p>
                    </div>
                ) : (
                    arvore.map(no => (
                        <NoArvore
                            key={no.id}
                            no={no}
                            nivel={0}
                            maquinas={maquinas}
                            equipamentos={equipamentos}
                            produtos={produtos}
                            searchTerm={searchTerm}
                            onAddFilho={(pai) => setModalSetor({ modo: 'novo', pai })}
                            onEditarNo={(no) => setModalSetor({ modo: 'editar', setorEdit: no })}
                            onDeleteNo={handleDeleteSetor}
                            onNovaMaquina={(setorId) => setModalMaquina({ modo: 'novo', setorIdInicial: setorId })}
                            onEditarMaquina={(maq) => setModalMaquina({ modo: 'editar', maquinaEdit: maq })}
                            onNovoEquipamento={(maquinaId) => setModalEquip({ modo: 'novo', maquinaId })}
                            onEditarEquipamento={(eq) => setModalEquip({ modo: 'editar', equipEdit: eq })}
                            onDeleteMaquina={handleDeleteMaquina}
                            onDesmontarEquipamento={handleDesmontar}
                            onImprimirEtiqueta={(maq) => setModalEtiqueta(maq)}
                            onUpdateMaquina={updateMaquinaProd || updateMaquina}
                        />
                    ))
                )}

                {/* Seção Estoque */}
                {equipsNoEstoque.length > 0 && (
                    <div className="mt-8 border-t-2 border-slate-100 pt-6">
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 text-slate-600 rounded-lg mb-4">
                            <Layers className="w-5 h-5 opacity-70" />
                            <h4 className="font-bold text-sm uppercase tracking-wider">📦 Componentes em Estoque (Disponíveis)</h4>
                            <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto">
                                {equipsNoEstoque.length} ITENS
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
                            {equipsNoEstoque.map(eq => (
                                <div key={eq.id} className="bg-white border border-slate-200 p-3 rounded-lg hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h6 className="font-bold text-slate-700 text-sm">{eq.nome}</h6>
                                            {eq.tag && <span className="text-[10px] font-mono text-slate-400">{eq.tag}</span>}
                                            <p className="text-[11px] text-slate-400 italic mt-1">{eq.descricao || eq.fabricante || 'Sem descrição'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setModalEquip({ modo: 'editar', equipEdit: eq })}
                                                className="btn-secondary text-[10px] py-1 px-2 !bg-blue-50 text-blue-600 border-blue-100 hover:!bg-blue-600 hover:text-white"
                                            >
                                                MONTAR / EDITAR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modais */}
            {modalSetor && (
                <ModalSetor
                    modo={modalSetor.modo}
                    pai={modalSetor.pai}
                    setorEdit={modalSetor.setorEdit}
                    onSalvar={handleSalvarSetor}
                    onFechar={() => setModalSetor(null)}
                />
            )}

            {modalMaquina && (
                <ModalMaquina
                    modo={modalMaquina.modo}
                    maquinaEdit={modalMaquina.maquinaEdit}
                    setorIdInicial={modalMaquina.setorIdInicial}
                    setores={setores}
                    onSalvar={handleSalvarMaquina}
                    onFechar={() => setModalMaquina(null)}
                />
            )}

            {modalEquip && (
                <ModalEquipamento
                    modo={modalEquip.modo}
                    equipEdit={modalEquip.equipEdit}
                    maquinaId={modalEquip.maquinaId}
                    maquinas={maquinas}
                    onSalvar={handleSalvarEquipamento}
                    onFechar={() => setModalEquip(null)}
                />
            )}

            {modalEtiqueta && (
                <ModalEtiqueta
                    maquina={modalEtiqueta}
                    onFechar={() => setModalEtiqueta(null)}
                />
            )}
        </div>
    );
};

export default Ativos;
