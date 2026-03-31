import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const $ = id => document.getElementById(id);

// --- 1. LE SYSTÈME DE MÉMOIRE (LocalStorage) ---
const getSecret = (key) => localStorage.getItem('sd_' + key);
const saveSecret = (key, val) => localStorage.setItem('sd_' + key, val.trim());

// --- 2. L'INTERFACE DE DISCUSSION ---
function appendMessage(role, text) {
    const container = $('chatContainer') || document.querySelector('.ds-main');
    if($('welcomeText')) $('welcomeText').style.display = 'none';
    
    const div = document.createElement('div');
    div.style.padding = "12px";
    div.style.margin = "8px";
    div.style.borderRadius = "12px";
    div.style.maxWidth = "85%";
    div.style.backgroundColor = role === 'user' ? '#3B82F6' : '#F3F4F6';
    div.style.color = role === 'user' ? 'white' : 'black';
    div.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
    div.style.display = "block";
    div.innerText = text;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- 3. LE CERVEAU (GROQ) SÉPARÉ ---
async function callBrain(prompt) {
    const key = getSecret('groq');
    if(!key) return "Bonjour Jérémy ! Je suis prêt, mais je n'ai pas encore mon cerveau (Clé Groq). Peux-tu me la donner pour que je puisse t'aider ?";

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {role: 'system', content: "Tu es l'Agent Série D. Tu guides Jérémy. Si l'utilisateur donne un token (GitHub, Vercel, etc.), confirme l'enregistrement. Si l'utilisateur dit bonjour, analyse ses besoins et demande les jetons manquants amicalement."},
                    {role: 'user', content: prompt}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "❌ Erreur de connexion au cerveau : " + e.message; }
}

// --- 4. LA LOGIQUE DE PILOTAGE (L'ORIENTATION) ---
async function handleUserAction() {
    const input = $('projectDescription').value;
    if(!input) return;

    appendMessage('user', input);
    $('projectDescription').value = '';

    // Détection automatique des Jetons dans le chat
    if(input.includes('ghp_')) {
        saveSecret('github', input);
        return appendMessage('agent', "✅ Jeton GitHub enregistré ! Je vais maintenant lire tes dépôts pour voir si tout est correct.");
    }
    if(input.includes('gsk_')) {
        saveSecret('groq', input);
        return appendMessage('agent', "🧠 Cerveau Groq activé ! Bonjour Jérémy, comment puis-je t'orienter maintenant ?");
    }

    // Discussion et Analyse
    const reply = await callBrain(input);
    appendMessage('agent', reply);

    // Si on a le jeton GitHub, on peut lire les fichiers existants
    if(getSecret('github') && (input.toLowerCase().includes('vérifie') || input.toLowerCase().includes('lire'))) {
        analyzeExistingCode();
    }
}

// --- 5. LECTURE ET CORRECTION (OCTOKIT) ---
async function analyzeExistingCode() {
    const token = getSecret('github');
    const octokit = new Octokit({ auth: token });
    appendMessage('agent', "🔍 Lecture de tes fichiers en cours sur GitHub...");
    
    try {
        // Ici l'agent va lister tes dépôts et lire le code pour proposer des corrections
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 1 });
        if(repos.length > 0) {
            appendMessage('agent', `J'ai trouvé ton projet : ${repos[0].name}. Je commence l'analyse pour détecter des erreurs...`);
        }
    } catch (err) {
        appendMessage('agent', "⚠️ Impossible de lire GitHub. Vérifie ton jeton.");
    }
}

// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    $('deployBtn').onclick = handleUserAction;
    
    // Message d'accueil automatique
    setTimeout(() => {
        appendMessage('agent', "Bonjour Jérémy ! Je suis ton assistant Série D. Que veux-tu configurer ou coder aujourd'hui ?");
    }, 1000);
});

window.toggleMenu = () => $('sideMenu').classList.toggle('open');
window.showTokens = () => { alert("Utilise le chat pour me donner tes clés, c'est plus rapide !"); window.toggleMenu(); };
                 
