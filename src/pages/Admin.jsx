import React, { useState } from 'react';
import { useProducao } from '../contexts/ProducaoContext';
import { Users, Settings, Package, Plus, Trash2, ShieldCheck, Factory, Layers, Lock, Key, UserCheck } from 'lucide-react';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('operadores');
    // Atualiza o destructuring para pegar os metadados
    const {
        operadores, maqs, produtos,
        addOperador, addMaquina, addProduto,
        removeOperador, removeMaquina, removeProduto
    } = useProducao();

    // Estados locais para formulários
    const [newOp, setNewOp] = useState({
        nome: '',
        funcao: '',
        produtividadeBase: '',
        tipoComissao: 'INDIVIDUAL', // Default
        alvoComissao: '',
        perfil: 'OPERADOR',
        login: '',
        senha: ''
    });
    const [newMaq, setNewMaq] = useState({ nome: '', setor: '' });
    const [newProd, setNewProd] = useState({ nome: '', tipo: '' });

    const handleAddOperador = async (e) => {
        e.preventDefault();
        if (newOp.nome && newOp.funcao) {
            const { error } = await addOperador({
                ...newOp,
                produtividadeBase: parseFloat(newOp.produtividadeBase) || 0
            });

            if (error) alert('Erro ao adicionar: ' + error.message);
            else {
                alert('Funcionário adicionado com sucesso!');
                setNewOp({
                    nome: '', funcao: '', produtividadeBase: '',
                    tipoComissao: 'INDIVIDUAL', alvoComissao: '',
                    perfil: 'OPERADOR', login: '', senha: ''
                });
            }
        }
    };

    const handleAddMaquina = async (e) => {
        e.preventDefault();
        if (newMaq.nome && newMaq.setor) {
            const { error } = await addMaquina(newMaq);
            if (error) alert('Erro ao adicionar: ' + error.message);
            else {
                alert('Máquina adicionada com sucesso!');
                setNewMaq({ nome: '', setor: '' });
            }
        }
    };

    const handleAddProduto = async (e) => {
        e.preventDefault();
        if (newProd.nome && newProd.tipo) {
            const { error } = await addProduto(newProd);
            if (error) alert('Erro ao adicionar: ' + error.message);
            else {
                alert('Produto adicionado com sucesso!');
                setNewProd({ nome: '', tipo: '' });
            }
        }
    };

    const tabs = [
        { id: 'operadores', label: 'Equipe & Acessos', icon: Users },
        { id: 'maquinas', label: 'Máquinas', icon: Settings },
        { id: 'produtos', label: 'Produtos', icon: Package },
    ];

    // Helper para exibir regra na tabela
    const getRegraLabel = (op) => {
        switch (op.tipo_comissao) {
            case 'MAQUINA':
                const m = maqs.find(mq => mq.id.toString() === op.alvo_comissao);
                return `Prod. da Máquina: ${m ? m.nome : 'N/D'}`;
            case 'SETOR': return `Prod. do Setor: ${op.alvo_comissao}`;
            case 'GERAL': return 'Produção GERAL (Tudo)';
            default: return 'Produção Individual';
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Administração</h1>
                <p className="text-slate-500">Gerenciamento de cadastros, acessos e configurações.</p>
            </header>

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="card min-h-[400px]">

                {/* ABA EQUIPE (Antigo Operadores) */}
                {activeTab === 'operadores' && (
                    <div className="space-y-8">

                        {/* Formulário de Cadastro Rico */}
                        <form onSubmit={handleAddOperador} className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2 mb-4">
                                <Plus className="w-5 h-5 text-blue-600" /> Novo Funcionário
                            </h3>

                            {/* Dados Básicos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="EX: JOÃO DA SILVA"
                                        value={newOp.nome}
                                        onChange={e => setNewOp({ ...newOp, nome: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Função / Cargo</label>
                                    <input
                                        type="text"
                                        list="funcoes-sugestao"
                                        className="input-field"
                                        placeholder="EX: OPERADOR M1, SUPERVISOR..."
                                        value={newOp.funcao}
                                        onChange={e => setNewOp({ ...newOp, funcao: e.target.value.toUpperCase() })}
                                        required
                                    />
                                    <datalist id="funcoes-sugestao">
                                        <option value="OPERADOR DE MÁQUINA" />
                                        <option value="OPERADOR DE MOAGEM" />
                                        <option value="SUPERVISOR DE PRODUÇÃO" />
                                        <option value="AUXILIAR" />
                                        <option value="MECÂNICO" />
                                        <option value="ELETRICISTA" />
                                    </datalist>
                                </div>
                            </div>

                            {/* Acesso ao Sistema */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 mt-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-amber-500" /> Acesso ao Sistema (Login)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Perfil de Acesso</label>
                                        <select
                                            className="input-field"
                                            value={newOp.perfil}
                                            onChange={e => setNewOp({ ...newOp, perfil: e.target.value })}
                                        >
                                            <option value="OPERADOR">OPERADOR (App Produção)</option>
                                            <option value="TECNICO">TÉCNICO (App Manutenção)</option>
                                            <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                                            <option value="GESTOR">GESTOR (Visualização)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Login (Usuário)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="joao.silva"
                                            value={newOp.login}
                                            onChange={e => setNewOp({ ...newOp, login: e.target.value.toLowerCase() })} // Login sempre minúsculo
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Senha (4 dígitos min)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="1234"
                                            value={newOp.senha}
                                            onChange={e => setNewOp({ ...newOp, senha: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Regras de Comissão */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 mt-4">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Regra de Produtividade (Comissão)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

                                    {/* 1. Onde ele ganha? */}
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Fonte da Produtividade</label>
                                        <select
                                            className="input-field"
                                            value={newOp.tipoComissao}
                                            onChange={e => setNewOp({ ...newOp, tipoComissao: e.target.value, alvoComissao: '' })}
                                        >
                                            <option value="INDIVIDUAL">Individual (O que ele apontar)</option>
                                            <option value="MAQUINA">Produção de uma Máquina</option>
                                            <option value="SETOR">Produção de um Setor</option>
                                            <option value="GERAL">Produção GERAL (Tudo)</option>
                                        </select>
                                    </div>

                                    {/* 2. Selecionar Alvo (Condicional) */}
                                    {newOp.tipoComissao === 'MAQUINA' && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Qual Máquina?</label>
                                            <select
                                                className="input-field bg-blue-50 border-blue-200"
                                                value={newOp.alvoComissao}
                                                onChange={e => setNewOp({ ...newOp, alvoComissao: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione...</option>
                                                {maqs.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {newOp.tipoComissao === 'SETOR' && (
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Qual Setor?</label>
                                            <select
                                                className="input-field bg-blue-50 border-blue-200"
                                                value={newOp.alvoComissao}
                                                onChange={e => setNewOp({ ...newOp, alvoComissao: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="Empacotamento">Empacotamento</option>
                                                <option value="Moagem">Moagem</option>
                                                <option value="Torrefação">Torrefação</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* 3. Porcentagem */}
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">% Comissão / Produtividade</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.1"
                                                className="input-field pr-8"
                                                placeholder="Ex: 10"
                                                value={newOp.produtividadeBase}
                                                onChange={e => setNewOp({ ...newOp, produtividadeBase: e.target.value })}
                                                required
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button type="submit" className="btn-primary px-8 py-2 flex items-center gap-2">
                                    <Plus className="w-5 h-5" /> Cadastrar Usuário/Funcionário
                                </button>
                            </div>
                        </form>

                        {/* Tabela */}
                        <div className="card overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Nome / Função</th>
                                        <th className="px-6 py-4">Acesso (Login/Perfil)</th>
                                        <th className="px-6 py-4">Regra Produtividade</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {operadores && operadores.map(op => (
                                        <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{op.nome}</div>
                                                <div className="text-xs text-slate-500 bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">{op.funcao}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {op.login ? (
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="w-4 h-4 text-emerald-500" />
                                                        <div>
                                                            <div className="font-bold text-slate-700 text-xs uppercase">{op.perfil || 'OPERADOR'}</div>
                                                            <div className="text-xs text-slate-400">{op.login}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sem acesso</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {/* Badge da Regra */}
                                                <div className="flex items-center gap-2">
                                                    {op.tipo_comissao === 'GERAL' && <Layers className="w-4 h-4 text-purple-500" />}
                                                    {op.tipo_comissao === 'MAQUINA' && <Factory className="w-4 h-4 text-blue-500" />}
                                                    {op.tipo_comissao === 'SETOR' && <Package className="w-4 h-4 text-orange-500" />}
                                                    {op.tipo_comissao === 'INDIVIDUAL' && <Users className="w-4 h-4 text-slate-400" />}
                                                    <span>{getRegraLabel(op)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => window.confirm('Desativar funcionário?') && removeOperador(op.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                                    title="Excluir/Desativar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ABA MÁQUINAS (Igual) */}
                {activeTab === 'maquinas' && (
                    <div className="space-y-6">
                        <form onSubmit={handleAddMaquina} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Máquina</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="EX: EMPACOTADORA M3"
                                    value={newMaq.nome}
                                    onChange={e => setNewMaq({ ...newMaq, nome: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                                <select
                                    className="input-field"
                                    value={newMaq.setor}
                                    onChange={e => setNewMaq({ ...newMaq, setor: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Empacotamento">Empacotamento</option>
                                    <option value="Moagem">Moagem</option>
                                    <option value="Torrefação">Torrefação</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary h-10 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Adicionar
                            </button>
                        </form>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-sm uppercase">
                                    <th className="py-3">Nome da Máquina</th>
                                    <th className="py-3">Setor</th>
                                    <th className="py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {maqs && maqs.map(maq => (
                                    <tr key={maq.id} className="hover:bg-slate-50">
                                        <td className="py-3 font-medium text-slate-800">{maq.nome}</td>
                                        <td className="py-3 text-slate-600">
                                            <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                {maq.setor}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => window.confirm('Excluir máquina permanentemente?') && removeMaquina(maq.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 ml-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ABA PRODUTOS (Igual) */}
                {activeTab === 'produtos' && (
                    <div className="space-y-6">
                        <form onSubmit={handleAddProduto} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="EX: CAFÉ TRADICIONAL"
                                    value={newProd.nome}
                                    onChange={e => setNewProd({ ...newProd, nome: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Embalagem</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="EX: FARDO 10X500G"
                                    value={newProd.tipo}
                                    onChange={e => setNewProd({ ...newProd, tipo: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <button type="submit" className="btn-primary h-10 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Adicionar
                            </button>
                        </form>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-sm uppercase">
                                    <th className="py-3">Produto</th>
                                    <th className="py-3">Embalagem</th>
                                    <th className="py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {produtos && produtos.map(prod => (
                                    <tr key={prod.id} className="hover:bg-slate-50">
                                        <td className="py-3 font-medium text-slate-800">{prod.nome}</td>
                                        <td className="py-3 text-slate-600">{prod.tipo}</td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => window.confirm('Excluir produto permanentemente?') && removeProduto(prod.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 ml-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    );
};
export default Admin;
