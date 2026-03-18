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

async function updateIndustriaV42() {
    try {
        await client.connect();
        console.log('✅ Conectado ao PostgreSQL com sucesso!');

        const sqlPath = path.join(__dirname, 'MIGRATION_INDUSTRIA_V4_2.sql');

        if (!fs.existsSync(sqlPath)) {
            throw new Error('Arquivo MIGRATION_INDUSTRIA_V4_2.sql não encontrado!');
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Executando migração de Indústria (V4.2)...');
        console.log('   - Adicionando Configuração de Uso Diário (horas_uso_diario)');
        console.log('   - Adicionando Datas de Execução/Próxima Estimada');

        await client.query(sqlContent);

        console.log('✅ Migração V4.2 executada com sucesso!');

    } catch (err) {
        console.error('❌ Erro ao configurar banco de Indústria:', err);
    } finally {
        await client.end();
    }
}

updateIndustriaV42();
