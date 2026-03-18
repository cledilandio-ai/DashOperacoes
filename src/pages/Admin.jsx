import React, { useState, useEffect } from 'react';
import { useProducao } from '../contexts/ProducaoContext';
import { 
    Users, Settings, Package, Plus, Trash2, 
    ShieldCheck, Factory, Layers, Lock, 
    UserCheck, Edit3, X, Save, AlertCircle,
    Clock, Calendar, ArrowRight, Timer, Divide, Calculator, Wrench, CheckCircle
} from 'lucide-react';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('operadores'); // 'operadores' | 'produtos' | 'turnos'
    const {
        operadores, maqs, produtos, turnos,
        addOperador, updateOperador, addProduto, updateProduto, removeProduto,
        addTurno, updateTurno, removeTurno
    } = useProducao();

    // Estados para o Modal de Funcionário
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para o Modal de Turno
    const [isTurnoModalOpen, setIsTurnoModalOpen] = useState(false);
    const [editingTurnoId, setEditingTurnoId] = useState(null);
    const [turnoData, setTurnoData] = useState({
        nome: '', tipo: 'DIRETO',
        inicio_1: '07:00', fim_1: '11:00',
        inicio_2: '', fim_2: ''
    });

    const [formData, setFormData] = useState({
        nome: '', funcao: '', turno: '', produtividadeBase: '',
        tipoComissao: 'INDIVIDUAL', alvoComissao: '',
        perfil: 'APENAS REGISTRO', login: '', senha: ''
    });

    const [newProd, setNewProd] = useState({ nome: '', tipo: '', divisor: '100' });

    // Estados para Modal de Edição de Produto
    const [isProdModalOpen, setIsProdModalOpen] = useState(false);
    const [editingProd, setEditingProd] = useState(null);
    const [editProdData, setEditProdData] = useState({ nome: '', tipo: '', divisor: '100' });
    const [isSavingProd, setIsSavingProd] = useState(false);

    const openEditProdModal = (p) => {
        setEditingProd(p);
        setEditProdData({ nome: p.nome || '', tipo: p.tipo || '', divisor: String(p.divisor ?? 100) });
        setIsProdModalOpen(true);
    };

    const handleSaveProduto = async (e) => {
        if (e) e.preventDefault();
        setIsSavingProd(true);
        try {
            const { error } = await updateProduto(editingProd.id, editProdData);
            if (error) alert('Erro: ' + error.message);
            else setIsProdModalOpen(false);
        } finally { setIsSavingProd(false); }
    };

    // --- Lógica de Meta de Manutenção ---
    // A inteligência de Pesos Atribuídos (I.E.M.) substituirá as entradas estáticas
    // Não precisamos salvar estado de divisor unificado pois basearemos em pesos sistêmicos (Alta:3, Media:2, Baixa:1)


    // --- Lógica de Funcionário ---
    const openNewModal = () => {
        setEditingId(null);
        setFormData({
            nome: '', funcao: '', turno: turnos[0]?.id || '', produtividadeBase: '0',
            tipoComissao: 'INDIVIDUAL', alvoComissao: '',
            perfil: 'APENAS REGISTRO', login: '', senha: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (op) => {
        setEditingId(op.id);
        setFormData({
            nome: op.nome || '',
            funcao: op.funcao || '',
            turno: op.turno_id || op.turno || '', // Tenta ID primeiro para o dropdown
            produtividadeBase: op.produtividade_base || '0',
            tipoComissao: op.tipo_comissao || 'INDIVIDUAL',
            alvoComissao: op.alvo_comissao || '',
            perfil: op.perfil === 'OPERADOR' && !op.login ? 'APENAS REGISTRO' : (op.perfil || 'OPERADOR'),
            login: op.login || '',
            senha: op.senha || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveOperador = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                nome: formData.nome.trim().toUpperCase(),
                funcao: formData.funcao.trim().toUpperCase(),
                turno: isNaN(formData.turno) ? formData.turno : turnos.find(t => t.id.toString() === formData.turno.toString())?.nome || formData.turno,
                login: (formData.perfil === 'APENAS REGISTRO' || !formData.login) ? null : formData.login.trim().toLowerCase(),
                senha: (formData.perfil === 'APENAS REGISTRO' || !formData.senha) ? null : formData.senha.trim(),
                produtividadeBase: parseFloat(formData.produtividadeBase) || 0,
                perfil: formData.perfil === 'APENAS REGISTRO' ? 'OPERADOR' : formData.perfil 
            };
            let res = editingId ? await updateOperador(editingId, payload) : await addOperador(payload);
            if (res.error) alert(`Erro: ${res.error.message}`);
            else {
                setIsModalOpen(false);
                setEditingId(null);
            }
        } finally { setIsSaving(false); }
    };

    // --- Lógica de Turno ---
    const calculateJornada = (data) => {
        const toMinutes = (time) => {
            if (!time) return 0;
            const [h, m] = time.split(':').map(Number);
            return (h * 60) + m;
        };

        let diff1 = toMinutes(data.fim_1) - toMinutes(data.inicio_1);
        if (diff1 < 0) diff1 += 1440; // Handler para virada de dia

        let diff2 = 0;
        if (data.tipo === 'COMPOSTO' && data.inicio_2 && data.fim_2) {
            diff2 = toMinutes(data.fim_2) - toMinutes(data.inicio_2);
            if (diff2 < 0) diff2 += 1440;
        }

        const totalMinutes = diff1 + diff2;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const openNewTurnoModal = () => {
        setEditingTurnoId(null);
        setTurnoData({ nome: '', tipo: 'DIRETO', inicio_1: '07:00', fim_1: '11:00', inicio_2: '', fim_2: '' });
        setIsTurnoModalOpen(true);
    };

    const openEditTurnoModal = (t) => {
        setEditingTurnoId(t.id);
        setTurnoData({ ...t });
        setIsTurnoModalOpen(true);
    };

    const handleSaveTurno = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const jornada = calculateJornada(turnoData);
            const payload = { 
                ...turnoData, 
                nome: turnoData.nome.toUpperCase(),
                inicio_2: (turnoData.tipo === 'COMPOSTO' && turnoData.inicio_2) ? turnoData.inicio_2 : null,
                fim_2: (turnoData.tipo === 'COMPOSTO' && turnoData.fim_2) ? turnoData.fim_2 : null,
                carga_horaria_total: jornada 
            };
            
            let res = editingTurnoId ? await updateTurno(editingTurnoId, payload) : await addTurno(payload);
            if (res.error) alert(`Erro: ${res.error.message}`);
            else setIsTurnoModalOpen(false);
        } finally { setIsSaving(false); }
    };

    const handleAddProduto = async (e) => {
        e.preventDefault();
        if (newProd.nome && newProd.tipo) {
            const { error } = await addProduto(newProd);
            if (error) alert('Erro: ' + error.message);
            else setNewProd({ nome: '', tipo: '', divisor: '100' });
        }
    };

    const tabs = [
        { id: 'operadores', label: 'Equipe & Acessos', icon: Users },
        { id: 'turnos', label: 'Gestão de Turnos', icon: Clock },
        { id: 'produtos', label: 'Regras & Produtividade', icon: Package },
    ];

    const getRegraLabel = (op) => {
        switch (op.tipo_comissao) {
            case 'MAQUINA':
                const m = maqs.find(mq => mq.id.toString() === op.alvo_comissao);
                return `Prod. da Máquina: ${m ? m.nome : 'N/D'}`;
            case 'SETOR': return `Prod. do Setor: ${op.alvo_comissao}`;
            case 'GERAL': return 'Produção GERAL (Tudo)';
            case 'MANUTENCAO': return 'Eficiência de O.S.';
            default: return 'Produção Individual';
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Administração</h1>
                    <p className="text-slate-500 text-sm">Gerenciamento de cadastros e configurações operacionais.</p>
                </div>
                {activeTab === 'operadores' && (
                    <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Novo Funcionário
                    </button>
                )}
                {activeTab === 'turnos' && (
                    <button onClick={openNewTurnoModal} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Criar Novo Turno
                    </button>
                )}
            </header>

            {/* Abas */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="card min-h-[400px]">
                
                {activeTab === 'operadores' && (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Funcionário</th>
                                    <th className="px-6 py-4">Turno</th>
                                    <th className="px-6 py-4">Acesso / Perfil</th>
                                    <th className="px-6 py-4">Regra Produtividade</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {operadores && operadores.map(op => (
                                    <tr key={op.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{op.nome}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{op.funcao}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                {op.turno || 'N/D'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {op.login ? (
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="w-4 h-4 text-emerald-500" />
                                                    <div className="text-[10px] font-bold text-slate-700 uppercase">{op.perfil}</div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">Apenas Registro</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                            {getRegraLabel(op)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(op)} className="text-slate-400 hover:text-blue-600 p-2"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => window.confirm(`Remover ${op.nome}?`) && removeOperador(op.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'turnos' && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800">Sobre os Turnos</h4>
                                <p className="text-xs text-blue-600">Defina os horários de trabalho. Turnos compostos permitem configurar horários com intervalo (ex: Manhã e Tarde).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {turnos && turnos.map(t => (
                                <div key={t.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{t.nome}</h3>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.tipo === 'COMPOSTO' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {t.tipo}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditTurnoModal(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => window.confirm(`Excluir turno ${t.nome}?`) && removeTurno(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-slate-600">
                                            <Timer className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="font-bold">{t.inicio_1?.substring(0, 5)}</span>
                                            <ArrowRight className="w-3 h-3 text-slate-300" />
                                            <span className="font-bold">{t.fim_1?.substring(0, 5)}</span>
                                        </div>
                                        {t.tipo === 'COMPOSTO' && (
                                            <div className="flex items-center gap-3 text-xs text-slate-600 pl-6 border-l-2 border-slate-100 ml-1.5">
                                                <span className="font-bold">{t.inicio_2?.substring(0, 5)}</span>
                                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                                <span className="font-bold">{t.fim_2?.substring(0, 5)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'produtos' && (
                    <div className="space-y-6">
                        
                        {/* NOVO: Bloco de Regra de Manutenção baseado em IEM */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/40 rounded-full -translate-y-24 translate-x-16 blur-3xl"></div>
                            <div className="flex flex-col md:flex-row items-start gap-5 relative z-10">
                                <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl text-amber-600 shadow-sm border border-amber-200/50">
                                    <Wrench className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-amber-900 tracking-tight">Índice de Eficiência de Manutenção (I.E.M.)</h3>
                                    <p className="text-sm text-amber-800/80 mt-2 max-w-3xl leading-relaxed font-medium">
                                        Para engajar os técnicos e não puni-los por Ordens (O.S.) aguardando peças e demoradas, o módulo usa <strong>Pesos Baseados em Prioridade</strong>. O mecânico alcança sua meta fechando primeiro o que realmente para a fábrica.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                        <div className="bg-white/60 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-1.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-bl-lg">SLA DE 24H</div>
                                            <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1 mt-2 flex items-center gap-1"><AlertCircle size={12} className="shrink-0"/> O.S. ALTA PRIORIDADE</div>
                                            <div className="flex items-end gap-2">
                                                <div className="text-2xl font-black text-slate-800">3 Pts</div>
                                                <div className="text-[10px] text-red-500 font-bold mb-1 opacity-100">(Zera se atrasar)</div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-tight mt-2">Atropelou as 24h? O técnico perde os 3 pontos para aquele mês. Isso força resolução imediata!</p>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-bl-lg">SLA DE 48H</div>
                                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 mt-2">O.S. MÉDIA PRIORIDADE</div>
                                            <div className="flex items-end gap-2">
                                                <div className="text-2xl font-black text-slate-800">2 Pts</div>
                                                <div className="text-[10px] text-amber-600 font-bold mb-1 opacity-100">(Zera se atrasar)</div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-tight mt-2">Se enrolar mais de 48h para resolver uma falha técnica, a meta dele afunda.</p>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 shadow-sm relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-1.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-bl-lg">PRAZO LIVRE</div>
                                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 mt-2">O.S. BAIXA PRIORIDADE</div>
                                            <div className="flex items-end gap-2">
                                                <div className="text-2xl font-black text-slate-800">1 Pt</div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-tight mt-2">Sem punição pesada. Tarefas estéticas ou de baixa urgência que não travam o dia do mecânico.</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-amber-200 shadow-sm flex items-start gap-4">
                                        <Calculator className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                                        <div>
                                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-widest">A Regra Anti-Enrolação (Garantia de Velocidade)</h4>
                                            <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                                                <strong>A Mágica da Meta:</strong> A O.S. só gera pontuação para o cálculo mensal se for fechada <strong>dentro do Limite de Tempo Limite (SLA) estampado acima</strong>. O que significa que não basta apenas ele resolver "até o fim do mês". Ele é obrigado a entrar nela com sangue no olho na mesma hora em que abriu, senão o ponto perde validade, esfarelando a meta financeira dele.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 my-8 opacity-50">
                            <div className="h-px bg-slate-300 flex-1"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Linha de Produção da Fábrica</span>
                            <div className="h-px bg-slate-300 flex-1"></div>
                        </div>

                        {/* Info sobre a fórmula */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <Calculator className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800">Fórmula de Produtividade</h4>
                                <p className="text-xs text-blue-600">Cada produto tem um <strong>Divisor</strong> configurável. A base de cálculo é: <code className="bg-blue-100 px-1 rounded">Produção ÷ Divisor = Base → Base × % do funcionário = Valor</code></p>
                            </div>
                        </div>

                        <form onSubmit={handleAddProduto} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome do Produto</label>
                                <input type="text" className="input-field" value={newProd.nome} onChange={e => setNewProd({...newProd, nome: e.target.value.toUpperCase()})} required />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo / Embalagem</label>
                                <input type="text" className="input-field" value={newProd.tipo} onChange={e => setNewProd({...newProd, tipo: e.target.value.toUpperCase()})} required />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1"><Divide className="w-3 h-3" /> Divisor da Fórmula</label>
                                <input type="number" step="1" min="1" className="input-field" value={newProd.divisor} onChange={e => setNewProd({...newProd, divisor: e.target.value})} required />
                            </div>
                            <div className="flex items-end"><button type="submit" className="btn-primary w-full h-[45px]"><Plus className="w-5 h-5" /></button></div>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {produtos && produtos.filter(p => p.nome !== 'META_OS_MANUTENCAO').map(p => (
                                <div key={p.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all group relative">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800">{p.nome}</p>
                                            <p className="text-xs text-slate-400 font-medium">{p.tipo}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditProdModal(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => window.confirm(`Remover ${p.nome}?`) && removeProduto(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    {/* Exibição da fórmula */}
                                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fórmula</p>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Produção</span>
                                            <span className="text-slate-400">÷</span>
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{p.divisor ?? 100}</span>
                                            <span className="text-slate-400">=</span>
                                            <span className="text-slate-500">Base × %</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FUNCIONARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
                        </header>
                        <form onSubmit={handleSaveOperador} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="label-form">Nome Completo</label>
                                    <input type="text" className="input-field" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} required />
                                </div>
                                <div>
                                    <label className="label-form">Função / Cargo</label>
                                    <input type="text" className="input-field" value={formData.funcao || ''} onChange={e => setFormData({...formData, funcao: e.target.value.toUpperCase()})} required />
                                </div>
                                <div>
                                    <label className="label-form">Turno</label>
                                    <select className="input-field" value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value})}>
                                        <option value="">Selecione um turno...</option>
                                        {turnos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                        <option value="PERSONALIZADO">Outro / Digitar...</option>
                                    </select>
                                </div>
                            </div>
                            {/* ... Rest of Access and Rules sections (same as before) ... */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3" /> Acesso</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <select className="input-field text-sm" value={formData.perfil} onChange={e => setFormData({...formData, perfil: e.target.value})}>
                                        <option value="APENAS REGISTRO">APENAS REGISTRO</option>
                                        <option value="OPERADOR">OPERADOR</option>
                                        <option value="TECNICO">TÉCNICO</option>
                                        <option value="ADMIN">ADMINISTRADOR</option>
                                    </select>
                                    {formData.perfil !== 'APENAS REGISTRO' && (
                                        <>
                                            <input type="text" className="input-field text-sm" placeholder="Login" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value.toLowerCase()})} />
                                            <input type="text" className="input-field text-sm" placeholder="Senha" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Seção Regras de Produtividade */}
                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-4">
                                <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" /> Regras de Produtividade
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fonte da Produção</label>
                                        <select
                                            className="input-field text-sm"
                                            value={formData.tipoComissao}
                                            onChange={e => setFormData({...formData, tipoComissao: e.target.value, alvoComissao: ''})}
                                        >
                                            <option value="INDIVIDUAL">INDIVIDUAL (O que ele lançar)</option>
                                            <option value="MAQUINA">VINCULADO A UMA MÁQUINA</option>
                                            <option value="SETOR">VINCULADO A UM SETOR</option>
                                            <option value="GERAL">PRODUÇÃO GERAL DA FÁBRICA</option>
                                            <option value="MANUTENCAO">MANUTENÇÃO / RESOLUÇÃO DE O.S.</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                            {formData.tipoComissao === 'MANUTENCAO' ? 'Teto Máximo do Bônus em Dinheiro' : '% de Participação / Comissão'}
                                        </label>
                                        <div className="relative">
                                            {formData.tipoComissao === 'MANUTENCAO' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>}
                                            <input
                                                type="number" step="0.1" 
                                                className={`input-field ${formData.tipoComissao === 'MANUTENCAO' ? 'pl-9 text-emerald-700 font-bold bg-emerald-50 border-emerald-200' : 'pr-8'}`}
                                                value={formData.produtividadeBase} onChange={e => setFormData({...formData, produtividadeBase: e.target.value})}
                                            />
                                            {formData.tipoComissao !== 'MANUTENCAO' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>}
                                        </div>
                                    </div>

                                    {formData.tipoComissao === 'MAQUINA' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Selecione a Máquina</label>
                                            <select
                                                className="input-field text-sm border-blue-200"
                                                value={formData.alvoComissao} onChange={e => setFormData({...formData, alvoComissao: e.target.value})}
                                                required
                                            >
                                                <option value="">Escolher...</option>
                                                {maqs.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {formData.tipoComissao === 'SETOR' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Qual Setor?</label>
                                            <select
                                                className="input-field text-sm border-blue-200"
                                                value={formData.alvoComissao} onChange={e => setFormData({...formData, alvoComissao: e.target.value})}
                                                required
                                            >
                                                <option value="">Escolher...</option>
                                                <option value="Empacotamento">Empacotamento</option>
                                                <option value="Moagem">Moagem</option>
                                                <option value="Torrefação">Torrefação</option>
                                                <option value="Expedição">Expedição</option>
                                            </select>
                                        </div>
                                    )}
                                    
                                    {formData.tipoComissao === 'MANUTENCAO' && (
                                        <div className="md:col-span-2 p-3 bg-emerald-50/50 border border-emerald-100 rounded text-emerald-800 text-xs my-1 font-medium flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>
                                                Ao usar o modelo I.E.M de Manutenção, o valor numérico acima define o <strong>montante máximo em (R$)</strong> que este técnico pode faturar se curar todas as O.S. (100% de pontos atingidos). Se bater 80% dos pontos da linha de prioridades, recebe 80% deste Teto de Bônus.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                        <footer className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500">Cancelar</button>
                            <button type="submit" onClick={handleSaveOperador} className="btn-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Funcionário'}</button>
                        </footer>
                    </div>
                </div>
            )}

            {/* MODAL TURNO */}
            {isTurnoModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingTurnoId ? 'Editar Turno' : 'Novo Turno'}</h3>
                                <p className="text-xs text-slate-500">Configure os horários da jornada de trabalho.</p>
                            </div>
                            <button onClick={() => setIsTurnoModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </header>

                        <form onSubmit={handleSaveTurno} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="label-form">Nome do Turno</label>
                                    <input 
                                        type="text" className="input-field" placeholder="EX: TURNO 1"
                                        value={turnoData.nome} onChange={e => setTurnoData({...turnoData, nome: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        type="button" onClick={() => setTurnoData({...turnoData, tipo: 'DIRETO'})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${turnoData.tipo === 'DIRETO' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                                    >Turno Direto</button>
                                    <button 
                                        type="button" onClick={() => setTurnoData({...turnoData, tipo: 'COMPOSTO'})}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${turnoData.tipo === 'COMPOSTO' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}
                                    >Turno Composto (c/ Intervalo)</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <h4 className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">1º Período</h4>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Início</label>
                                        <input type="time" className="input-field" value={turnoData.inicio_1} onChange={e => setTurnoData({...turnoData, inicio_1: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Término</label>
                                        <input type="time" className="input-field" value={turnoData.fim_1} onChange={e => setTurnoData({...turnoData, fim_1: e.target.value})} required />
                                    </div>
                                </div>

                                {turnoData.tipo === 'COMPOSTO' && (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50/30 rounded-xl border border-purple-100 animate-in slide-in-from-top-2 duration-300">
                                        <h4 className="col-span-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest">2º Período (Após Intervalo)</h4>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Início</label>
                                            <input type="time" className="input-field" value={turnoData.inicio_2} onChange={e => setTurnoData({...turnoData, inicio_2: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Término</label>
                                            <input type="time" className="input-field" value={turnoData.fim_2} onChange={e => setTurnoData({...turnoData, fim_2: e.target.value})} required />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-emerald-600" />
                                        <span className="text-sm font-bold text-emerald-800">Jornada Total Calculada:</span>
                                    </div>
                                    <span className="text-xl font-black text-emerald-700">{calculateJornada(turnoData)}H</span>
                                </div>
                            </div>

                            <footer className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsTurnoModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500">Voltar</button>
                                <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'Gravando...' : 'Salvar Turno'}</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR PRODUTO */}
            {isProdModalOpen && editingProd && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Editar Produto</h3>
                                <p className="text-xs text-slate-500">Configure nome, embalagem e fórmula de produtividade.</p>
                            </div>
                            <button onClick={() => setIsProdModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </header>
                        <form onSubmit={handleSaveProduto} className="p-6 space-y-5">
                            <div>
                                <label className="label-form">Nome do Produto</label>
                                <input type="text" className="input-field" value={editProdData.nome} onChange={e => setEditProdData({...editProdData, nome: e.target.value.toUpperCase()})} required />
                            </div>
                            <div>
                                <label className="label-form">Tipo / Embalagem</label>
                                <input type="text" className="input-field" value={editProdData.tipo} onChange={e => setEditProdData({...editProdData, tipo: e.target.value.toUpperCase()})} required />
                            </div>
                            <div>
                                <label className="label-form flex items-center gap-1"><Divide className="w-3 h-3" /> Divisor da Fórmula de Produtividade</label>
                                <input type="number" step="1" min="1" className="input-field" value={editProdData.divisor} onChange={e => setEditProdData({...editProdData, divisor: e.target.value})} required />
                                <p className="text-xs text-slate-400 mt-1">Produção ÷ <strong>{editProdData.divisor || 100}</strong> = Base × % do funcionário = Valor da Produtividade</p>
                            </div>
                            {/* Prévia da fórmula */}
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Exemplo com 1.000 unidades de produção:</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                                    <span>1.000 ÷ {editProdData.divisor || 100} = <span className="text-emerald-600">{(1000 / (parseFloat(editProdData.divisor) || 100)).toFixed(3)}</span> (base)</span>
                                </div>
                                <p className="text-xs text-emerald-600 mt-1">Funcionário com 15% → R$ {((1000 / (parseFloat(editProdData.divisor) || 100)) * 0.15).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <footer className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsProdModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500">Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={isSavingProd}>{isSavingProd ? 'Salvando...' : 'Salvar Produto'}</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Admin;
