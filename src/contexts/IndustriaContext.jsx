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
    const [loading, setLoading] = useState(false);

    const fetchArvore = async () => {
        setLoading(true);
        try {
            // Queries SEPARADAS - evita erro de FK join 400
            const [resSetores, resMaquinas, resEquip] = await Promise.all([
                supabase.from('setores').select('*').order('nome'),
                supabase.from('maquinas').select('*').order('nome'),
                supabase.from('equipamentos').select('*').order('nome'),
            ]);

            if (resSetores.error) console.error('Erro setores:', resSetores.error.message);
            if (resMaquinas.error) console.error('Erro maquinas:', resMaquinas.error.message);
            if (resEquip.error) console.warn('Equipamentos (pode nao existir ainda):', resEquip.error.message);

            setSetores(resSetores.data || []);
            setMaquinas(resMaquinas.data || []);
            setEquipamentos(resEquip.data || []);

        } catch (err) {
            console.error('Erro fetchArvore:', err);
        } finally {
            setLoading(false);
        }
    };

    // Só busca quando o usuário estiver autenticado (evita 401/400 sem auth)
    useEffect(() => {
        if (user) {
            fetchArvore();
        } else {
            setSetores([]);
            setMaquinas([]);
            setEquipamentos([]);
            setLoading(false);
        }
    }, [user]);

    const updateHorimetro = async (maquinaId, novoHoras) => {
        const { error } = await supabase
            .from('maquinas')
            .update({ horimetro_atual: novoHoras })
            .eq('id', maquinaId);
        if (!error) fetchArvore();
        return { error };
    };

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

    const addSetor = async (nome) => {
        const { data, error } = await supabase
            .from('setores')
            .insert([{ nome }])
            .select()
            .single();

        if (!error && data) {
            setSetores(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        }
        return { data, error };
    };

    const addMaquina = async (dados) => {
        const { data, error } = await supabase
            .from('maquinas')
            .insert([dados])
            .select()
            .single();

        if (!error) {
            fetchArvore();
        }
        return { data, error };
    };

    return (
        <IndustriaContext.Provider value={{
            setores, maquinas, equipamentos, loading,
            fetchArvore, updateHorimetro, criarOSIndustria,
            addSetor, addMaquina
        }}>
            {children}
        </IndustriaContext.Provider>
    );
};
