// IMPORTATION D'OCTOKIT (Via CDN pour mobile)
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const $ = id => document.getElementById(id);

// --- 1. GESTION DU MENU ET DES JETONS ---
window.toggleMenu = () => {
    document.getElementById('sideMenu').classList.toggle('open');
};

window.showTokens = () => {
    const gh = prompt("🐙 GitHub Token :", localStorage.getItem('sd_github') || "");
    const vc = prompt("▲ Vercel Token :", localStorage.getItem('sd_vercel') || "");
    const gr = prompt("🧠 Groq API Key (LE CERVEAU) :", localStorage.getItem('sd_groq') || "");
    const sb = prompt("💾 Supabase Access Token :", localStorage.getItem('sd_supabase') || "");
    
    if(gh) localStorage.setItem('sd_github', gh.trim());
    if(vc) localStorage.setItem('sd_vercel', vc.trim());
    if(gr) localStorage.setItem('sd_groq', gr.trim());
    if(sb) localStorage.setItem('sd_supabase', sb.trim());
    
    alert("✅ Configuration enregistrée. Le Cerveau est prêt !");
    window.toggleMenu();
};

// --- 2. LE CERVEAU (DISCUSSION & ORIENTATION) ---
async function handleChat() {
    const userInput = $('projectDescription').value;
    if(!userInput) return;

    appendMessage('user', userInput);
    $('projectDescription').value = '';

    const key = localStorage.getItem('sd_groq');
    if(!key) {
        appendMessage('agent', "⚠️ Je n'ai pas mon cerveau (clé Groq). Va dans le menu ☰ pour me l'ajouter !");
        return;
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {role: 'system', content: "Tu es l'Agent Série D. Tu aides Jérémy au Bénin. Si Jérémy veut créer ou coder, réponds en commençant par le mot-clé [ACTION]. Sinon, discute amicalement et guide-le sur ses jetons."},
                    {role: 'user', content: userInput}
                ]
            })
        });

        const data = await response.json();
        const reply = data.choices[0].message.content;

        appendMessage('agent', reply);

        // Si le cerveau décide qu'il faut coder
        if(reply.includes('[ACTION]') || userInput.toLowerCase().includes('code') || userInput.toLowerCase().includes('déploie')) {
            runDeployment(userInput);
        }

    } catch (err) {
        appendMessage('agent', "❌ Erreur : " + err.message);
    }
}

// --- 3. LES BRAS (PIPELINE OCTOKIT) ---
async function runDeployment(instruction) {
    appendMessage('agent', "🚀 [Pipeline] Je prépare le code et je pousse sur GitHub...");
    // Ici ton code Octokit actuel prend le relais...
    // (Conserve ta logique existante de runDeployment ici)
}

// --- FONCTION D'AFFICHAGE DES MESSAGES ---
function appendMessage(role, text) {
    const container = $('chatContainer') || document.querySelector('.ds-main');
    const div = document.createElement('div');
    div.style.padding = "12px";
    div.style.margin = "8px";
    div.style.borderRadius = "12px";
    div.style.backgroundColor = role === 'user' ? '#3B82F6' : '#E5E7EB';
    div.style.color = role === 'user' ? 'white' : 'black';
    div.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
    div.innerText = text.replace('[ACTION]', '');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- 4. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const btn = $('deployBtn');
    if(btn) btn.onclick = handleChat;
});
    
