import https from 'https';

const url = 'https://manut.dynamicsistem.com.br/login';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Find forms or CSRF tokens in the HTML
        const formMatch = data.match(/<form[^>]*>([\s\S]*?)<\/form>/i);
        if (formMatch) {
            console.log("Formulário encontrado:");
            const inputs = formMatch[1].match(/<input[^>]*>/gi);
            if (inputs) {
                inputs.forEach(input => console.log(input));
            } else {
                console.log("No inputs found");
            }
        } else {
            console.log("No form found. Might be a JS rendered app.");
            console.log(data.substring(0, 1000));
        }
    });
}).on('error', err => {
    console.error("Error fetching login page:", err.message);
});
