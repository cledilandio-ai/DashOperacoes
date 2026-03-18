import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const ManutencaoContext = createContext();

export const useManutencao = () => useContext(ManutencaoContext);

export const ManutencaoProvider = ({ children }) => {
    const { user } = useAuth();
    const [manutencoes, setManutencoes] = useState([]);
    const [planosPreventivos, setPlanosPreventivos] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Promise.all para buscar Manutenções do dia a dia e o Cronograma da Fábrica
            const [resManut, resPlanos] = await Promise.all([
                supabase.from('manutencoes').select('*, maquinas(nome, tag)').order('data_abertura', { ascending: false }),
                supabase.from('planos_preventivos').select('*, maquinas(nome, tag)').eq('ativo', true).order('proxima_execucao', { ascending: true })
            ]);

            if (resManut.data) setManutencoes(resManut.data);
            if (resPlanos.data) setPlanosPreventivos(resPlanos.data);
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
        const { data, error } = await supabase.from('manutencoes').insert([dadosOS]).select('*').single();
        if (!error) fetchDados();
        return { data, error };
    };

    const atualizarStatusOS = async (id, status, updatesExtras = {}) => {
        const { error } = await supabase.from('manutencoes').update({ status, ...updatesExtras }).eq('id', id);
        if (!error) fetchDados();
        return { error };
    };

    // === GERENCIAMENTO DOS PLANOS DE PREVENTIVA ===
    const addPlanoPreventivo = async (plano) => {
        let payload = {
            maquina_id: plano.maquina_id,
            tarefa: plano.tarefa,
            frequencia_dias: plano.frequencia_dias || 30,
        };
        
        // Define prazos baseados no relógio de hoje
        const diaSeguinte = new Date(plano.ultima_execucao || new Date());
        diaSeguinte.setDate(diaSeguinte.getDate() + (parseInt(plano.frequencia_dias) || 30));
        
        payload.ultima_execucao = plano.ultima_execucao ? new Date(plano.ultima_execucao).toISOString() : null;
        payload.proxima_execucao = diaSeguinte.toISOString();

        const { error } = await supabase.from('planos_preventivos').insert([payload]);
        if (!error) fetchDados();
        return { error };
    };

    const removePlanoPreventivo = async (id) => {
        const { error } = await supabase.from('planos_preventivos').update({ ativo: false }).eq('id', id);
        if (!error) fetchDados();
        return { error };
    };

    const dispararPreventiva = async (plano, liderId = null) => {
        // Transforma o Plano (Cronograma) em Ordem de Serviço Ativa
        const dadosOS = {
            maquina_id: plano.maquina_id,
            tipo: 'PREVENTIVA',
            descricao_problema: `💡 [PLANO DE PREVENTIVA]: ${plano.tarefa}\nO.S. engatilhada pelo cronograma automático (${plano.frequencia_dias} dias).`,
            prioridade: 'MEDIA', // Preventiva padrão sai como Média
            prazo_limite_horas: 168, // 7 dias pra não inviabilizar a produção, já que é preventiva
            tecnico_id: liderId || null,
            status: 'PENDENTE',
            data_abertura: new Date()
        };
        
        const { data, error: errOS } = await abrirOS(dadosOS);
        
        if (!errOS) {
            // Avança a data da próxima execução
            const hoje = new Date();
            const proxima = new Date();
            proxima.setDate(proxima.getDate() + plano.frequencia_dias);

            await supabase.from('planos_preventivos').update({
                ultima_execucao: hoje.toISOString(),
                proxima_execucao: proxima.toISOString()
            }).eq('id', plano.id);
            fetchDados(); // Sync
        }
        return { data, error: errOS };
    };

    return (
        <ManutencaoContext.Provider value={{
            manutencoes, planosPreventivos, loading,
            abrirOS, atualizarStatusOS, fetchDados,
            addPlanoPreventivo, removePlanoPreventivo, dispararPreventiva
        }}>
            {children}
        </ManutencaoContext.Provider>
    );
};
