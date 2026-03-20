import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../contexts/ConfiguracoesContext';
import { Save, Image as ImageIcon, Building2, UploadCloud } from 'lucide-react';

const Configuracoes = () => {
    const { config, salvarConfig, loadingConfig } = useConfig();
    const [formData, setFormData] = useState({
        nome_empresa: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        url_sistema: '',
        logo_base64: ''
    });
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (config) {
            setFormData({
                nome_empresa: config.nome_empresa || '',
                cnpj: config.cnpj || '',
                endereco: config.endereco || '',
                telefone: config.telefone || '',
                email: config.email || '',
                url_sistema: config.url_sistema || '',
                logo_base64: config.logo_base64 || ''
            });
        }
    }, [config]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logo_base64: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const { error } = await salvarConfig(formData);
        setSaving(false);
        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            alert("Configurações salvas com sucesso!");
        }
    };

    if (loadingConfig) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Carregando configurações...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Configurações do Sistema
                    </h1>
                    <p className="text-sm text-slate-500">Personalize os dados da sua empresa (White-Label)</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md font-bold transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* DADOS DA EMPRESA */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                        🏭 Dados da Empresa
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-2">
                            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 block">URL Oficial do Sistema (Vercel)</label>
                            <input 
                                type="url" 
                                className="input-field bg-white border-blue-200 focus:ring-blue-500 font-mono text-sm" 
                                value={formData.url_sistema} 
                                onChange={e => setFormData({...formData, url_sistema: e.target.value.toLowerCase()})} 
                                placeholder="https://seu-projeto.vercel.app" 
                            />
                            <p className="text-[10px] text-blue-400 mt-1 italic">Esta URL será usada para a geração de QR Codes em etiquetas.</p>
                        </div>
                        <div>
                            <label className="label">Nome da Empresa</label>
                            <input type="text" className="input-field" value={formData.nome_empresa} onChange={e => setFormData({...formData, nome_empresa: e.target.value})} placeholder="Ex: Indústria XYZ Ltda" />
                        </div>
                        <div>
                            <label className="label">CNPJ</label>
                            <input type="text" className="input-field" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Endereço Completo</label>
                            <input type="text" className="input-field" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} placeholder="Rua Fulano de Tal, 123..." />
                        </div>
                        <div>
                            <label className="label">Telefone / WhatsApp</label>
                            <input type="text" className="input-field" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(11) 99999-9999" />
                        </div>
                        <div>
                            <label className="label">E-mail de Contato</label>
                            <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contato@empresa.com.br" />
                        </div>
                    </div>
                </div>

                {/* IDENTIDADE VISUAL */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                        🖼️ Identidade Visual e Imagens
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl text-center bg-slate-50 flex flex-col items-center justify-center min-h-[220px] transition-colors hover:border-blue-300">
                            {formData.logo_base64 ? (
                                <img src={formData.logo_base64} alt="Logo Preview" className="max-h-24 object-contain mb-4" />
                            ) : (
                                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <h3 className="font-bold text-slate-700 text-sm">Logo da Empresa</h3>
                            <p className="text-[10px] text-slate-400 mb-4 h-6">Recomendado: PNG fundo transparente.</p>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current.click()}
                                className="text-xs font-bold bg-white border border-slate-300 px-4 py-2 rounded shadow-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                            >
                                <UploadCloud size={14} /> Atualizar Logo
                            </button>
                        </div>
                        
                        <div className="col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-sm text-center p-6 shadow-inner">
                            <p>As configurações desta tela alimentarão os cabeçalhos de impressões das Ordens de Serviço (Manutenção) e demais relatórios do Dash de Operações.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Configuracoes;
