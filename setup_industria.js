import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Connection String (Pode ser parametrizada via ENV)
const connectionString = 'postgresql://postgres:RRDMhNycrDFMxdIl@db.upernlulsbswchlcjqkr.supabase.co:5432/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function setupIndustria() {
    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL com sucesso!');

        const sqlPath = path.join(__dirname, 'MIGRATION_INDUSTRIA.sql');

        if (!fs.existsSync(sqlPath)) {
            throw new Error('Arquivo MIGRATION_INDUSTRIA.sql não encontrado!');
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executando migração de Indústria (V4)...');
        console.log('   - Criando estrutura de Ativos (Setor > Máquina > Equipamento)');
        console.log('   - Configurando Horímetros e Planos de Preventiva');

        await client.query(sqlContent);

        console.log('✅ Migração executada com sucesso!');

    } catch (err) {
        console.error('❌ Erro ao configurar banco de Indústria:', err);
    } finally {
        await client.end();
    }
}

setupIndustria();
