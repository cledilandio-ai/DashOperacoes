import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const ConfiguracoesContext = createContext();

export const useConfig = () => useContext(ConfiguracoesContext);

export const ConfiguracoesProvider = ({ children }) => {
    const { user } = useAuth();
    const [config, setConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(false);

    const fetchConfig = async () => {
        setLoadingConfig(true);
        try {
            const { data, error } = await supabase
                .from('configuracoes_empresa')
                .select('*')
                .eq('id', 1)
                .single();

            if (!error && data) {
                setConfig(data);
            } else if (error && error.code !== 'PGRST116') {
                console.error('Erro fetchConfig:', error.message);
            }
        } catch (err) {
            console.error('Erro exceção fetchConfig:', err);
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => {
        if (user) fetchConfig();
    }, [user]);

    const salvarConfig = async (novosDados) => {
        const payload = { id: 1, ...novosDados, updated_at: new Date().toISOString() };
        const { data, error } = await supabase
            .from('configuracoes_empresa')
            .upsert(payload, { onConflict: 'id' })
            .select()
            .single();

        if (!error && data) setConfig(data);
        return { data, error };
    };

    return (
        <ConfiguracoesContext.Provider value={{ config, loadingConfig, salvarConfig, fetchConfig }}>
            {children}
        </ConfiguracoesContext.Provider>
    );
};
