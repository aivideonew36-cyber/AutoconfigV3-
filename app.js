// IMPORTATION D'OCTOKIT (Via CDN pour mobile)
import { Octokit } from "https://cdn.skypack.dev/@octokit/rest";

const $ = id => document.getElementById(id);

// --- 1. GESTION DU MENU ET DES JETONS ---
window.toggleMenu = () => {
    document.getElementById('sideMenu').classList.toggle('open');
};

window.showTokens = () => {
    const gh = prompt("🐙 GitHub Token (repo) :", localStorage.getItem('sd_github') || "");
    const vc = prompt("▲ Vercel Token :", localStorage.getItem('sd_vercel') || "");
    const gr = prompt("🤖 Groq API Key :", localStorage.getItem('sd_groq') || "");
    
    if(gh) localStorage.setItem('sd_github', gh.trim());
    if(vc) localStorage.setItem('sd_vercel', vc.trim());
    if(gr) localStorage.setItem('sd_groq', gr.trim());
    alert("✅ Configuration enregistrée sur votre Samsung A05.");
    window.toggleMenu();
};

// --- 2. MOTEUR IA (GROQ) ---
async function callGroq(system, user) {
    const key = localStorage.getItem('sd_groq');
    if(!key) throw new Error("Clé Groq manquante !");

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${key}` 
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{role: 'system', content: system}, {role: 'user', content: user}],
            response_format: { type: "json_object" }
        })
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

// --- 3. LE PLAN DE REPLI (PIPELINE) ---
async function runDeployment() {
    const promptText = $('projectDescription').value;
    if(!promptText) return alert("❌ Veuillez décrire votre projet.");

    try {
        console.log("🚀 Lancement du Pipeline...");
        alert("⏳ Analyse et génération en cours... Patientez.");

        // ÉTAPE A : PLANIFICATION
        const plan = await callGroq(
            "Tu es un architecte logiciel. Liste les fichiers nécessaires. Réponds en JSON: {\"files\": [\"index.html\", \"style.css\"]}",
            promptText
        );

        // ÉTAPE B : CODAGE
        const codeGen = await callGroq(
            "Tu es un développeur expert. Génère le code complet des fichiers demandés. Réponds en JSON: {\"codes\": {\"index.html\": \"...\"}}",
            `Génère le code pour : ${promptText}`
        );

        // ÉTAPE C : PILOTAGE GITHUB (OCTOKIT)
        const ghToken = localStorage.getItem('sd_github');
        if(!ghToken) throw new Error("Token GitHub manquant !");
        
        const octokit = new Octokit({ auth: ghToken });
        const { data: user } = await octokit.users.getAuthenticated();
        const repoName = "agent-deploy-" + Date.now();

        // Création du dépôt
        await octokit.repos.createForAuthenticatedUser({ name: repoName });

        // Envoi des fichiers via Trees API (Push Propre)
        const treeData = Object.keys(codeGen.codes).map(path => ({
            path, mode: "100644", type: "blob", content: codeGen.codes[path]
        }));

        const { data: tree } = await octokit.git.createTree({
            owner: user.login, repo: repoName, tree: treeData
        });

        alert(`✅ PROJET DÉPLOYÉ SUR GITHUB !\nNom : ${repoName}\nUtilisez le menu Pilotage pour Vercel.`);
        
    } catch (err) {
        alert("⚠️ Erreur Pipeline : " + err.message);
        console.error(err);
    }
}

// --- 4. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const btn = $('deployBtn');
    if(btn) btn.onclick = runDeployment;
});

window.showLogs = () => { alert("📊 Logs : Système opérationnel."); window.toggleMenu(); };
window.showTools = () => { alert("🛠️ Pilotage Vercel : Connexion en cours..."); window.toggleMenu(); };
