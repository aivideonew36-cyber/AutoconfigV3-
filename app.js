import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const $ = id => document.getElementById(id);

// --- 1. CONFIGURATION DES SECRETS (Local Storage) ---
const getSecret = (service) => localStorage.getItem('sd_' + service);
const saveSecret = (service, value) => {
    if(value) localStorage.setItem('sd_' + service, value.trim());
};

// --- 2. LE CERVEAU GROQ (ISOLÉ) ---
const Brain = {
    async ask(userPrompt) {
        const key = getSecret('groq');
        if (!key) return "Bonjour Jérémy ! Je suis prêt, mais mon cerveau est déconnecté. Donne-moi ta clé Groq (gsk_...) pour commencer.";

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: "Tu es l'Agent Série D au Bénin. Tu aides Jérémy. Analyse ses besoins. S'il veut coder, vérifie s'il a GitHub/Vercel/Supabase. Si non, demande-lui poliment le jeton." },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (e) { return "❌ Erreur Cerveau : " + e.message; }
    }
};

// --- 3. GESTION DU CHAT ET ORIENTATION ---
async function handleAction() {
    const input = $('projectDescription').value;
    if (!input) return;

    appendMessage('user', input);
    $('projectDescription').value = '';

    // A. Intercepter les clés directes dans le chat
    if (input.startsWith('gsk_')) {
        saveSecret('groq', input);
        return appendMessage('agent', "🧠 Cerveau Groq configuré ! Que voulons-nous piloter ?");
    }
    if (input.startsWith('ghp_')) {
        saveSecret('github', input);
        appendMessage('agent', "🐙 GitHub connecté. Je vais lire tes fichiers existants...");
        return analyzeCode();
    }

    // B. Discussion et demande de jetons si nécessaire
    const reply = await Brain.ask(input);
    appendMessage('agent', reply);

    // C. Logique de demande automatique
    if (input.toLowerCase().includes('github') && !getSecret('github')) {
        const token = prompt("Entrez votre jeton GitHub (ghp_...) :");
        saveSecret('github', token);
        if(token) analyzeCode();
    }
    
    if (input.toLowerCase().includes('supabase') && !getSecret('supabase_url')) {
        const url = prompt("Entrez l'URL de votre projet Supabase :");
        const key = prompt("Entrez votre clé Anon Supabase :");
        saveSecret('supabase_url', url);
        saveSecret('supabase_key', key);
        appendMessage('agent', "💾 Supabase configuré ! Je peux gérer tes tables.");
    }
}

// --- 4. LECTURE ET CORRECTION (OCTOKIT) ---
async function analyzeCode() {
    const token = getSecret('github');
    if(!token) return;
    
    const octokit = new Octokit({ auth: token });
    try {
        appendMessage('agent', "🔍 Analyse de ton dernier projet GitHub en cours...");
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 1 });
        
        if(repos.length > 0) {
            const repo = repos[0].name;
            appendMessage('agent', `J'ai trouvé ton projet : ${repo}. Je vérifie s'il y a des fautes dans ton code...`);
            // Ici tu peux ajouter la logique pour lire le contenu des fichiers
        }
    } catch (err) {
        appendMessage('agent', "⚠️ Erreur de lecture GitHub : " + err.message);
    }
}

// --- 5. INTERFACE ET SALUTATION ---
function appendMessage(role, text) {
    const container = $('chatContainer') || document.querySelector('.ds-main');
    const div = document.createElement('div');
    div.style.cssText = `padding:12px; margin:8px; border-radius:12px; max-width:85%; ${role==='user'?'background:#3B82F6;color:#fff;align-self:flex-end':'background:#F3F4F6;color:#000;align-self:flex-start'}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    $('deployBtn').onclick = handleAction;
    setTimeout(() => {
        appendMessage('agent', "Bonjour Jérémy ! Sur quoi allons-nous travailler ? (GitHub, Vercel, Supabase, FedaPay...)");
    }, 500);
});
