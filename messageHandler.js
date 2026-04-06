// Pure message handler for testing and production (injected deps)
// Exports: handleMessage(msg, deps)

// Normalize text (remove diacritics, trim, toLowerCase)
function normalizeText(s) {
    return (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

// Config
const GROUP_NAME_TTL = 1000 * 60 * 5; // 5 minutes

const RAW_REGIOES_IGNORADAS = [
    "planaltina", "estância", "vale do amanhecer", "sobradinho",
    "nova colina", "fercal", "itapoã", "jardim botânico", "lago sul",
    "cruzeiro", "sudoeste", "octogonal", "estrutural",
    "scia", "sia", "arniqueiras", "riacho fundo", "bandeirante",
    "candangolândia", "pôr do sol", "por do sol", "sol nascente", "volumoso",
    "samambaia", "ceilândia", "ceilandia", "guará", "guara", "taguatinga sul"
];

const RAW_REGIOES_ACEITAS = [
    "aguas claras", "águas claras",
    "vicente pires", "vp",
    "jockey", "vicente jockey", "joquei",
    "colonia agricola", "colônia agrícola", "colonia", "colônia",
    "taguatinga norte", "taguatinga", "taguatingua", "rotas", "rota", "rotas disponivel", "rotas disponiveis"
];

const REGIOES_IGNORADAS_NORMALIZADAS = RAW_REGIOES_IGNORADAS.map(t => normalizeText(t).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim());
const REGIOES_ACEITAS_NORMALIZADAS = RAW_REGIOES_ACEITAS.map(t => normalizeText(t).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim());

// In-memory cache for group names when deps.getChat is expensive
const groupNameCache = new Map();

async function handleMessage(msg, deps = {}) {
    // deps: { react, getChat, sendMessage, nowFn, debug, meuNumero }
    const reactFn = deps.react || (m => m.react('👍'));
    const getChatFn = deps.getChat || (m => m.getChat());
    const sendMessageFn = deps.sendMessage || (() => Promise.resolve());
    const now = deps.nowFn || (() => Date.now());
    const DEBUG = !!deps.debug;
    const MEU_NUMERO_PESSOAL = deps.meuNumero || null;

    if (!msg || msg.type !== 'chat') return;
    if (!msg.from || !msg.body) return;

    // Time window logic: allow caller to bypass; default accept
    // For testing, skip time checks unless provided

    const text = msg.body || '';
    const mensagem = text.toLowerCase();
    if (!mensagem) return;

    const mensagemNormalizada = normalizeText(mensagem).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');

    for (let i = 0; i < REGIOES_IGNORADAS_NORMALIZADAS.length; i++) {
        if (mensagemNormalizada.includes(REGIOES_IGNORADAS_NORMALIZADAS[i])) return;
    }

    for (let i = 0; i < REGIOES_ACEITAS_NORMALIZADAS.length; i++) {
        const ace = REGIOES_ACEITAS_NORMALIZADAS[i];
        if (mensagemNormalizada.includes(ace)) {
            try {
                const startReactTime = now();
                const messageTime = (msg.timestamp * 1000) || startReactTime;

                const chatId = msg.from;

                // React immediately (don't await)
                try { reactFn(msg); } catch (e) { /* swallow */ }

                const cached = groupNameCache.get(chatId);
                const useCache = cached && (now() - cached.ts) < GROUP_NAME_TTL;
                const chat = useCache ? { name: cached.name } : await getChatFn(msg);
                if (!useCache && chat && chat.name) {
                    groupNameCache.set(chatId, { name: chat.name, ts: now() });
                }

                const nomeDoGrupo = (chat && chat.name) || '';

                // Fire-and-forget send with formatted content (group, rota, horário)
                if (MEU_NUMERO_PESSOAL) {
                    const horarioBrasilia = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                    const mensagemEnvio = `🚚 *ROTA ENCONTRADA!*\n\n👥 *Grupo:* ${nomeDoGrupo}\n✅ *Rota:* ${text}\n🕒 *Horário:* ${horarioBrasilia}`;
                    sendMessageFn(MEU_NUMERO_PESSOAL, mensagemEnvio).catch(()=>{});
                }

                if (DEBUG) {
                    const endReactTime = now();
                    const tempoDesdeCriacao = endReactTime - messageTime;
                    const tempoExatoBot = endReactTime - startReactTime;
                    const atrasoChegadaMsg = startReactTime - messageTime;
                    console.log('BINGO', { texto: text, tempoDesdeCriacao, tempoExatoBot, atrasoChegadaMsg });
                }
            } catch (error) {
                if (DEBUG) console.error('Erro handler:', error && error.message ? error.message : error);
            }
            break;
        }
    }
}

module.exports = { handleMessage };
