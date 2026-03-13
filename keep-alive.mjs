/**
 * keep-alive.mjs — Anti-Pause do Supabase
 *
 * Registra atividade no banco de dados para evitar a pausa automática.
 */

import { createClient } from '@supabase/supabase-js';

// Usando variáveis de ambiente (Sincronizado com os nomes do GitHub Secrets)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://upernlulsbswchlcjqkr.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function keepAlive() {
    console.log(`🏓 Iniciando keep-alive — ${new Date().toLocaleString('pt-BR')}`);

    // Tenta inserir uma nova linha (O banco cuidará do ID auto-incremento)
    const { data, error } = await supabase
        .from('keep_alive_log')
        .insert({ ping: new Date().toISOString() })
        .select();

    if (error) {
        console.error('❌ Erro no keep-alive:', error.message);
        console.error('DICA: Verifique se você rodou o NOVO SQL de correção para permitir histórico.');
        process.exit(1);
    }

    console.log(`✅ Sucesso! Novo ping registrado às: ${new Date(data[0].ping).toLocaleString('pt-BR')}`);
}

keepAlive();
