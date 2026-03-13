import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Efeito para carregar usuário do localStorage na inicialização
    useEffect(() => {
        const loadUser = async () => {
            const storedUser = localStorage.getItem('dash_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // Verificação extra: Checar se o usuário ainda existe/é válido no Supabase
                    const { data, error } = await supabase
                        .from('operadores')
                        .select('*')
                        .eq('id', parsedUser.id)
                        .eq('ativo', true) // Garante que não está demitido
                        .single();

                    if (data && !error) {
                        setUser(data);
                        // Atualiza o localStorage com dados frescos caso tenha mudado perfil/nome
                        localStorage.setItem('dash_user', JSON.stringify(data));
                    } else {
                        // Se não existe mais ou foi desativado, limpa o cache
                        console.warn('Usuário em cache inválido ou desativado.');
                        localStorage.removeItem('dash_user');
                    }
                } catch (e) {
                    console.error('Erro ao processar usuário do cache:', e);
                    localStorage.removeItem('dash_user');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (loginName, senha) => {
        try {
            // Busca usuário pelo login
            const { data, error } = await supabase
                .from('operadores')
                .select('*')
                .eq('login', loginName) // Case sensitive no banco, idealmente normalizar antes
                .eq('senha', senha) // Em produção real, usar hash/bcrypt e Auth do Supabase
                .eq('ativo', true)
                .single();

            if (error || !data) {
                console.error('Login falhou:', error || 'Usuário não encontrado');
                // Retorna a mensagem real do erro para debug (ex: 500, Network Error, RLS)
                const msg = error ? (error.message || JSON.stringify(error)) : 'Usuário não encontrado.';
                return { success: false, message: msg };
            }

            console.log('Login realizado com sucesso:', data);

            // Sucesso! Salva no estado e no cache
            setUser(data);
            localStorage.setItem('dash_user', JSON.stringify(data));
            return { success: true, user: data };

        } catch (err) {
            console.error('Erro no login:', err);
            return { success: false, message: 'Erro de conexão: ' + (err.message || err) };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dash_user');
        window.location.href = '/login'; // Força recarregamento limpo
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
