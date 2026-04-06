const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./messageHandler.js');

// ⚙️ Variáveis de Ambiente
const botId = process.env.BOT_ID || 'bot-padrao';
const numeroAviso = process.env.NUMERO_AVISO;
const inicioTurno = parseInt(process.env.INICIO_TURNO) || 19;
const fimTurno = parseInt(process.env.FIM_TURNO) || 13;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser', // ISSO AQUI É O QUE ESTÁ FALTANDO
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        timeout: 60000 
    }
});

client.on('ready', async () => {
    console.log(`\n🚀 [${botId}] Conectado na NOVA ARQUITETURA MODULAR!`);
    console.log(`🕒 [${botId}] Escala: ${inicioTurno}h às ${fimTurno}h.`);
});

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));

client.on('message', async msg => {
    
    // 🔥 GATILHO DE TESTE DE ESTRESSE
    if (msg.body === '!teste50') {
        console.log("\n🔥 TESTE DE ESTRESSE: 50 BINGOS NA NOVA ARQUITETURA!");
        for (let i = 0; i < 50; i++) {
            const fakeMsg = { ...msg, type: 'chat', from: `556100000000-123456${i}@g.us`, body: 'águas claras ' + i, timestamp: Math.floor(Date.now() / 1000) };
            
            // Injeta dependências simuladas para o teste rodar liso sem travar o WhatsApp
            handleMessage(fakeMsg, {
                react: () => {}, 
                getChat: async () => ({ name: `Grupo Simulado ${i}` }),
                sendMessage: async (num, texto) => console.log(`Disparo Simulado ${i} OK`), // Não manda pro zap pra não floodar seu celular no teste
                nowFn: Date.now,
                debug: false,
                meuNumero: numeroAviso
            });
        }
        return; 
    }

    // 🕒 Trava de Horário (O motor decide se o cérebro vai trabalhar)
    const dataBrasilia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hora = dataBrasilia.getHours();
    const dia = dataBrasilia.getDay();

    let estaAtivo = false;
    if (dia >= 1 && dia <= 5) {
        if (inicioTurno > fimTurno) {
            if (hora >= inicioTurno || hora < fimTurno) estaAtivo = true;
        } else {
            if (hora >= inicioTurno && hora < fimTurno) estaAtivo = true;
        }
    }

    // Se estiver dormindo ou for mensagem privada, ignora e nem chama o handler
    if (!estaAtivo || msg.type !== 'chat' || !msg.from.endsWith('@g.us')) return;

    // 🧠 PASSA A BOLA PRO CÉREBRO (messageHandler)
    handleMessage(msg, {
        react: (m) => m.react('👍'),
        getChat: (m) => m.getChat(),
        // Interceptamos o envio para adicionar a tag do [BOT-1] ou [BOT-2] no aviso
        sendMessage: (num, texto) => {
            const textoComBotId = texto.replace('TRANSPORTES!*', `TRANSPORTES!* [${botId.toUpperCase()}]`);
            return client.sendMessage(num, textoComBotId);
        },
        nowFn: Date.now,
        debug: true, // Deixa true para vermos aquela tabela de ms maravilhosa no terminal
        meuNumero: numeroAviso
    });
});

client.initialize();