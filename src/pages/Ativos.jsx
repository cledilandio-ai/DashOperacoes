import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Factory, Layers, FolderOpen, Cog, Wrench, Search,
    ChevronDown, ChevronRight, Plus, Edit3, Trash2, X,
    Clock, AlertTriangle, CheckCircle, Printer, Layers as LayersIcon,
    Package
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useIndustria } from '../contexts/IndustriaContext';
import { useProducao } from '../contexts/ProducaoContext';
import { useConfig } from '../contexts/ConfiguracoesContext';
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

const ModalEquipamento = ({ modo, equipEdit, maquinaId, maquinas, equipamentos = [], pecas = [], onSalvar, onFechar }) => {
    const isEdicaoInicial = modo === 'editar';
    const [form, setForm] = useState({
        id: isEdicaoInicial ? equipEdit.id : null,
        nome: isEdicaoInicial ? equipEdit.nome : '',
        maquina_id: isEdicaoInicial ? equipEdit.maquina_id : (maquinaId || ''),
        descricao: isEdicaoInicial ? (equipEdit.descricao || '') : '',
        tag: isEdicaoInicial ? (equipEdit.tag || '') : '',
        fabricante: isEdicaoInicial ? (equipEdit.fabricante || '') : '',
        modelo: isEdicaoInicial ? (equipEdit.modelo || '') : '',
    });
    
    const [salvando, setSalvando] = useState(false);
    const [novasPecas, setNovasPecas] = useState([]);
    const [pecaTemp, setPecaTemp] = useState({ nome: '', quantidade: 1, referencia: '' });
    
    const up = (e) => (typeof e === 'string' ? e : e.target.value).toUpperCase();

    // Verificar se a TAG já existe no sistema inteiro (maquinas + equipamentos)
    const tagDuplicada = form.tag && form.tag.trim() && (() => {
        const tagAtual = form.tag.trim().toUpperCase();
        const tagEmMaquina = maquinas.some(m => m.tag && m.tag.toUpperCase() === tagAtual);
        const tagEmEquip = equipamentos.some(eq => 
            eq.id !== form.id && // Permite manter a própria tag ao editar
            eq.tag && eq.tag.toUpperCase() === tagAtual
        );
        return tagEmMaquina || tagEmEquip;
    })();

    // Filtra equipamentos da mesma máquina para o Autocomplete
    const equipsDaMaquina = equipamentos.filter(eq => eq.maquina_id == form.maquina_id);
    
    // Filtra as peças que já existem vinculadas a este equipamento no BD
    const pecasExistentes = form.id ? pecas.filter(p => p.equipamento_id == form.id) : [];

    const handleSelectEquip = (val) => {
        // Se 'val' for um número/id (item existente)
        const eqExistenteById = equipsDaMaquina.find(eq => eq.id == val);
        
        if (eqExistenteById) {
            setForm({
                ...form,
                id: eqExistenteById.id,
                nome: eqExistenteById.nome,
                descricao: eqExistenteById.descricao || '',
                tag: eqExistenteById.tag || '',
                fabricante: eqExistenteById.fabricante || '',
                modelo: eqExistenteById.modelo || ''
            });
            return;
        }

        // Se 'val' for uma string (item novo)
        const eqExistenteByNome = equipsDaMaquina.find(eq => eq.nome === val);
        if (eqExistenteByNome) {
             setForm({
                ...form,
                id: eqExistenteByNome.id,
                nome: eqExistenteByNome.nome,
                descricao: eqExistenteByNome.descricao || '',
                tag: eqExistenteByNome.tag || '',
                fabricante: eqExistenteByNome.fabricante || '',
                modelo: eqExistenteByNome.modelo || ''
            });
        } else {
            setForm({ ...form, nome: val, id: isEdicaoInicial ? equipEdit.id : null });
        }
    };

    const handleAddPecaTemp = () => {
        if (!pecaTemp.nome.trim()) return;
        setNovasPecas([...novasPecas, { ...pecaTemp, idTemp: Date.now() }]);
        setPecaTemp({ nome: '', quantidade: 1, referencia: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nome.trim()) return;
        if (tagDuplicada) {
            alert(`Já existe um ativo com a TAG "${form.tag}" no sistema. Use uma TAG diferente.`);
            return;
        }
        setSalvando(true);
        await onSalvar(form, novasPecas);
        setSalvando(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Wrench className="w-5 h-5" />
                        {form.id ? 'Editar Equipamento (Auto-detectado)' : 'Novo Equipamento'}
                    </h3>
                    <button type="button" onClick={onFechar}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {(!maquinaId || isEdicaoInicial) && (
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
                        <SearchSelect 
                            options={equipsDaMaquina.map(eq => ({
                                value: eq.id,
                                label: eq.nome,
                                tag: eq.tag,
                                descricao: eq.descricao
                            }))}
                            value={form.id || form.nome}
                            onChange={handleSelectEquip}
                            placeholder="🔍 Buscar ou digitar novo componente..."
                            required={true}
                            emptyMessage="Nenhum componente similar encontrado. Use a opção de 'USAR NOVO'."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Ao selecionar um componente existente, ele entrará em modo de edição.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="label">TAG</label>
                        <input 
                            type="text" 
                            className={`input-field ${tagDuplicada ? 'border-red-400 bg-red-50 focus:ring-red-300' : ''}`}
                            placeholder="EQ-001" 
                            value={form.tag} 
                            onChange={e => setForm({ ...form, tag: up(e) })} 
                        />
                        {tagDuplicada && (
                            <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                                ⚠️ TAG <strong>{form.tag}</strong> já existe no sistema. Escolha outra.
                            </p>
                        )}
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

                    {/* ── SEÇÃO DE PEÇAS NO ATO DO CADASTRO ── */}
                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-emerald-600" />
                            Adicionar Peças neste Componente (Opcional)
                        </label>

                        {/* Lista de peças já cadastradas no BD (somente leitura rápida aqui) */}
                        {pecasExistentes.length > 0 && (
                            <div className="mb-3 space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Peças já vinculadas:</p>
                                {pecasExistentes.map(p => (
                                    <div key={p.id} className="text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded text-slate-600 flex justify-between">
                                        <span>⚙️ {p.nome}</span>
                                        <span className="font-bold">{p.quantidade}x</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Lista de peças na fila para salvar junto */}
                        {novasPecas.length > 0 && (
                            <div className="mb-3 space-y-1">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Peças na fila de cadastro:</p>
                                {novasPecas.map(p => (
                                    <div key={p.idTemp} className="text-xs bg-emerald-50 border border-emerald-100 px-2 py-1 rounded text-emerald-800 flex justify-between items-center">
                                        <span><Package className="w-3 h-3 inline mr-1"/> {p.nome} ({p.referencia || 'S/ Ref'})</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{p.quantidade}x</span>
                                            <button type="button" onClick={() => setNovasPecas(novasPecas.filter(n => n.idTemp !== p.idTemp))} className="text-red-400 hover:text-red-600">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Formulário inline para nova peça */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500">Nome / Especificação da Peça</label>
                                <input type="text" className="input-field py-1 text-xs" value={pecaTemp.nome} onChange={e => setPecaTemp({...pecaTemp, nome: up(e)})} placeholder="Ex: Rolamento..." />
                            </div>
                            <div className="w-24">
                                <label className="text-[10px] font-bold text-slate-500">Qtd.</label>
                                <input type="number" min="1" className="input-field py-1 text-xs" value={pecaTemp.quantidade} onChange={e => setPecaTemp({...pecaTemp, quantidade: parseInt(e.target.value)||1})} />
                            </div>
                            <button type="button" onClick={handleAddPecaTemp} disabled={!pecaTemp.nome.trim()} className="btn-secondary py-1 px-3 text-xs bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50">
                                + Incluir
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={salvando} className="btn-primary bg-blue-600 hover:bg-blue-700">
                        {salvando ? 'Salvando...' : form.id ? 'Salvar Edição' : 'Cadastrar Equipamento'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Modal de Peça (Componente Filho) ───────────────────────────────────────

const ModalPeca = ({ modo, pecaEdit, maquinaId, equipamentoId, maquinas = [], equipamentos = [], onSalvar, onFechar }) => {
    const isEdicao = modo === 'editar';
    const [form, setForm] = useState({
        nome: isEdicao ? pecaEdit.nome : '',
        maquina_id: isEdicao ? pecaEdit.maquina_id : (maquinaId || null),
        equipamento_id: isEdicao ? pecaEdit.equipamento_id : (equipamentoId || null),
        referencia: isEdicao ? (pecaEdit.referencia || '') : '',
        fabricante: isEdicao ? (pecaEdit.fabricante || '') : '',
        quantidade: isEdicao ? (pecaEdit.quantidade || 1) : 1,
        descricao: isEdicao ? (pecaEdit.descricao || '') : '',
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-600 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {isEdicao ? 'Editar Peça' : 'Nova Peça'}
                    </h3>
                    <button type="button" onClick={onFechar}><X className="w-5 h-5 opacity-70 hover:opacity-100" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Nome da Peça *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Ex: ROLAMENTO 6204..."
                            value={form.nome}
                            onChange={e => setForm({ ...form, nome: up(e) })}
                            required
                            autoFocus
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Digite a especificação completa da peça.</p>
                    </div>
                    <div>
                        <label className="label">Vincular a Componente (Opcional)</label>
                        <SearchSelect 
                            options={equipamentos.filter(e => e.maquina_id == form.maquina_id).map(e => ({ value: e.id, label: e.nome, tag: e.tag }))}
                            value={form.equipamento_id}
                            onChange={val => setForm({ ...form, equipamento_id: val })}
                            placeholder="🛠️ Selecione o componente..."
                            emptyMessage="Nenhum componente nesta máquina."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Referência</label>
                            <input type="text" className="input-field" placeholder="Ex: 6204-ZZ" value={form.referencia} onChange={e => setForm({ ...form, referencia: up(e) })} />
                        </div>
                        <div>
                            <label className="label">Fabricante</label>
                            <input type="text" className="input-field" placeholder="Ex: SKF, Gates" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: up(e) })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Quantidade</label>
                            <input type="number" min="1" className="input-field" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: parseInt(e.target.value) || 1 })} required />
                        </div>
                    </div>
                    <div>
                        <label className="label">Descrição</label>
                        <input type="text" className="input-field" placeholder="Aplicação ou detalhes..." value={form.descricao} onChange={e => setForm({ ...form, descricao: up(e) })} />
                    </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onClick={onFechar} className="btn-secondary">Cancelar</button>
                    <button type="submit" disabled={salvando} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                        {salvando ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Cadastrar Peça'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Modal de Etiqueta (Impressão) ──────────────────────────────────────────

const ModalEtiqueta = ({ maquina, onFechar }) => {
    const { config } = useConfig();
    
    const handlePrint = () => {
        window.print();
    };

    // URL para a qual o QR Code vai apontar - Prioriza config do Admin
    const baseUrl = (config?.url_sistema || window.location.origin).replace(/\/$/, '').replace(/\/login$/, '');
    // Aponta primeiro para o login para garantir a tela de autenticação
    const qrUrl = `${baseUrl}/login?to=${encodeURIComponent(`/producao?solicitar_os=${maquina.id}`)}`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4" onClick={onFechar}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden no-print-bg" onClick={e => e.stopPropagation()}>
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
                        Dica: Use a URL configurada no Admin para garantir que o QR funcione em produção.
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
                    /* Força o documento a ter apenas a altura da página visível */
                    html, body {
                        height: 100vh !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Esconde todos os elementos por padrão */
                    body * {
                        visibility: hidden !important;
                    }

                    /* Mostra apenas a etiqueta selecionada e seus filhos */
                    #etiqueta-print, #etiqueta-print * {
                        visibility: visible !important;
                    }

                    /* Fixa a etiqueta no topo absoluto para ignorar o scroll do resto da página */
                    #etiqueta-print {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        justify-content: center !important;
                    #etiqueta-print * {
                        visibility: visible !important;
                    }

                    /* Estilização específica da etiqueta para impressão */
                    .bg-white.p-6 {
                        border: 1px solid #000 !important; /* Borda preta fina para corte */
                        box-shadow: none !important;
                        padding: 20mm !important;
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
    maquina, equipamentos, pecas = [], produtos = [], 
    onNovoEquipamento, onEditarMaquina, onDeleteMaquina, onEditarEquipamento, onDesmontarEquipamento,
    onImprimirEtiqueta, onUpdateMaquina, onNovaPeca, onEditarPeca, onDeletePeca
}) => {
    const [expandido, setExpandido] = useState(false);
    const equips = equipamentos.filter(e => e.maquina_id === maquina.id);
    const pecasMaquina = pecas.filter(p => p.maquina_id === maquina.id && !p.equipamento_id);

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
                    {equips.length} comp / {pecasMaquina.length} peças
                    {expandido ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
            </div>

            {expandido && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-3 pl-14 space-y-4">
                    
                    {/* ── EQUIPAMENTOS DA MÁQUINA ── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Wrench className="w-3 h-3" /> Componentes ({equips.length})
                            </span>
                            <button onClick={() => onNovoEquipamento(maquina.id)} className="text-blue-500 hover:text-blue-700 font-semibold text-xs flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Novo Componente
                            </button>
                        </div>
                        
                        {equips.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Sem componentes cadastrados.</p>
                        ) : equips.map(eq => {
                            const pecasEq = pecas.filter(p => p.equipamento_id === eq.id);
                            return (
                                <div key={eq.id} className="mb-2 bg-white border border-slate-200 rounded p-2 shadow-sm">
                                    <div className="flex items-center justify-between text-sm py-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                            <span className="text-slate-700 font-medium">{eq.nome}</span>
                                            {eq.tag && <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1 rounded">{eq.tag}</span>}
                                            {eq.maquina_id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDesmontarEquipamento(eq.id); }}
                                                    className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 px-1.5 py-0.5 rounded transition-colors"
                                                    title="Levar para o estoque"
                                                >
                                                    DESMONTAR
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 italic truncate max-w-[150px]">{eq.descricao || eq.fabricante || '—'}</span>
                                            <button
                                                onClick={() => onEditarEquipamento(eq)}
                                                className="text-slate-300 hover:text-blue-500 p-1 rounded transition-colors"
                                                title="Editar componente"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* PEÇAS DO EQUIPAMENTO */}
                                    <div className="mt-2 pl-3 border-l-2 border-emerald-100 space-y-1">
                                        {pecasEq.map(p => (
                                            <div key={p.id} className="flex items-center justify-between text-xs bg-emerald-50/30 hover:bg-emerald-50 transition-colors px-2 py-1 rounded group/peca">
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-slate-600 font-medium">{p.nome}</span>
                                                    <span className="text-slate-400">({p.quantidade}x)</span>
                                                    {p.referencia && <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-100 px-1 rounded">{p.referencia}</span>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/peca:opacity-100 transition-opacity">
                                                    <button onClick={() => onEditarPeca(p)} className="text-slate-300 hover:text-emerald-600 p-0.5"><Edit3 className="w-3 h-3" /></button>
                                                    <BotaoExcluir onConfirmar={() => onDeletePeca(p.id)} label="Remover Peça" />
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => onNovaPeca(maquina.id, eq.id)}
                                            className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-700 mt-1.5"
                                        >
                                            <Plus className="w-3 h-3" /> Adicionar Peça a {eq.nome}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── PEÇAS AVULSAS DA MÁQUINA ── */}
                    <div className="pt-2 border-t border-slate-200 border-dashed">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Package className="w-3 h-3" /> Peças Avulsas da Máquina ({pecasMaquina.length})
                            </span>
                            <button onClick={() => onNovaPeca(maquina.id, null)} className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Nova Peça
                            </button>
                        </div>
                        
                        {pecasMaquina.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">Nenhuma peça avulsa cadastrada.</p>
                        ) : (
                            <div className="space-y-1">
                                {pecasMaquina.map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-xs bg-white border border-slate-200 shadow-sm hover:shadow transition-shadow px-2 py-1.5 rounded group/peca flex-wrap gap-1">
                                        <div className="flex items-center gap-2 max-w-[70%]">
                                            <div className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                                <Package className="w-3 h-3" />
                                            </div>
                                            <span className="text-slate-700 font-medium truncate">{p.nome}</span>
                                            <span className="text-slate-500 font-semibold bg-slate-100 px-1.5 rounded">{p.quantidade}x</span>
                                            {p.referencia && <span className="text-[10px] font-mono text-slate-500">{p.referencia}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {p.fabricante && <span className="text-[10px] text-slate-400 hidden sm:inline">{p.fabricante}</span>}
                                            <div className="flex items-center gap-1 opacity-0 group-hover/peca:opacity-100 transition-opacity">
                                                <button onClick={() => onEditarPeca(p)} className="text-slate-400 hover:text-emerald-600 p-1"><Edit3 className="w-3.5 h-3.5" /></button>
                                                <BotaoExcluir onConfirmar={() => onDeletePeca(p.id)} label="Remover Peça" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Componente Nó da Árvore (recursivo) ─────────────────────────────────────

const NoArvore = ({
    no, nivel, maquinas, equipamentos, pecas, produtos, searchTerm,
    onAddFilho, onEditarNo, onDeleteNo, onNovaMaquina, onEditarMaquina, onNovoEquipamento, onEditarEquipamento, onDeleteMaquina,
    onDesmontarEquipamento, onImprimirEtiqueta, onUpdateMaquina,
    onNovaPeca, onEditarPeca, onDeletePeca
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
                            pecas={pecas}
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
                            onNovaPeca={onNovaPeca}
                            onEditarPeca={onEditarPeca}
                            onDeletePeca={onDeletePeca}
                        />
                    ))}

                    {/* Máquinas deste nó */}
                    {maqsDoNo.map(maq => (
                        <CardMaquina
                            key={maq.id}
                            maquina={maq}
                            equipamentos={equipamentos}
                            pecas={pecas}
                            produtos={produtos}
                            onNovoEquipamento={onNovoEquipamento}
                            onEditarMaquina={onEditarMaquina}
                            onEditarEquipamento={onEditarEquipamento}
                            onDeleteMaquina={onDeleteMaquina}
                            onDesmontarEquipamento={onDesmontarEquipamento}
                            onImprimirEtiqueta={onImprimirEtiqueta}
                            onUpdateMaquina={onUpdateMaquina}
                            onNovaPeca={onNovaPeca}
                            onEditarPeca={onEditarPeca}
                            onDeletePeca={onDeletePeca}
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
        setores = [], maquinas = [], equipamentos = [], pecas = [], loading,
        addSetor, updateSetor, deleteSetor,
        addMaquina, updateMaquina, deleteMaquina,
        addEquipamento, updateEquipamento, desmontarEquipamento,
        addPeca, addPecas, updatePeca, deletePeca
    } = context || {};
    const { produtos = [], updateMaquina: updateMaquinaProd } = useProducao();

    const [searchTerm, setSearchTerm] = useState('');

    // ── Estado dos modais ──
    const [modalSetor, setModalSetor]     = useState(null); // { modo: 'novo'|'editar', pai?, setorEdit? }
    const [modalMaquina, setModalMaquina] = useState(null); // { modo: 'novo'|'editar', setorIdInicial?, maquinaEdit? }
    const [modalEquip, setModalEquip]     = useState(null); // { modo: 'novo'|'editar', maquinaId?, equipEdit? }
    const [modalPeca, setModalPeca]       = useState(null); // { modo: 'novo'|'editar', maquinaId?, equipamentoId?, pecaEdit? }
    const [modalEtiqueta, setModalEtiqueta] = useState(null);

    // Auto-open modal se vier da Manutenção
    useEffect(() => {
        if (location.state?.maquina_id && maquinas.length > 0) {
            const maq = maquinas.find(m => m.id === location.state.maquina_id);
            if (!maq) return;

            // Preservar todos os campos do formulário ao limpar o state
            const estadoPreservado = {
                reabrirOS: location.state.reabrirOS,
                anotacoes: location.state.anotacoes,
                justificativa: location.state.justificativa,
                corrigirSLA: location.state.corrigirSLA
            };

            if (location.state.tipo === 'PECA' && !modalPeca) {
                setSearchTerm(maq.nome);
                setModalPeca({ modo: 'novo', maquinaId: maq.id });
                navigate('/ativos', { replace: true, state: estadoPreservado });
            } else if ((!location.state.tipo || location.state.tipo === 'EQUIP') && !modalEquip) {
                setSearchTerm(maq.nome);
                setModalEquip({ modo: 'novo', maquinaId: maq.id });
                navigate('/ativos', { replace: true, state: estadoPreservado });
            }
        }
    }, [location.state?.maquina_id, location.state?.tipo, maquinas.length, navigate]);

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
    const handleSalvarEquipamento = async (form, novasPecas = []) => {
        let eqId = null;

        if (form.id || modalEquip.modo === 'editar') {
            const idToUpdate = form.id || modalEquip.equipEdit.id;
            const { error } = await updateEquipamento(idToUpdate, form);
            if (error) alert('Erro ao editar equipamento: ' + error.message);
            else eqId = idToUpdate;
        } else {
            // Remove o campo 'id' para não enviar id:null ao Supabase (coluna IDENTITY gerada automaticamente)
            const { id: _idDescartado, ...dadosSemId } = form;
            const { data, error } = await addEquipamento(dadosSemId);
            if (error) alert('Erro ao cadastrar equipamento: ' + error.message);
            else if (data) eqId = data.id;
        }

        // Salva as peças vinculadas criadas no ato do cadastro de equipamento
        if (eqId && novasPecas.length > 0) {
            const pecasParaSalvar = novasPecas.map(p => ({
                nome: p.nome,
                quantidade: p.quantidade,
                referencia: p.referencia || '',
                equipamento_id: parseInt(eqId),
                maquina_id: form.maquina_id ? parseInt(form.maquina_id) : null
            }));
            
            const { error: errorBulk } = await addPecas(pecasParaSalvar);
            if (errorBulk) {
                console.error("Erro ao salvar peças:", errorBulk);
                alert('Erro ao salvar algumas peças: ' + errorBulk.message);
            }
        }

        setModalEquip(null);

        // Voltar para manutenção caso tenha vindo de lá
        if (location.state?.reabrirOS) {
            navigate('/manutencao', { 
                state: { 
                    reabrirOS: location.state.reabrirOS,
                    anotacoes: location.state.anotacoes || '',
                    justificativa: location.state.justificativa || '',
                    corrigirSLA: location.state.corrigirSLA ?? false
                } 
            });
        }
    };

    const handleDesmontar = async (id) => {
        if (!confirm('Deseja realmente desmontar este componente e enviá-lo para o estoque?')) return;
        const { error } = await desmontarEquipamento(id);
        if (error) alert('Erro ao desmontar: ' + error.message);
    };

    // ── Handlers Peças ──
    const handleSalvarPeca = async (form) => {
        const payload = {
            ...form,
            maquina_id: form.maquina_id ? parseInt(form.maquina_id) : null,
            equipamento_id: form.equipamento_id ? parseInt(form.equipamento_id) : null,
            quantidade: parseInt(form.quantidade) || 1
        };

        if (modalPeca.modo === 'editar') {
            const { error } = await updatePeca(modalPeca.pecaEdit.id, payload);
            if (error) alert('Erro ao editar peça: ' + error.message);
        } else {
            const { error } = await addPeca(payload);
            if (error) alert('Erro ao cadastrar peça: ' + error.message);
        }
        setModalPeca(null);

        if (location.state?.reabrirOS) {
            navigate('/manutencao', { 
                state: { 
                    reabrirOS: location.state.reabrirOS,
                    anotacoes: location.state.anotacoes || '',
                    justificativa: location.state.justificativa || '',
                    corrigirSLA: location.state.corrigirSLA ?? false
                } 
            });
        }
    };

    const handleDeletePeca = async (id) => {
        const { error } = await deletePeca(id);
        if (error) alert('Erro ao remover peça: ' + error.message);
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
                        onClick={() => navigate('/manutencao', { 
                            state: { 
                                reabrirOS: location.state.reabrirOS,
                                anotacoes: location.state.anotacoes || '',
                                justificativa: location.state.justificativa || '',
                                corrigirSLA: location.state.corrigirSLA ?? false
                            } 
                        })}
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
                            pecas={pecas}
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
                            onNovaPeca={(maqId, eqId) => setModalPeca({ modo: 'novo', maquinaId: maqId, equipamentoId: eqId })}
                            onEditarPeca={(peca) => setModalPeca({ modo: 'editar', pecaEdit: peca })}
                            onDeletePeca={handleDeletePeca}
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
                    equipamentos={equipamentos}
                    pecas={pecas}
                    onSalvar={handleSalvarEquipamento}
                    onFechar={() => setModalEquip(null)}
                />
            )}

            {modalPeca && (
                <ModalPeca
                    modo={modalPeca.modo}
                    pecaEdit={modalPeca.pecaEdit}
                    maquinaId={modalPeca.maquinaId}
                    maquinas={maquinas}
                    equipamentoId={modalPeca.equipamentoId}
                    equipamentos={equipamentos}
                    onSalvar={handleSalvarPeca}
                    onFechar={() => setModalPeca(null)}
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
