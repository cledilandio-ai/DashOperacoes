/**
 * keep-alive.mjs — Anti-Pause do Supabase
 *
 * Registra atividade no banco de dados para evitar a pausa automática.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ||
    'https://upernlulsbswchlcjqkr.supabase.co';

const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function keepAlive() {
    console.log(`🏓 Iniciando keep-alive — ${new Date().toLocaleString('pt-BR')}`);

    // Alterado de .upsert para .insert para criar uma NOVA linha sempre (histórico fácil de ver)
    const { data, error } = await supabase
        .from('keep_alive_log')
        .insert({ ping: new Date().toISOString() })
        .select();

    if (error) {
        console.error('❌ Erro no keep-alive:', error.message);
        process.exit(1);
    }

    console.log(`✅ Sucesso! Novo ping registrado às: ${new Date(data[0].ping).toLocaleString('pt-BR')}`);
    console.log(`📊 Total de registros na tabela agora: (Verifique no Dashboard do Supabase)`);
}

keepAlive();
