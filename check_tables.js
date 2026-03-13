
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upernlulsbswchlcjqkr.supabase.co';
const supabaseKey = 'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h'; // Anon Key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('🔍 Checking Manutencao tables...');

    const { error } = await supabase
        .from('manutencoes')
        .select('id')
        .limit(1);

    if (error) {
        console.error('❌ Table "manutencoes" check failed:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('🚨 Critical: Maintenance tables are MISSING! You need to run MIGRATION_MANUTENCAO.sql');
        }
    } else {
        console.log('✅ Table "manutencoes" exists.');
    }
}

checkTables();
