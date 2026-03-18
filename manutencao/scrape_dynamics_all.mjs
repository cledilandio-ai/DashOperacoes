import puppeteer from 'puppeteer-core';
import fs from 'fs';

let browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(browserPath)) {
    browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
}

(async () => {
    try {
        console.log("🚀 Iniciando Puppeteer para raspagem de TODAS as máquinas...");
        const browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');
        
        console.log("🌐 Navegando para o login...");
        await page.goto('https://manut.dynamicsistem.com.br/usuarios/login', { waitUntil: 'load', timeout: 30000 });
        
        console.log("🔑 Logando...");
        await page.waitForSelector('#email', { timeout: 10000 });
        await page.type('#email', 'gerencia@cafeserragrande.com.br');
        await page.type('#senha', 'ger_123');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
            page.click('button[type="submit"]')
        ]);
        
        let allMachines = [];
        let currentPage = 1;
        let keepGoing = true;

        while (keepGoing && currentPage <= 20) { // Limit to 20 pages max just in case
            console.log(`🌐 Buscando máquinas da página ${currentPage}...`);
            await page.goto(`https://manut.dynamicsistem.com.br/man-maquinas?page=${currentPage}`, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // Wait for table to guarantee it loaded
            await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
            
            const data = await page.evaluate(() => {
                const table = document.querySelector('table');
                if (!table) return [];
                
                const rows = Array.from(table.querySelectorAll('tr'));
                if (rows.length <= 1) return []; // Só Thead
                
                const headerRow = rows[0].querySelectorAll('th, td');
                let headers = Array.from(headerRow).map((h, i) => h.innerText.trim() || `col_${i}`);
                
                return rows.slice(1).map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    let rowData = {};
                    cells.forEach((cell, i) => {
                        rowData[headers[i]] = cell.innerText.trim();
                    });
                    return rowData;
                });
            });
            
            if (data.length === 0) {
                console.log(`   - Fim da paginação. Nenhuma máquina nova achada na página ${currentPage}.`);
                keepGoing = false;
            } else {
                console.log(`   + ${data.length} máquinas encontradas na página ${currentPage}`);
                // Verify if it's the exact same data as the previous page (some sites ignore `?page=999` and return page 1)
                const isDuplicate = allMachines.length > 0 && allMachines[allMachines.length - 1].Id === data[data.length - 1].Id;
                
                if (isDuplicate) {
                    console.log(`   - Página duplicada detectada. Chegamos ao fim.`);
                    keepGoing = false;
                } else {
                    allMachines.push(...data);
                    currentPage++;
                }
            }
        }
        
        const validData = allMachines.filter(d => Object.keys(d).length > 0 && Object.values(d).some(v => v !== ''));
        fs.writeFileSync('maquinas_dynamics_todas.json', JSON.stringify(validData, null, 2));
        console.log(`✅ Sucesso Absoluto! ${validData.length} máquinas exportadas para maquinas_dynamics_todas.json`);
        
        await browser.close();
    } catch (e) {
        console.error("❌ Erro fatal no script:", e);
        process.exit(1);
    }
})();
