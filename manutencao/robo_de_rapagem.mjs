/**
 * 🤖 TEMPLATE BASE DE RASPAGEM (WEB SCRAPING) - DYNAMICS
 * 
 * Você pode usar este modelo para extrair Peças, O.S., Funcionários, etc.
 * Ele já possui a lógica de conexão com o navegador Chrome/Edge local e o login automático.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';

// Função para encontrar automaticamente o Chrome ou Edge do Windows
function getBrowserPath() {
    let paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (let path of paths) {
        if (fs.existsSync(path)) return path;
    }
    return null;
}

(async () => {
    const browserPath = getBrowserPath();
    if (!browserPath) {
        console.error("Nenhum navegador encontrado!");
        process.exit(1);
    }

    try {
        console.log("🚀 Abrindo navegador invisível...");
        const browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: 'new', // Use false se quiser VER o robô trabalhando
            args: ['--window-size=1280,720']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        
        // --- 1. LOGIN ---
        console.log("🔑 Logando no Dynamics...");
        await page.goto('https://manut.dynamicsistem.com.br/usuarios/login', { waitUntil: 'load' });
        await page.waitForSelector('#email');
        await page.type('#email', 'gerencia@cafeserragrande.com.br'); // Troque se necessário
        await page.type('#senha', 'ger_123');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
            page.click('button[type="submit"]')
        ]);
        console.log("✅ Login concluído!");

        // --- 2. NAVEGAR PARA A PÁGINA DESEJADA ---
        // Exemplo: trocar /man-maquinas para /pecas ou /os
        const urlAlvo = 'https://manut.dynamicsistem.com.br/man-maquinas'; // Substitua pelo link correto
        
        // Loop de Paginação Genérico
        let paginaAtual = 1;
        let todosOsDados = [];
        let temProximaPagina = true;

        while (temProximaPagina) {
            console.log(`Puxando página ${paginaAtual}...`);
            await page.goto(`${urlAlvo}?page=${paginaAtual}`, { waitUntil: 'networkidle2' });
            
            // Extrai a tabela
            const dadosPagina = await page.evaluate(() => {
                const table = document.querySelector('table');
                if (!table) return [];
                
                const rows = Array.from(table.querySelectorAll('tr'));
                if (rows.length <= 1) return []; // Só o cabeçalho
                
                const headers = Array.from(rows[0].querySelectorAll('th, td')).map(h => h.innerText.trim());
                return rows.slice(1).map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    let rowData = {};
                    cells.forEach((cell, i) => { rowData[headers[i]] = cell.innerText.trim(); });
                    return rowData;
                });
            });

            // Se voltar vazio, acabaram as páginas
            if (dadosPagina.length === 0) {
                console.log("Fim dos registros!");
                temProximaPagina = false;
                break;
            }

            todosOsDados.push(...dadosPagina);
            paginaAtual++;
            
            // Segurança contra loop infinito
            if (paginaAtual > 50) break;
        }

        // --- 3. SALVAR RESULTADOS ---
        const nomeArquivo = 'extracao_generica.json';
        fs.writeFileSync(nomeArquivo, JSON.stringify(todosOsDados, null, 2));
        console.log(`🎉 Extração Finalizada! ${todosOsDados.length} itens salvos em ${nomeArquivo}.`);

        await browser.close();
    } catch (e) {
        console.error("Erro no robô:", e);
        process.exit(1);
    }
})();
