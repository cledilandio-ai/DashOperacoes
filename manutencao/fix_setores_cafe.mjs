import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upernlulsbswchlcjqkr.supabase.co';
const supabaseKey = 'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h'; // Anon Key
const supabase = createClient(supabaseUrl, supabaseKey);

async function mesclarSetores() {
    console.log('🔄 Iniciando mesclagem dos galpões "CAFE" (15) e "CAFÉ" (22)...');
    const idPrincipal = 15;
    const idSecundario = 22;

    // 1. Transferir Máquinas
    const { error: errMaq } = await supabase
        .from('maquinas')
        .update({ setor_id: idPrincipal })
        .eq('setor_id', idSecundario);
    
    if (!errMaq) console.log('✅ Máquinas transferidas para o ID 15.');
    else console.error('❌ Erro as máquinas:', errMaq.message);

    // 2. Transferir Equipamentos soltos do setor
    const { error: errEq } = await supabase
        .from('equipamentos')
        .update({ setor_id: idPrincipal })
        .eq('setor_id', idSecundario);
        
    if (!errEq) console.log('✅ Equipamentos (soltos) transferidos para o ID 15.');
    else console.error('❌ Erro nos equipamentos:', errEq.message);

    // 3. Sub-setores (qualquer setor que fosse filho do 22 vira filho do 15)
    const { error: errFilhos } = await supabase
        .from('setores')
        .update({ pai_id: idPrincipal })
        .eq('pai_id', idSecundario);

    if (!errFilhos) console.log('✅ Sub-setores transferidos para o ID 15.');
    else console.error('❌ Erro nos sub-setores:', errFilhos.message);

    // 4. Padronizar o nome do 15 para "CAFÉ" (com acento se preferir)
    // C. Custo costuma ser "CAFÉ", vamos forçar maiúsculo COM acento.
    const { error: errNome } = await supabase
        .from('setores')
        .update({ nome: 'CAFÉ' })
        .eq('id', idPrincipal);

    if (!errNome) console.log('✅ Nome do Galpão 15 atualizado para "CAFÉ".');

    // 5. Excluir o 22 original
    const { error: errDel } = await supabase
        .from('setores')
        .delete()
        .eq('id', idSecundario);

    if (!errDel) console.log('✅ Setor ID 22 ("CAFE" antigo) excluído com sucesso!');
    else console.error('❌ Erro ao excluir 22:', errDel.message);
    
    console.log('🎉 Mesclagem concluída!');
}

mesclarSetores();
