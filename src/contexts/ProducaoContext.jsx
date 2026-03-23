import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const ProducaoContext = createContext();

export const useProducao = () => useContext(ProducaoContext);

export const ProducaoProvider = ({ children }) => {
    const { user } = useAuth();
    const [produtos, setProdutos] = useState([]);
    const [maquinas, setMaquinas] = useState([]);
    const [operadores, setOperadores] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);

    const [temMais, setTemMais] = useState(true);
    const PAGE_SIZE = 50;

    const channelRef = useRef(null);

    // Só conecta quando usuário está autenticado
    useEffect(() => {
        if (!user) return;

        fetchDados();

        // [DEBUG] TEMPORARILY DISABLED REALTIME TO FIX WHITE SCREEN ON NAVIGATION
        /*
        const ch = supabase
            .channel('producao_changes_' + user.id)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'producao_lancamentos' }, fetchDados)
            .subscribe();
        channelRef.current = ch;

        return () => {
            const toRemove = channelRef.current;
            channelRef.current = null;
            if (toRemove) {
                Promise.resolve().then(() => {
                    try { toRemove.unsubscribe(); } catch (e) { }
                });
            }
        };
        */
    }, [user]);

    async function fetchDados() {
        setLoading(true);
        try {
            // Busca paralela para ser mais rápido
            const [resOp, resMaq, resProd, resTurno, resLanc] = await Promise.all([
                supabase.from('operadores').select('*, maquina_preferencial_id, produto_preferencial_id, turno_preferencial_id').eq('ativo', true).order('nome'),
                supabase.from('maquinas').select('*').order('nome'),
                supabase.from('produtos').select('*').order('nome'),
                supabase.from('turnos').select('*').eq('ativo', true).order('nome'),
                supabase.from('producao_lancamentos')
                    .select('*, operadores(nome, funcao), maquinas(nome)')
                    .order('data_registro', { ascending: false })
                    .limit(PAGE_SIZE)
            ]);

            if (resOp.data) setOperadores(resOp.data);
            if (resMaq.data) setMaquinas(resMaq.data);
            if (resProd.data) setProdutos(resProd.data);
            if (resTurno.data) setTurnos(resTurno.data);

            // Formata os lançamentos para o padrão visual
            if (resLanc.data) {
                const formatted = resLanc.data.map(item => ({
                    id: item.id,
                    data: item.data_registro,
                    operadorNome: item.operadores?.nome || 'N/D',
                    operadorFuncao: item.operadores?.funcao || '-',
                    maquinaNome: item.maquinas?.nome || 'Manual',
                    quantidade: item.quantidade
                }));
                setLancamentos(formatted);
                setTemMais(resLanc.data.length === PAGE_SIZE);
            }

        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setLoading(false);
        }
    }

    const carregarMaisLancamentos = async () => {
        const ultimoRegistro = lancamentos[lancamentos.length - 1];
        if (!ultimoRegistro) return;

        const { data, error } = await supabase
            .from('producao_lancamentos')
            .select('*, operadores(nome, funcao), maquinas(nome)')
            .order('data_registro', { ascending: false })
            .lt('data_registro', ultimoRegistro.data) // Paginação por cursor (data) é mais segura que offset
            .limit(PAGE_SIZE);

        if (data) {
            const formatted = data.map(item => ({
                id: item.id,
                data: item.data_registro,
                operadorNome: item.operadores?.nome || 'N/D',
                operadorFuncao: item.operadores?.funcao || '-',
                maquinaNome: item.maquinas?.nome || 'Manual',
                quantidade: item.quantidade
            }));
            setLancamentos(prev => [...prev, ...formatted]);
            setTemMais(data.length === PAGE_SIZE);
        }
    };

    // --- Ações de Cadastro ---
    const addOperador = async (novoOperador) => {
        const { 
            nome, funcao, turno, produtividadeBase, tipoComissao, alvoComissao, login, senha, perfil,
            maquina_preferencial_id, produto_preferencial_id, turno_preferencial_id 
        } = novoOperador;
        console.log("Supabase: Inserindo operador...", novoOperador);
        
        const { data, error } = await supabase
            .from('operadores')
            .insert([{
                nome: nome?.toUpperCase(),
                funcao: funcao?.toUpperCase(),
                produtividade_base: produtividadeBase,
                tipo_comissao: tipoComissao,
                alvo_comissao: alvoComissao,
                login: login || null,
                senha: senha || null,
                perfil: perfil?.toUpperCase(),
                turno: turno?.toUpperCase(),
                maquina_preferencial_id: maquina_preferencial_id || null,
                produto_preferencial_id: produto_preferencial_id || null,
                turno_preferencial_id: turno_preferencial_id || null,
                ativo: true
            }])
            .select();

        if (error) {
            console.error('Erro Supabase (Insert Operador):', error);
        } else {
            console.log("Supabase: Operador inserido com sucesso!");
            fetchDados(); // Atualiza a lista
        }
        return { data, error };
    };

    const updateOperador = async (id, dados) => {
        const { 
            nome, funcao, turno, produtividadeBase, tipoComissao, alvoComissao, login, senha, perfil,
            maquina_preferencial_id, produto_preferencial_id, turno_preferencial_id 
        } = dados;
        console.log("Supabase: Atualizando operador ID:", id, dados);

        const { data, error } = await supabase
            .from('operadores')
            .update({
                nome: nome?.toUpperCase(),
                funcao: funcao?.toUpperCase(),
                produtividade_base: produtividadeBase,
                tipo_comissao: tipoComissao,
                alvo_comissao: alvoComissao,
                login: login || null,
                senha: senha || null,
                perfil: perfil?.toUpperCase(),
                turno: turno?.toUpperCase(),
                maquina_preferencial_id: maquina_preferencial_id || null,
                produto_preferencial_id: produto_preferencial_id || null,
                turno_preferencial_id: turno_preferencial_id || null
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro Supabase (Update Operador):', error);
        } else {
            console.log("Supabase: Operador atualizado com sucesso!");
            fetchDados();
        }
        return { data, error };
    };

    const addMaquina = async (novaMaquina) => {
        const payload = {
            ...novaMaquina,
            nome: novaMaquina.nome?.toUpperCase(),
            setor: novaMaquina.setor?.toUpperCase()
        };
        const { data, error } = await supabase.from('maquinas').insert([payload]).select();
        if (error) console.error('Erro ao adicionar máquina:', error);
        else fetchDados();
        return { data, error };
    };

    const updateMaquina = async (id, dados) => {
        const { data, error } = await supabase
            .from('maquinas')
            .update(dados)
            .eq('id', id)
            .select();
        if (error) console.error('Erro ao atualizar máquina:', error);
        else fetchDados();
        return { data, error };
    };

    const addProduto = async (novoProduto) => {
        const payload = {
            nome: novoProduto.nome?.toUpperCase(),
            tipo: novoProduto.tipo?.toUpperCase(),
            divisor: parseFloat(novoProduto.divisor) || 100
        };
        const { data, error } = await supabase.from('produtos').insert([payload]).select();
        if (error) console.error('Erro ao adicionar produto:', error);
        else fetchDados();
        return { data, error };
    };

    const updateProduto = async (id, dados) => {
        const payload = {
            nome: dados.nome?.toUpperCase(),
            tipo: dados.tipo?.toUpperCase(),
            divisor: parseFloat(dados.divisor) || 100
        };
        const { data, error } = await supabase.from('produtos').update(payload).eq('id', id).select();
        if (error) console.error('Erro ao atualizar produto:', error);
        else fetchDados();
        return { data, error };
    };

    const addTurno = async (dados) => {
        const { data, error } = await supabase.from('turnos').insert([dados]).select();
        if (error) console.error('Erro ao adicionar turno:', error);
        else fetchDados();
        return { data, error };
    };

    const updateTurno = async (id, dados) => {
        const { data, error } = await supabase.from('turnos').update(dados).eq('id', id).select();
        if (error) console.error('Erro ao atualizar turno:', error);
        else fetchDados();
        return { data, error };
    };

    const removeTurno = async (id) => {
        const { error } = await supabase.from('turnos').update({ ativo: false }).eq('id', id);
        if (error) console.error('Erro ao remover turno:', error);
        else fetchDados();
    };

    const removeOperador = async (id) => {
        // Soft delete para manter histórico
        const { error } = await supabase.from('operadores').update({ ativo: false }).eq('id', id);
        if (error) console.error('Erro ao remover operador:', error);
        else fetchDados();
    };

    const removeMaquina = async (id) => {
        const { error } = await supabase.from('maquinas').delete().eq('id', id);
        if (error) console.error('Erro ao remover máquina:', error);
        else fetchDados();
    };

    const removeProduto = async (id) => {
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (error) console.error('Erro ao remover produto:', error);
        else fetchDados();
    };

    // --- Ação de Lançamento ---
    const lancarProducao = async (dados) => {
        // Prepara o objeto para o banco (Snake Case)
        const payload = {
            operador_id: parseInt(dados.operadorId), // Atenção: O ID deve vir do form
            maquina_id: dados.maquinaId ? parseInt(dados.maquinaId) : null,
            produto_id: dados.produtoId ? parseInt(dados.produtoId) : null,
            turno_id: dados.turnoId ? parseInt(dados.turnoId) : null,
            quantidade: parseFloat(dados.quantidade),
            data_registro: new Date().toISOString()
        };

        // Removi campos visuais (operadorNome, etc) pois o banco só quer IDs

        const { error } = await supabase
            .from('producao_lancamentos')
            .insert([payload]);

        if (error) {
            console.error('Erro ao lançar:', error);
            alert('Erro ao salvar no banco!');
            return false;
        } else {
            fetchDados(); // Atualiza a lista lateral
            return true;
        }
    };

    const getRelatorio = async (dataInicio, dataFim) => {
        // Ajusta dataFim para o final do dia
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('producao_lancamentos')
            .select('*, operadores(nome, funcao, produtividade_base), maquinas(nome), produtos(nome, tipo)')
            .gte('data_registro', new Date(dataInicio).toISOString())
            .lte('data_registro', fim.toISOString())
            .order('data_registro', { ascending: true });

        if (error) {
            console.error('Erro no relatório:', error);
            return [];
        }
        return data; // Retorna dados puros com joins
    };

    return (
        <ProducaoContext.Provider value={{
            produtos, maqs: maquinas, maquinas, // Alias para compatibilidade
            operadores, turnos,
            lancamentos, loading,
            addOperador, updateOperador, addMaquina, updateMaquina, addProduto,
            addTurno, updateTurno, removeTurno,
            removeOperador, removeMaquina, removeProduto, updateProduto,
            lancarProducao,
            getRelatorio,
            carregarMaisLancamentos, temMais
        }}>
            {children}
        </ProducaoContext.Provider>
    );
};
