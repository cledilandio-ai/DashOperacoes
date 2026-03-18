import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://upernlulsbswchlcjqkr.supabase.co';
const supabaseKey = 'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h'; // Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function importMaquinas() {
    console.log('🚀 Iniciando script de importação...');
    const rawData = fs.readFileSync('maquinas_dynamics_todas.json', 'utf8');
    const data = JSON.parse(rawData);
    console.log(`📦 Lidas ${data.length} máquinas do arquivo JSON.`);

    // 1. Fetch current setores
    const { data: setores, error: errSetores } = await supabase.from('setores').select('*');
    if (errSetores) {
        console.error('❌ Erro carregando setores:', errSetores.message);
        process.exit(1);
    }

    let setoresMap = {}; // 'NOME_DO_SETOR' -> id
    for (const s of setores) {
        setoresMap[s.nome.toUpperCase()] = s.id;
    }

    let countInseridas = 0;
    let countIgnoradas = 0;

    // 2. Loop insert
    for (const item of data) {
        if (!item.Maquina) continue;

        const cCustoRaw = item['C. Custo'] || 'GERAL';
        const cCusto = cCustoRaw.toUpperCase().trim();
        const nome = item.Maquina.toUpperCase().trim();
        let tag = item.Codigo ? item.Codigo.toUpperCase().trim() : null;
        if (tag === '') tag = null;

        // Ensure Setor/Galpão exists
        let setorId = setoresMap[cCusto];
        if (!setorId) {
            console.log(`🏗️ Criando novo Galpão/Setor raiz: ${cCusto}`);
            const { data: novoSetor, error: errNew } = await supabase.from('setores').insert([{
                nome: cCusto,
                tipo: 'GALPAO',
                descricao: 'Importado do Dynamics'
            }]).select().single();
            
            if (errNew) {
                console.error(`❌ Erro ao criar setor ${cCusto}:`, errNew.message);
                continue;
            }
            setorId = novoSetor.id;
            setoresMap[cCusto] = setorId;
        }

        // Check if machine already exists
        const { data: exist } = await supabase
            .from('maquinas')
            .select('id')
            .eq('nome', nome)
            .maybeSingle();

        if (exist) {
            console.log(`⏭️ Ignorando máquina já existente: ${nome}`);
            countIgnoradas++;
            continue;
        }

        // Insert Machine
        const payload = {
            nome: nome,
            tag: tag,
            status_atual: 'DISPONIVEL',
            horas_uso_diario: 8,
            descricao: `Importado do Dynamics ID: ${item.Id}`
        };

        // Attempt insert with setor_id first (V5 architecture)
        let { error: errInsert } = await supabase.from('maquinas').insert([{ ...payload, setor_id: setorId }]);
        
        if (errInsert && errInsert.message.includes('setor_id')) {
            // Fallback for older schema if V5 wasn't run
            console.log(`⚠️ Tabela sem setor_id detectada (migration V5 pendente?). Usando coluna 'setor' texto...`);
            let resp = await supabase.from('maquinas').insert([{ ...payload, setor: cCusto }]);
            errInsert = resp.error;
        }

        if (errInsert) {
            console.error(`❌ Erro inserindo máquina ${nome}:`, errInsert.message);
        } else {
            console.log(`✅ Máquina importada: ${nome} (Tag: ${tag || 'N/A'})`);
            countInseridas++;
        }
    }

    console.log(`\n🎉 IMPORTAÇÃO FINALIZADA!`);
    console.log(`   - Sucesso: ${countInseridas} novas máquinas.`);
    console.log(`   - Ignoradas: ${countIgnoradas} já existiam no banco.`);
}

importMaquinas();
