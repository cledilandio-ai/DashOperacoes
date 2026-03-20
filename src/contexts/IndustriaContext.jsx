import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const IndustriaContext = createContext();

export const useIndustria = () => useContext(IndustriaContext);

export const IndustriaProvider = ({ children }) => {
    const { user } = useAuth();

    const [setores, setSetores] = useState([]);
    const [maquinas, setMaquinas] = useState([]);
    const [equipamentos, setEquipamentos] = useState([]);
    const [pecas, setPecas] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchArvore = async () => {
        setLoading(true);
        try {
            const [resSetores, resMaquinas, resEquip, resPecas] = await Promise.all([
                supabase.from('setores').select('*').order('nome'),
                supabase.from('maquinas').select('*').order('nome'),
                supabase.from('equipamentos').select('*').order('nome'),
                supabase.from('pecas').select('*').order('nome'),
            ]);

            if (resSetores.error) console.error('Erro setores:', resSetores.error.message);
            if (resMaquinas.error) console.error('Erro maquinas:', resMaquinas.error.message);
            if (resEquip.error) console.warn('Equipamentos:', resEquip.error.message);
            if (resPecas.error) console.warn('Peças:', resPecas.error.message);

            setSetores(resSetores.data || []);
            setMaquinas(resMaquinas.data || []);
            setEquipamentos(resEquip.data || []);
            setPecas(resPecas.data || []);

        } catch (err) {
            console.error('Erro fetchArvore:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchArvore();
        } else {
            setSetores([]);
            setMaquinas([]);
            setEquipamentos([]);
            setPecas([]);
            setLoading(false);
        }
    }, [user]);

    // ── SETORES ─────────────────────────────────────────────────

    /** Converte texto para maiúsculo de forma segura */
    const toUpper = (str) => (str && typeof str === 'string') ? str.toUpperCase().trim() : str;

    /** Aplica toUpper em campos de texto de um objeto */
    const upperFields = (obj, campos) => {
        const result = { ...obj };
        campos.forEach(c => { if (result[c] !== undefined) result[c] = toUpper(result[c]); });
        return result;
    };

    /** Adiciona um nó na árvore (Galpão, Setor ou Sub-setor) */
    const addSetor = async ({ nome, tipo = 'SETOR', pai_id = null, descricao = '' }) => {
        const payload = upperFields({ nome, tipo, pai_id: pai_id || null, descricao }, ['nome', 'descricao']);
        const { data, error } = await supabase
            .from('setores')
            .insert([payload])
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    /** Edita nome, tipo ou descrição de um setor existente */
    const updateSetor = async (id, dados) => {
        const payload = upperFields(dados, ['nome', 'descricao']);
        const { data, error } = await supabase
            .from('setores')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (!error && data) {
            setSetores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
        }
        return { data, error };
    };

    /** Remove um setor (ON DELETE CASCADE remove os filhos no banco) */
    const deleteSetor = async (id) => {
        const { error } = await supabase.from('setores').delete().eq('id', id);
        if (!error) {
            // Remove o nó e todos os seus filhos da memória de uma vez
            await fetchArvore();
        }
        return { error };
    };

    // ── MÁQUINAS ─────────────────────────────────────────────────

    const addMaquina = async (dados) => {
        const payload = upperFields(dados, ['nome', 'modelo', 'tag', 'fabricante', 'descricao']);
        const { data, error } = await supabase
            .from('maquinas')
            .insert([payload])
            .select()
            .single();

        if (!error) fetchArvore();
        return { data, error };
    };

    const updateMaquina = async (id, dados) => {
        const payload = upperFields(dados, ['nome', 'modelo', 'tag', 'fabricante', 'descricao']);
        const { data, error } = await supabase
            .from('maquinas')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    const deleteMaquina = async (id) => {
        const { error } = await supabase.from('maquinas').delete().eq('id', id);
        if (!error) setMaquinas(prev => prev.filter(m => m.id !== id));
        return { error };
    };

    const updateHorimetro = async (maquinaId, novoHoras) => {
        const { error } = await supabase
            .from('maquinas')
            .update({ horimetro_atual: novoHoras })
            .eq('id', maquinaId);
        if (!error) fetchArvore();
        return { error };
    };

    // ── EQUIPAMENTOS ─────────────────────────────────────────────

    const addEquipamento = async (dados) => {
        const payload = upperFields(dados, ['nome', 'descricao', 'tag', 'fabricante', 'modelo']);
        const { data, error } = await supabase
            .from('equipamentos')
            .insert([payload])
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    const updateEquipamento = async (id, dados) => {
        const payload = upperFields(dados, ['nome', 'descricao', 'tag', 'fabricante', 'modelo']);
        const { data, error } = await supabase
            .from('equipamentos')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    const deleteEquipamento = async (id) => {
        const { error } = await supabase.from('equipamentos').delete().eq('id', id);
        if (!error) await fetchArvore();
        return { error };
    };

    /** Atalho para desmontar (levar para estoque) */
    const desmontarEquipamento = async (id) => {
        return updateEquipamento(id, { maquina_id: null });
    };

    /** Atalho para montar em uma máquina */
    const montarEquipamento = async (id, maquinaId) => {
        return updateEquipamento(id, { maquina_id: maquinaId });
    };

    // ── PEÇAS ────────────────────────────────────────────────────

    const addPeca = async (dados) => {
        const payload = upperFields(dados, ['nome', 'referencia', 'fabricante', 'descricao']);
        const { data, error } = await supabase
            .from('pecas')
            .insert([payload])
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    const updatePeca = async (id, dados) => {
        const payload = upperFields(dados, ['nome', 'referencia', 'fabricante', 'descricao']);
        const { data, error } = await supabase
            .from('pecas')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (!error && data) {
            await fetchArvore();
        }
        return { data, error };
    };

    const addPecas = async (lista) => {
        const payloads = lista.map(p => upperFields(p, ['nome', 'referencia', 'fabricante', 'descricao']));
        const { data, error } = await supabase
            .from('pecas')
            .insert(payloads)
            .select();

        if (!error) {
            await fetchArvore();
        }
        return { data, error };
    };

    const deletePeca = async (id) => {
        const { error } = await supabase.from('pecas').delete().eq('id', id);
        if (!error) await fetchArvore();
        return { error };
    };

    // ── OS ───────────────────────────────────────────────────────

    const criarOSIndustria = async (dados) => {
        const payload = {
            ...dados,
            status: 'PENDENTE',
            data_abertura: new Date(),
            origem: 'INDUSTRIA'
        };
        const { error } = await supabase.from('manutencoes').insert([payload]);
        return { error };
    };

    return (
        <IndustriaContext.Provider value={{
            setores, maquinas, equipamentos, loading,
            fetchArvore,
            // Setores
            addSetor, updateSetor, deleteSetor,
            // Máquinas
            addMaquina, updateMaquina, deleteMaquina, updateHorimetro,
            // Equipamentos
            addEquipamento, updateEquipamento, deleteEquipamento,
            desmontarEquipamento, montarEquipamento,
            // Peças
            pecas, addPeca, addPecas, updatePeca, deletePeca,
            // OS
            criarOSIndustria,
        }}>
            {children}
        </IndustriaContext.Provider>
    );
};
