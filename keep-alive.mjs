/**
 * keep-alive.mjs — Anti-Pause do Supabase
 *
 * Faz um upsert em keep_alive_log via API REST do Supabase (HTTPS),
 * compatível com o nível gratuito (sem acesso direto à porta 5432).
 *
 * Executado diariamente pelo GitHub Actions.
 * Pode ser rodado manualmente: node keep-alive.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ||
    'https://upernlulsbswchlcjqkr.supabase.co';

const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function keepAlive() {
    console.log(`🏓 Iniciando keep-alive — ${new Date().toISOString()}`);

    const { data, error } = await supabase
        .from('keep_alive_log')
        .upsert({ id: 1, ping: new Date().toISOString() }, { onConflict: 'id' })
        .select();

    if (error) {
        // Se a tabela não existir ainda, tenta criar via SQL
        if (error.code === '42P01') {
            console.warn('⚠️  Tabela keep_alive_log não existe. Crie-a no Supabase SQL Editor:');
            console.warn(`
CREATE TABLE IF NOT EXISTS keep_alive_log (
    id   INTEGER PRIMARY KEY DEFAULT 1,
    ping TIMESTAMPTZ DEFAULT NOW(),
    CHECK (id = 1)
);
INSERT INTO keep_alive_log (id, ping) VALUES (1, NOW());
            `);
            process.exit(1);
        }
        console.error('❌ Erro no keep-alive:', error.message);
        process.exit(1);
    }

    console.log(`✅ Keep-alive registrado: ${data?.[0]?.ping}`);
}

keepAlive();
