const { handleMessage } = require('./messageHandler')

// Simple mock implementations to measure timing
function makeMockMessage({from, body, timestamp}){
    return {
        from,
        body,
        timestamp,
        type: 'chat',
        reacted: false,
        react() { this.reacted = true; this.reactTime = Date.now(); return Promise.resolve(); },
        getChat() { return Promise.resolve({ name: `Grupo de Teste ${from.split('@')[0]}` }); }
    };
}

async function runSimulation() {
    console.log('Iniciando simulação: múltiplas mensagens concorrentes');

    const nowSec = Math.floor(Date.now() / 1000);

    // Simular N pessoas no mesmo grupo enviando mensagens com rotas
    const SIM_COUNT = parseInt(process.env.SIM_COUNT || '10', 10);
    const groupId = '111222333-999@g.us';
    const senders = Array.from({length: SIM_COUNT}, (_, i) => `user${i}@c.us`);

    const messages = senders.map((s, i) => makeMockMessage({
        from: groupId,
        body: i % 2 === 0 ? 'Rota: Taguatinga Norte disponível' : 'rotas disponiveis Aguas Claras',
        timestamp: nowSec // use realistic timestamp so tempoDesdeCriacao is meaningful
    }));

    const results = [];

    // Run all handlers nearly concurrently
    await Promise.all(messages.map(async (m, idx) => {
        const start = Date.now();
            await handleMessage(m, {
            react: (msg) => { msg.react(); },
            getChat: (msg) => msg.getChat(),
                sendMessage: (to, text) => { results.push({from: m.from, sentTo: to, text, time: Date.now()}); return Promise.resolve(); },
            nowFn: () => Date.now(),
            debug: true,
                meuNumero: '5561985123885@c.us'
        });
        const end = Date.now();
        return { idx, took: end - start };
    }));

    console.log('Simulação finalizada. Resumo:');
    console.log(`Total sendMessage chamadas: ${results.length}`);
    results.forEach((r, i) => console.log(`${i+1}. from=${r.from} to=${r.sentTo} time=${r.time} text=${r.text.slice(0,40)}...`));
}

runSimulation().catch(e => console.error(e));
