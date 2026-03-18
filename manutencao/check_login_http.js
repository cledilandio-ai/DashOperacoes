
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upernlulsbswchlcjqkr.supabase.co';
const supabaseKey = 'sb_publishable_H9bx1dVuclKRyMkR5jKlFw_3x18BX6h'; // Anon Key from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminHttp() {
    console.log('📡 Connecting to Supabase via HTTP...');

    try {
        // 1. Try to fetch the admin user
        const { data, error } = await supabase
            .from('operadores')
            .select('*')
            .eq('login', 'admin')
            .single();

        if (error) {
            console.error('❌ Error fetching admin:', error.message);
            if (error.code === 'PGRST116') {
                console.log('⚠️ Admin user does not exist. Attempting to create...');
                // Create admin
                const { error: insertError } = await supabase
                    .from('operadores')
                    .insert([
                        {
                            nome: 'Administrador',
                            funcao: 'Gerente',
                            login: 'admin',
                            senha: '1234',
                            perfil: 'ADMIN',
                            ativo: true
                        }
                    ]);

                if (insertError) {
                    console.error('❌ Error creating admin:', insertError.message);
                } else {
                    console.log('✅ Admin user created successfully!');
                }
            }
        } else {
            console.log('✅ Admin user found:', {
                id: data.id,
                nome: data.nome,
                perfil: data.perfil,
                ativo: data.ativo,
                senha: data.senha // Show current password
            });

            // Force reset password to remove any doubt
            if (data.senha !== '1234') {
                console.log('⚠️ Password mismatch! Resetting to 1234...');
                const { error: updateError } = await supabase
                    .from('operadores')
                    .update({ senha: '1234' })
                    .eq('id', data.id);

                if (updateError) console.error('❌ Error resetting password:', updateError.message);
                else console.log('✅ Password reset to 1234.');
            } else {
                console.log('✅ Password is correct (1234).');
            }

            if (!data.ativo) {
                console.log('⚠️ Admin is inactive. activating...');
                await supabase.from('operadores').update({ ativo: true }).eq('id', data.id);
                console.log('✅ Admin activated.');
            }
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

checkAdminHttp();
