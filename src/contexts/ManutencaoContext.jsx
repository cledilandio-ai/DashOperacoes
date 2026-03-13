import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const ManutencaoContext = createContext();

export const useManutencao = () => useContext(ManutencaoContext);

export const ManutencaoProvider = ({ children }) => {
    const { user } = useAuth();
    const [manutencoes, setManutencoes] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Query simplificada - só busca o que precisa e usa join seguro
            const { data, error } = await supabase
                .from('manutencoes')
                .select(`
                    *,
                    maquinas(nome)
                `)
                .order('data_abertura', { ascending: false });

            if (error) {
                console.error('Erro ao buscar manutencoes:', error.message);
                // Se a tabela nao existir, só loga e continua
            } else {
                setManutencoes(data || []);
            }
        } catch (err) {
            console.error('Erro fetchDados Manutencao:', err);
        } finally {
            setLoading(false);
        }
    };

    // Só busca quando autenticado
    useEffect(() => {
        if (user) {
            fetchDados();
        }
    }, [user]);

    const abrirOS = async (dadosOS) => {
        const { error } = await supabase.from('manutencoes').insert([dadosOS]);
        if (!error) fetchDados();
        return { error };
    };

    const atualizarStatusOS = async (id, status, updatesExtras = {}) => {
        const { error } = await supabase.from('manutencoes').update({ status, ...updatesExtras }).eq('id', id);
        if (!error) fetchDados();
        return { error };
    };

    return (
        <ManutencaoContext.Provider value={{
            manutencoes, loading,
            abrirOS, atualizarStatusOS, fetchDados
        }}>
            {children}
        </ManutencaoContext.Provider>
    );
};
