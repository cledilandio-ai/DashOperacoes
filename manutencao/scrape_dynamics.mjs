import puppeteer from 'puppeteer-core';
import fs from 'fs';

let browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(browserPath)) {
    browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
}

(async () => {
    try {
        console.log("🚀 Iniciando Puppeteer...");
        const browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        
        console.log("🌐 Navegando para o login...");
        await page.goto('https://manut.dynamicsistem.com.br/usuarios/login?redirect=%2Fman-maquinas', { waitUntil: 'load', timeout: 30000 });
        
        console.log("🔑 Inserindo credenciais...");
        await page.waitForSelector('#email', { timeout: 10000 });
        await page.type('#email', 'gerencia@cafeserragrande.com.br');
        await page.type('#senha', 'ger_123');
        
        console.log("🖱️ Clicando no botão de Login e aguardando navegação...");
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => console.log('Timeout navigation login, mas segue o jogo...')),
            page.click('button[type="submit"]')
        ]);
        
        console.log("🌐 Garantindo navegação para máquinas...");
        await page.goto('https://manut.dynamicsistem.com.br/man-maquinas', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("⏳ Aguardando a tabela...");
        // Wait specifically for table and some rows
        await page.waitForSelector('table tr td', { timeout: 15000 }).catch((e) => {
            console.log("Tabela não carregou a tempo ou página errada:", e.message);
        });
        
        const pageHTML = await page.content();
        fs.writeFileSync('debug_man_maquinas.html', pageHTML);
        
        console.log("📊 Lendo dados da tabela...");
        const data = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (!table) return null;
            
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length === 0) return [];
            
            // Header
            const headerRow = rows[0].querySelectorAll('th, td');
            let headers = Array.from(headerRow).map((h, i) => h.innerText.trim() || `col_${i}`);
            
            // Data
            return rows.slice(1).map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                let rowData = {};
                cells.forEach((cell, i) => {
                    rowData[headers[i]] = cell.innerText.trim();
                });
                return rowData;
            });
        });
        
        if (!data || data.length === 0) {
            console.log("❌ Tabela vazia ou não encontrada. Veja debug_man_maquinas.html.");
        } else {
            // Remove empty records if any
            const validData = data.filter(d => Object.keys(d).length > 0 && Object.values(d).some(v => v !== ''));
            fs.writeFileSync('maquinas_dynamics.json', JSON.stringify(validData, null, 2));
            console.log(`✅ Sucesso! ${validData.length} máquinas exportadas para maquinas_dynamics.json`);
        }
        
        await browser.close();
    } catch (e) {
        console.error("❌ Erro fatal no script:", e);
        process.exit(1);
    }
})();
