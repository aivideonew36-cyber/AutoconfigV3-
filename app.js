import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const $ = id => document.getElementById(id);

// --- 1. GESTION DES SECRETS (STOCKAGE LOCAL) ---
const getSecret = (service) => localStorage.getItem('sd_' + service);
const saveSecret = (service, value) => {
    if(value) localStorage.setItem('sd_' + service, value.trim());
};

// --- 2. CONFIGURATION DU CERVEAU (GROQ) À PART ---
window.saveGroqKey = () => {
    const key = $('groqInput').value.trim();
    const status = $('groqStatus');

    if (key.startsWith('gsk_')) {
        saveSecret('groq', key);
        status.innerText = "✅ Cerveau Opérationnel";
        status.style.color = "#4ade80";
        
        // Nettoyage de l'écran d'accueil
        if($('welcomeText')) $('welcomeText').style.display = 'none';
        if($('welcomeLogo')) $('welcomeLogo').style.display = 'none';
        
        appendMessage('agent', "Bonjour Jérémy ! Mon cerveau est activé. Dis-moi ce que tu veux faire (ex: 'Vérifie mon GitHub' ou 'Configure Supabase').");
    } else {
        alert("❌ Erreur : La clé doit commencer par gsk_");
    }
};

// --- 3. SYSTÈME DE CHAT ---
function appendMessage(role, text) {
    const container = $('chatContainer') || document.querySelector('.ds-main');
    
    if($('welcomeText')) $('welcomeText').style.display = 'none';
    if($('welcomeLogo')) $('welcomeLogo').style.display = 'none';

    const div = document.createElement('div');
    div.style.cssText = `padding:12px; margin:8px; border-radius:12px; max-width:85%; font-size:14px; line-height:1.4; ${role==='user'?'background:#3B82F6;color:#fff;align-self:flex-end':'background:#1e293b;color:#fff;border:1px solid #334155;align-self:flex-start'}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- 4. LE CERVEAU INTELLIGENT (GROQ) ---
const Brain = {
    async ask(userPrompt) {
        const key = getSecret('groq');
        if (!key) return "Je ne peux pas réfléchir sans ma clé. Configure le 'Cerveau' en haut de la page.";

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: "Tu es l'Agent Série D. Tu aides Jérémy à coder au Bénin. Si une action nécessite GitHub ou Supabase et que le jeton manque, demande-le lui." },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) { return "❌ Erreur de connexion au cerveau : " + e.message; }
    }
};

// --- 5. PILOTAGE ET DÉTECTION DES BESOINS ---
async function handleAction() {
    const input = $('projectDescription').value;
    if (!input) return;

    appendMessage('user', input);
    $('projectDescription').value = '';

    // Détection automatique : GitHub
    if (input.toLowerCase().includes('github') && !getSecret('github')) {
        const token = prompt("🤖 Jérémy, entre ton jeton GitHub (ghp_...) pour que je puisse lire ton code :");
        if(token) { 
            saveSecret('github', token); 
            appendMessage('agent', "✅ Jeton enregistré ! Je lance l'analyse de tes fichiers...");
            return analyzeCode(); 
        }
    }
    
    // Détection automatique : Supabase
    if (input.toLowerCase().includes('supabase') && !getSecret('supabase_url')) {
        const url = prompt("🤖 Entre l'URL de ton projet Supabase :");
        const key = prompt("🤖 Entre ta clé Anon Supabase :");
        if(url && key) {
            saveSecret('supabase_url', url);
            saveSecret('supabase_key', key);
            appendMessage('agent', "💾 Supabase configuré ! Je suis prêt à gérer tes tables.");
            return;
        }
    }

    // Si tout est ok, on laisse le cerveau répondre
    const reply = await Brain.ask(input);
    appendMessage('agent', reply);
}

// --- 6. LECTURE AUTOMATIQUE (OCTOKIT) ---
async function analyzeCode() {
    const token = getSecret('github');
    if(!token) return;
    
    const octokit = new Octokit({ auth: token });
    try {
        // L'agent cherche ton dernier projet modifié sans que tu ne donnes de lien
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 1 });
        
        if(repos.length > 0) {
            const repoName = repos[0].name;
            appendMessage('agent', `🔍 J'ai trouvé ton projet : ${repoName}. Je vérifie s'il y a des fautes...`);
            
            // Ici l'agent pourrait lire le index.html pour proposer des corrections
        } else {
            appendMessage('agent', "❓ Je n'ai trouvé aucun projet sur ton GitHub.");
        }
    } catch (err) {
        appendMessage('agent', "⚠️ Erreur technique GitHub : " + err.message);
    }
}

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    $('deployBtn').onclick = handleAction;
    
    // Charger la config existante
    const savedGroq = getSecret('groq');
    if (savedGroq) {
        if($('groqStatus')) {
            $('groqStatus').innerText = "✅ Cerveau Opérationnel";
            $('groqStatus').style.color = "#4ade80";
        }
        if($('groqInput')) $('groqInput').value = savedGroq;
    }

    setTimeout(() => {
        appendMessage('agent', "Prêt à travailler ! Configure mon cerveau en haut ou pose-moi une question.");
    }, 800);
});
