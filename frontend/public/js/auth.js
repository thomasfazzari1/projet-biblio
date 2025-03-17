// frontend/public/js/auth.js
let estConnexion = true;

const elements = {
    boutonAuth: document.getElementById('authButton'),
    modalAuth: document.getElementById('authModal'),
    fermerModal: document.getElementById('closeModal'),
    formAuth: document.getElementById('authForm'),
    changementMode: document.getElementById('switchMode'),
    titreModal: document.getElementById('modalTitle'),
    texteEnvoi: document.getElementById('submitText'),
    conteneurMenu: document.getElementById('menuContainer')
};

export function adapterNav(infoUtilisateur) {
    elements.conteneurMenu.innerHTML = `
        <div class="flex items-center gap-6">
            ${!infoUtilisateur.est_developpeur ? `
            <div class="flex items-center gap-2 text-gray-300">
                <i class="bi bi-coin text-yellow-500"></i>
                <span class="font-semibold">${infoUtilisateur.credits}</span>
            </div>
            
            <button 
                onclick="getCreditQuotidien()" 
                class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l"
            >
                Crédit Quotidien
            </button>
            ` : ''}
            
            <a href="/auteurs" 
               class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l">
                Auteurs
            </a>
        </div>
        
        <div class="flex items-center gap-6">
            ${infoUtilisateur.est_developpeur ? `
            <a href="/espace-dev" class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l">
                Espace Développeur
            </a>
            ` : ''}
            
            <button 
                onclick="logout()" 
                class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l"
            >
                Déconnexion
            </button>
        </div>
    `;
}

function basculerModal() {
    const modalAuth = document.getElementById('authModal');
    if (modalAuth) {
        modalAuth.classList.toggle('hidden');
    }
}

function basculerMode() {
    estConnexion = !estConnexion;
    elements.titreModal.textContent = estConnexion ? 'Connexion' : 'Inscription';
    elements.changementMode.textContent = estConnexion ? 'Créer un compte' : 'Déjà inscrit ?';
    elements.texteEnvoi.textContent = estConnexion ? 'Se connecter' : "S'inscrire";
}

async function gererAuth(e) {
    e.preventDefault();
    const formData = new FormData(elements.formAuth);
    const donnees = {
        email: formData.get('email'),
        mdp: formData.get('mdp')
    };

    try {
        const endpoint = estConnexion ? '/auth/connexion' : '/auth/inscription';
        const reponse = await fetch(`http://localhost:8000${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(donnees),
            credentials: 'include'
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            throw new Error(resultat.message || 'Erreur d\'authentification');
        }

        if (resultat.token) {
            localStorage.setItem('token', resultat.token);
            const infoUtilisateur = JSON.parse(atob(resultat.token.split('.')[1]));
            adapterNav(infoUtilisateur);
            basculerModal();
            elements.formAuth.reset();
            window.dispatchEvent(new Event('tokenUpdated'));
        }
    } catch (erreur) {
        console.error('Erreur:', erreur);
        alert(erreur.message);
    }
}

async function deconnexion() {
    try {
        const reponse = await fetch('http://localhost:3000/deconnexion', {
            method: 'POST',
            credentials: 'include'
        });

        if (!reponse.ok) {
            throw new Error('Erreur lors de la déconnexion');
        }

        localStorage.removeItem('token');

        const conteneurMenu = document.getElementById('menuContainer');
        if (conteneurMenu) {
            conteneurMenu.innerHTML = `
                <a href="/auteurs" 
                   class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l">
                    Auteurs
                </a>
                <button 
                    id="authButton" 
                    class="text-gray-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                    <i class="bi bi-person-fill"></i>
                    Se connecter
                </button>
            `;

            document.getElementById('authButton')?.addEventListener('click', basculerModal);
        }

        window.dispatchEvent(new Event('tokenUpdated'));
    } catch (erreur) {
        console.error('Erreur lors de la déconnexion:', erreur);
        alert(erreur.message);
    }
}

async function getCreditQuotidien() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vous devez être authentifié pour récuperer votre crédit');
        }

        const infoUtilisateur = JSON.parse(atob(token.split('.')[1]));

        const reponse = await fetch(`http://localhost:8000/credits/recharge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: infoUtilisateur.id
            }),
            credentials: 'include'
        });

        const resultat = await reponse.json();

        if (!reponse.ok) {
            throw new Error(resultat.message);
        }

        if (resultat.success && resultat.token) {
            localStorage.setItem('token', resultat.token);
            const nouvelInfoUtilisateur = JSON.parse(atob(resultat.token.split('.')[1]));
            adapterNav(nouvelInfoUtilisateur);
            window.dispatchEvent(new Event('tokenUpdated'));
        }
        alert(resultat.message);
    } catch (erreur) {
        alert(erreur.message);
    }
}

window.getCreditQuotidien = getCreditQuotidien;
window.toggleModal = basculerModal;
window.logout = deconnexion;

function initialiserEventsAuth() {
    const boutonAuth = document.getElementById('authButton');
    const fermerModal = document.getElementById('closeModal');
    const changementMode = document.getElementById('switchMode');
    const formAuth = document.getElementById('authForm');

    boutonAuth?.addEventListener('click', basculerModal);
    fermerModal?.addEventListener('click', basculerModal);
    changementMode?.addEventListener('click', basculerMode);
    formAuth?.addEventListener('submit', gererAuth);

    const token = localStorage.getItem('token');
    if (token) {
        try {
            const infoUtilisateur = JSON.parse(atob(token.split('.')[1]));
            adapterNav(infoUtilisateur);
        } catch (erreur) {
            console.error('Erreur lors du chargement du token:', erreur);
            localStorage.removeItem('token');
        }
    }
}

document.addEventListener('DOMContentLoaded', initialiserEventsAuth);

window.addEventListener('tokenUpdated', () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const infoUtilisateur = JSON.parse(atob(token.split('.')[1]));
            adapterNav(infoUtilisateur);
        } catch (erreur) {
            console.error('Erreur lors du décodage du token:', erreur);
        }
    } else {
        const conteneurMenu = document.getElementById('menuContainer');
        if (conteneurMenu) {
            conteneurMenu.innerHTML = `
                <a href="/auteurs" 
                   class="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-l">     
                    Auteurs
                </a>
                <button 
                    id="authButton" 
                    class="text-gray-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                    <i class="bi bi-person-fill"></i>
                    Se connecter
                </button>
            `;
            document.getElementById('authButton')?.addEventListener('click', basculerModal);
        }
    }
});